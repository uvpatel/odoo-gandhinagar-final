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
import { eq, sql } from "drizzle-orm";
import { checkContractOverlap } from "@/server/services/payroll/contract-resolver";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  try {
    const session = await getAuthSession(request.headers);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contractId } = await params;
    const userRole = (session.user as { role?: string })?.role;
    const currentEmp = await getCurrentEmployee(session.user.id);

    const [contract] = await db
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
      .where(eq(contracts.id, contractId))
      .limit(1);

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    // IDOR protection: if ordinary employee, can only view own contract
    if (
      userRole === "employee" ||
      !["admin", "hr_manager", "payroll_manager", "payroll_user"].includes(userRole || "")
    ) {
      if (!currentEmp || currentEmp.id !== contract.employeeId) {
        return NextResponse.json(
          { error: "Forbidden: You cannot view other employees' contracts" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ data: contract });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json({ error: error.message || "Failed to fetch contract" }, { status: errorStatus });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  try {
    await requirePermission("contract", "update", request.headers);
    const { contractId } = await params;
    const body = await request.json();

    const [existing] = await db.select().from(contracts).where(eq(contracts.id, contractId)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const effectiveStartDate = body.startDate !== undefined ? body.startDate : existing.startDate;
    const effectiveEndDate = body.endDate !== undefined ? body.endDate : existing.endDate;
    const effectiveStatus = body.status !== undefined ? body.status : existing.status;
    const effectiveEmployeeId = body.employeeId !== undefined ? body.employeeId : existing.employeeId;

    if (effectiveEndDate && effectiveEndDate < effectiveStartDate) {
      return NextResponse.json({ error: "Contract end date cannot precede start date" }, { status: 400 });
    }

    if (body.wage !== undefined) {
      const wageNum = Number(body.wage);
      if (isNaN(wageNum) || wageNum <= 0) {
        return NextResponse.json({ error: "Wage must be a valid positive number" }, { status: 400 });
      }
    }

    // Overlap prevention on update
    if (effectiveStatus !== "cancelled") {
      const overlapCheck = await checkContractOverlap({
        employeeId: effectiveEmployeeId,
        startDate: effectiveStartDate,
        endDate: effectiveEndDate || null,
        excludeContractId: contractId,
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

    const [updated] = await db
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
      .where(eq(contracts.id, contractId))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json({ error: error.message || "Failed to update contract" }, { status: errorStatus });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  try {
    await requirePermission("contract", "delete", request.headers);
    const { contractId } = await params;

    const [existing] = await db.select().from(contracts).where(eq(contracts.id, contractId)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    // Safety check: Prevent deleting historical contracts that are tied to existing payslips
    const [linkedPayslip] = await db
      .select({ id: payslips.id, payslipNumber: payslips.payslipNumber })
      .from(payslips)
      .where(eq(payslips.contractId, contractId))
      .limit(1);

    if (linkedPayslip) {
      return NextResponse.json(
        {
          error: `Cannot delete contract because it is referenced by payroll records (Payslip ${linkedPayslip.payslipNumber}). Historical contracts must be preserved for audit compliance. Change its status to Expired or Terminated instead.`,
        },
        { status: 409 }
      );
    }

    await db.delete(contracts).where(eq(contracts.id, contractId));
    return NextResponse.json({ message: "Contract deleted successfully" });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json({ error: error.message || "Failed to delete contract" }, { status: errorStatus });
  }
}
