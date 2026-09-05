import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import {
  employees,
  departments,
  jobPositions,
  users,
  workingSchedules,
  contracts,
  attendance,
  timeOffRequests,
  timeOffAllocations,
} from "@/db/schema";
import {
  requirePermission,
  AuthorizationError,
  getAuthSession,
  getCurrentEmployee,
} from "@/lib/auth/authorization";
import { eq, sql, and } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

const managers = alias(employees, "managers");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const session = await getAuthSession(request.headers);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { employeeId } = await params;
    const userRole = (session.user as { role?: string })?.role;
    const currentEmp = await getCurrentEmployee(session.user.id);

    // IDOR protection: standard employee can only view their own profile
    if (
      userRole === "employee" ||
      !["admin", "hr_manager", "payroll_manager", "payroll_user"].includes(userRole || "")
    ) {
      if (!currentEmp || currentEmp.id !== employeeId) {
        return NextResponse.json(
          { error: "Forbidden: You cannot view other employees' records" },
          { status: 403 }
        );
      }
    }

    const [emp] = await db
      .select({
        id: employees.id,
        employeeNumber: employees.employeeNumber,
        firstName: employees.firstName,
        lastName: employees.lastName,
        fullName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`.as("full_name"),
        workEmail: employees.workEmail,
        phone: employees.phone,
        departmentId: employees.departmentId,
        departmentName: departments.name,
        departmentCode: departments.code,
        jobPositionId: employees.jobPositionId,
        jobTitle: jobPositions.title,
        jobCode: jobPositions.code,
        managerId: employees.managerId,
        managerName: sql<string | null>`${managers.firstName} || ' ' || ${managers.lastName}`.as("manager_name"),
        workingScheduleId: employees.workingScheduleId,
        workingScheduleName: workingSchedules.name,
        employeeType: employees.employeeType,
        status: employees.status,
        joiningDate: employees.joiningDate,
        bankAccountNumber: employees.bankAccountNumber,
        bankName: employees.bankName,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
        avatar: users.image,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(jobPositions, eq(employees.jobPositionId, jobPositions.id))
      .leftJoin(workingSchedules, eq(employees.workingScheduleId, workingSchedules.id))
      .leftJoin(users, eq(employees.userId, users.id))
      .leftJoin(managers, eq(employees.managerId, managers.id))
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (!emp) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Live Smart Counts
    const [contractsCountRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(contracts)
      .where(eq(contracts.employeeId, employeeId));

    const [attendanceCountRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(attendance)
      .where(eq(attendance.employeeId, employeeId));

    const [timeOffCountRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(timeOffRequests)
      .where(eq(timeOffRequests.employeeId, employeeId));

    const [allocationsCountRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(timeOffAllocations)
      .where(eq(timeOffAllocations.employeeId, employeeId));

    // Active contract if any
    const [activeContract] = await db
      .select({
        id: contracts.id,
        contractNumber: contracts.contractNumber,
        wage: contracts.wage,
        currency: contracts.currency,
        startDate: contracts.startDate,
        endDate: contracts.endDate,
        status: contracts.status,
      })
      .from(contracts)
      .where(and(eq(contracts.employeeId, employeeId), eq(contracts.status, "active")))
      .limit(1);

    return NextResponse.json({
      data: {
        ...emp,
        contractsCount: contractsCountRes?.count ?? 0,
        attendanceCount: attendanceCountRes?.count ?? 0,
        timeOffCount: timeOffCountRes?.count ?? 0,
        allocationsCount: allocationsCountRes?.count ?? 0,
        activeContract: activeContract || null,
      },
    });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to fetch employee details" },
      { status: errorStatus }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    await requirePermission("employee", "update", request.headers);
    const { employeeId } = await params;
    const body = await request.json();

    const [updatedEmp] = await db
      .update(employees)
      .set({
        firstName: body.firstName !== undefined ? body.firstName.trim() : undefined,
        lastName: body.lastName !== undefined ? body.lastName.trim() : undefined,
        workEmail: body.workEmail !== undefined ? body.workEmail.trim() : undefined,
        phone: body.phone !== undefined ? body.phone.trim() : undefined,
        departmentId: body.departmentId !== undefined ? body.departmentId : undefined,
        jobPositionId: body.jobPositionId !== undefined ? body.jobPositionId : undefined,
        managerId: body.managerId !== undefined ? body.managerId : undefined,
        workingScheduleId: body.workingScheduleId !== undefined ? body.workingScheduleId : undefined,
        employeeType: body.employeeType !== undefined ? body.employeeType : undefined,
        status: body.status !== undefined ? body.status : undefined,
        joiningDate: body.joiningDate !== undefined ? body.joiningDate : undefined,
        bankAccountNumber: body.bankAccountNumber !== undefined ? body.bankAccountNumber.trim() : undefined,
        bankName: body.bankName !== undefined ? body.bankName.trim() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, employeeId))
      .returning();

    if (!updatedEmp) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updatedEmp });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to update employee" },
      { status: errorStatus }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    await requirePermission("employee", "delete", request.headers);
    const { employeeId } = await params;

    const [deleted] = await db
      .delete(employees)
      .where(eq(employees.id, employeeId))
      .returning({ id: employees.id });

    if (!deleted) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Employee deleted successfully" });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to delete employee" },
      { status: errorStatus }
    );
  }
}

