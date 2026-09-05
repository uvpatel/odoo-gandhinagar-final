import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import {
  contracts,
  employees,
  departments,
  jobPositions,
  workingSchedules,
  salaryStructures,
  payslips,
} from "@/db/schema";
import {
  requirePermission,
  AuthorizationError,
  getAuthSession,
  getCurrentEmployee,
} from "@/lib/auth/authorization";
import { eq, sql, desc, ilike, and, or, gte, lte } from "drizzle-orm";
import { checkContractOverlap } from "@/server/services/payroll/contract-resolver";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request.headers);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const departmentId = searchParams.get("departmentId");
    const status = searchParams.get("status");
    const startDateFrom = searchParams.get("startDateFrom");
    const startDateTo = searchParams.get("startDateTo");
    const q = searchParams.get("q");

    const userRole = (session.user as { role?: string })?.role;
    const currentEmp = await getCurrentEmployee(session.user.id);

    const conditions = [];

    // If regular employee role, restrict to their own contracts
    if (
      userRole === "employee" ||
      !["admin", "hr_manager", "payroll_manager", "payroll_user"].includes(userRole || "")
    ) {
      if (currentEmp) {
        conditions.push(eq(contracts.employeeId, currentEmp.id));
      } else {
        return NextResponse.json({ data: [] });
      }
    } else if (employeeId && employeeId !== "all") {
      conditions.push(eq(contracts.employeeId, employeeId));
    }

    if (departmentId && departmentId !== "all") {
      conditions.push(eq(contracts.departmentId, departmentId));
    }

    if (status && status !== "all") {
      if (status === "expiring") {
        const todayStr = new Date().toISOString().split("T")[0];
        const sixtyDaysLater = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        conditions.push(
          and(
            eq(contracts.status, "active"),
            gte(contracts.endDate, todayStr),
            lte(contracts.endDate, sixtyDaysLater)
          )
        );
      } else {
        conditions.push(eq(contracts.status, status as any));
      }
    }

    if (startDateFrom) {
      conditions.push(gte(contracts.startDate, startDateFrom));
    }

    if (startDateTo) {
      conditions.push(lte(contracts.startDate, startDateTo));
    }

    if (q) {
      const search = `%${q}%`;
      conditions.push(
        or(
          ilike(contracts.contractNumber, search),
          ilike(employees.firstName, search),
          ilike(employees.lastName, search),
          ilike(employees.employeeNumber, search)
        )
      );
    }

    const data = await db
      .select({
        id: contracts.id,
        contractNumber: contracts.contractNumber,
        employeeId: contracts.employeeId,
        employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`.as("employee_name"),
        employeeNumber: employees.employeeNumber,
        startDate: contracts.startDate,
        endDate: contracts.endDate,
        departmentId: contracts.departmentId,
        departmentName: departments.name,
        jobPositionId: contracts.jobPositionId,
        jobTitle: jobPositions.title,
        workingScheduleId: contracts.workingScheduleId,
        workingScheduleName: workingSchedules.name,
        salaryStructureId: contracts.salaryStructureId,
        salaryStructureName: salaryStructures.name,
        wage: contracts.wage,
        currency: contracts.currency,
        status: contracts.status,
        createdAt: contracts.createdAt,
        updatedAt: contracts.updatedAt,
      })
      .from(contracts)
      .leftJoin(employees, eq(contracts.employeeId, employees.id))
      .leftJoin(departments, eq(contracts.departmentId, departments.id))
      .leftJoin(jobPositions, eq(contracts.jobPositionId, jobPositions.id))
      .leftJoin(workingSchedules, eq(contracts.workingScheduleId, workingSchedules.id))
      .leftJoin(salaryStructures, eq(contracts.salaryStructureId, salaryStructures.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(contracts.startDate), desc(contracts.createdAt));

    return NextResponse.json({ data });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to fetch contracts" },
      { status: errorStatus }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission("contract", "create", request.headers);
    const body = await request.json();

    if (!body.employeeId || !body.startDate || body.wage === undefined) {
      return NextResponse.json(
        { error: "Employee, start date, and wage are required terms" },
        { status: 400 }
      );
    }

    const wageNum = Number(body.wage);
    if (isNaN(wageNum) || wageNum <= 0) {
      return NextResponse.json(
        { error: "Wage must be a valid positive number" },
        { status: 400 }
      );
    }

    if (body.endDate && body.endDate < body.startDate) {
      return NextResponse.json(
        { error: "Contract end date cannot precede start date" },
        { status: 400 }
      );
    }

    // Verify employee exists
    const [emp] = await db
      .select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName })
      .from(employees)
      .where(eq(employees.id, body.employeeId))
      .limit(1);

    if (!emp) {
      return NextResponse.json(
        { error: "Selected employee not found in database" },
        { status: 400 }
      );
    }

    // Overlap prevention (Server-side validation)
    if ((body.status || "draft") !== "cancelled") {
      const overlapCheck = await checkContractOverlap({
        employeeId: body.employeeId,
        startDate: body.startDate,
        endDate: body.endDate || null,
      });

      if (overlapCheck.hasOverlap) {
        return NextResponse.json(
          {
            error: overlapCheck.message || "Contract dates overlap with an existing contract for this employee.",
          },
          { status: 409 }
        );
      }
    }

    // Auto-generate reference number if not provided
    let contractNumber = body.contractNumber?.trim();
    if (!contractNumber) {
      const year = new Date().getFullYear();
      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(contracts);
      const nextNum = (countResult?.count || 0) + 1;
      contractNumber = `CON-${year}-${String(nextNum).padStart(4, "0")}`;
    }

    const [newContract] = await db
      .insert(contracts)
      .values({
        contractNumber,
        employeeId: body.employeeId,
        startDate: body.startDate,
        endDate: body.endDate || null,
        departmentId: body.departmentId || null,
        jobPositionId: body.jobPositionId || null,
        workingScheduleId: body.workingScheduleId || null,
        salaryStructureId: body.salaryStructureId || null,
        wage: String(wageNum),
        currency: body.currency || "INR",
        status: body.status || "draft",
      })
      .returning();

    return NextResponse.json({ data: newContract }, { status: 201 });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to create contract" },
      { status: errorStatus }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requirePermission("contract", "update", request.headers);
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "Contract ID is required" }, { status: 400 });
    }

    const [existing] = await db.select().from(contracts).where(eq(contracts.id, body.id)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const effectiveStartDate = body.startDate !== undefined ? body.startDate : existing.startDate;
    const effectiveEndDate = body.endDate !== undefined ? body.endDate : existing.endDate;
    const effectiveStatus = body.status !== undefined ? body.status : existing.status;
    const effectiveEmployeeId = body.employeeId !== undefined ? body.employeeId : existing.employeeId;

    if (effectiveEndDate && effectiveEndDate < effectiveStartDate) {
      return NextResponse.json(
        { error: "Contract end date cannot precede start date" },
        { status: 400 }
      );
    }

    if (body.wage !== undefined) {
      const wageNum = Number(body.wage);
      if (isNaN(wageNum) || wageNum <= 0) {
        return NextResponse.json(
          { error: "Wage must be a valid positive number" },
          { status: 400 }
        );
      }
    }

    // Overlap prevention on update
    if (effectiveStatus !== "cancelled") {
      const overlapCheck = await checkContractOverlap({
        employeeId: effectiveEmployeeId,
        startDate: effectiveStartDate,
        endDate: effectiveEndDate || null,
        excludeContractId: body.id,
      });

      if (overlapCheck.hasOverlap) {
        return NextResponse.json(
          {
            error: overlapCheck.message || "Updated contract dates overlap with an existing contract for this employee.",
          },
          { status: 409 }
        );
      }
    }

    const [updatedContract] = await db
      .update(contracts)
      .set({
        contractNumber: body.contractNumber ? body.contractNumber.trim() : undefined,
        employeeId: body.employeeId !== undefined ? body.employeeId : undefined,
        startDate: body.startDate !== undefined ? body.startDate : undefined,
        endDate: body.endDate !== undefined ? (body.endDate || null) : undefined,
        departmentId: body.departmentId !== undefined ? (body.departmentId || null) : undefined,
        jobPositionId: body.jobPositionId !== undefined ? (body.jobPositionId || null) : undefined,
        workingScheduleId: body.workingScheduleId !== undefined ? (body.workingScheduleId || null) : undefined,
        salaryStructureId: body.salaryStructureId !== undefined ? (body.salaryStructureId || null) : undefined,
        wage: body.wage !== undefined ? String(Number(body.wage)) : undefined,
        currency: body.currency !== undefined ? body.currency : undefined,
        status: body.status !== undefined ? body.status : undefined,
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, body.id))
      .returning();

    return NextResponse.json({ data: updatedContract });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to update contract" },
      { status: errorStatus }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission("contract", "delete", request.headers);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Contract ID is required" }, { status: 400 });
    }

    // Safety check: Prevent deleting historical contracts that are tied to existing payslips
    const [linkedPayslip] = await db
      .select({ id: payslips.id, payslipNumber: payslips.payslipNumber })
      .from(payslips)
      .where(eq(payslips.contractId, id))
      .limit(1);

    if (linkedPayslip) {
      return NextResponse.json(
        {
          error: `Cannot delete contract because it is referenced by payroll records (Payslip ${linkedPayslip.payslipNumber}). Historical contracts with payroll records must be preserved for auditability. Change the contract status to Expired or Terminated instead.`,
        },
        { status: 409 }
      );
    }

    await db.delete(contracts).where(eq(contracts.id, id));
    return NextResponse.json({ message: "Contract deleted successfully" });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to delete contract" },
      { status: errorStatus }
    );
  }
}
