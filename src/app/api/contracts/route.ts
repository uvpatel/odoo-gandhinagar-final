import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { contracts, employees, departments, jobPositions, workingSchedules, salaryStructures } from "@/db/schema";
import { requirePermission, AuthorizationError, getAuthSession, getCurrentEmployee } from "@/lib/auth/authorization";
import { eq, sql, desc, ilike, and, or, isNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request.headers);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");
    const q = searchParams.get("q");

    const userRole = (session.user as { role?: string })?.role;
    const currentEmp = await getCurrentEmployee(session.user.id);

    const conditions = [];

    // If regular employee role, restrict to their own contracts unless they have general contract read permission
    if (userRole === "employee" || (!["admin", "hr_manager", "payroll_manager", "payroll_user"].includes(userRole || ""))) {
      if (currentEmp) {
        conditions.push(eq(contracts.employeeId, currentEmp.id));
      } else {
        return NextResponse.json({ data: [] });
      }
    } else if (employeeId && employeeId !== "all") {
      conditions.push(eq(contracts.employeeId, employeeId));
    }

    if (status && status !== "all") {
      conditions.push(eq(contracts.status, status as any));
    }

    if (q) {
      const search = `%${q}%`;
      conditions.push(
        or(
          ilike(contracts.contractNumber, search),
          ilike(employees.firstName, search),
          ilike(employees.lastName, search)
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
      .orderBy(desc(contracts.createdAt));

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
        { error: "Employee, start date, and wage are required" },
        { status: 400 }
      );
    }

    if (body.endDate && body.endDate < body.startDate) {
      return NextResponse.json(
        { error: "Contract end date cannot precede start date" },
        { status: 400 }
      );
    }

    // If setting to active, prevent overlapping active contracts for this employee
    if ((body.status || "draft") === "active") {
      const overlapping = await db
        .select({ id: contracts.id, contractNumber: contracts.contractNumber })
        .from(contracts)
        .where(
          and(
            eq(contracts.employeeId, body.employeeId),
            eq(contracts.status, "active"),
            sql`${contracts.startDate} <= ${body.endDate || "9999-12-31"}`,
            or(isNull(contracts.endDate), sql`${contracts.endDate} >= ${body.startDate}`)
          )
        );

      if (overlapping.length > 0) {
        return NextResponse.json(
          {
            error: `An active contract (${overlapping[0].contractNumber}) already overlaps this date range for this employee. Terminate or adjust dates of existing contracts first.`,
          },
          { status: 409 }
        );
      }
    }

    // Generate contract number if not provided (e.g. CON/2026/001)
    let contractNumber = body.contractNumber?.trim();
    if (!contractNumber) {
      const year = new Date().getFullYear();
      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(contracts);
      const nextNum = (countResult?.count || 0) + 1;
      contractNumber = `CON/${year}/${String(nextNum).padStart(3, "0")}`;
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
        wage: String(body.wage),
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

    if (effectiveStatus === "active") {
      const overlapping = await db
        .select({ id: contracts.id, contractNumber: contracts.contractNumber })
        .from(contracts)
        .where(
          and(
            eq(contracts.employeeId, effectiveEmployeeId),
            eq(contracts.status, "active"),
            sql`${contracts.id} <> ${body.id}`,
            sql`${contracts.startDate} <= ${effectiveEndDate || "9999-12-31"}`,
            or(isNull(contracts.endDate), sql`${contracts.endDate} >= ${effectiveStartDate}`)
          )
        );

      if (overlapping.length > 0) {
        return NextResponse.json(
          {
            error: `An active contract (${overlapping[0].contractNumber}) already overlaps this date range for this employee.`,
          },
          { status: 409 }
        );
      }
    }

    const [updatedContract] = await db
      .update(contracts)
      .set({
        contractNumber: body.contractNumber?.trim(),
        employeeId: body.employeeId !== undefined ? body.employeeId : undefined,
        startDate: body.startDate !== undefined ? body.startDate : undefined,
        endDate: body.endDate !== undefined ? body.endDate : undefined,
        departmentId: body.departmentId !== undefined ? body.departmentId : undefined,
        jobPositionId: body.jobPositionId !== undefined ? body.jobPositionId : undefined,
        workingScheduleId: body.workingScheduleId !== undefined ? body.workingScheduleId : undefined,
        salaryStructureId: body.salaryStructureId !== undefined ? body.salaryStructureId : undefined,
        wage: body.wage !== undefined ? String(body.wage) : undefined,
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

