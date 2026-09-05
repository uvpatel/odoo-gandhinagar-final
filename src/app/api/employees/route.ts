import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { employees, departments, jobPositions, users, workingSchedules } from "@/db/schema";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { eq, sql, asc, ilike, and, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

const managers = alias(employees, "managers");

export async function GET(request: NextRequest) {
  try {
    await requirePermission("employee", "read", request.headers);

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    const status = searchParams.get("status");
    const q = searchParams.get("q");

    const conditions = [];

    if (departmentId && departmentId !== "all") {
      conditions.push(eq(employees.departmentId, departmentId));
    }

    if (status && status !== "all") {
      conditions.push(eq(employees.status, status as any));
    }

    if (q) {
      const search = `%${q}%`;
      conditions.push(
        or(
          ilike(employees.firstName, search),
          ilike(employees.lastName, search),
          ilike(employees.workEmail, search),
          ilike(employees.employeeNumber, search)
        )
      );
    }

    const data = await db
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
        avatar: users.image,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(jobPositions, eq(employees.jobPositionId, jobPositions.id))
      .leftJoin(workingSchedules, eq(employees.workingScheduleId, workingSchedules.id))
      .leftJoin(users, eq(employees.userId, users.id))
      .leftJoin(managers, eq(employees.managerId, managers.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(employees.employeeNumber));

    return NextResponse.json({ data });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to fetch employees" },
      { status: errorStatus }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission("employee", "create", request.headers);
    const body = await request.json();

    if (!body.firstName || !body.lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    // Generate employee number if not provided
    let empNumber = body.employeeNumber?.trim();
    if (!empNumber) {
      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(employees);
      const nextNum = (countResult?.count || 0) + 1;
      empNumber = `EMP-${String(nextNum).padStart(3, "0")}`;
    }

    const [newEmp] = await db
      .insert(employees)
      .values({
        employeeNumber: empNumber,
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        workEmail: body.workEmail?.trim() || null,
        phone: body.phone?.trim() || null,
        departmentId: body.departmentId || null,
        jobPositionId: body.jobPositionId || null,
        managerId: body.managerId || null,
        workingScheduleId: body.workingScheduleId || null,
        employeeType: body.employeeType || "full_time",
        status: body.status || "active",
        joiningDate: body.joiningDate || new Date().toISOString().split("T")[0],
        bankAccountNumber: body.bankAccountNumber?.trim() || null,
        bankName: body.bankName?.trim() || null,
      })
      .returning();

    return NextResponse.json({ data: newEmp }, { status: 201 });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to create employee" },
      { status: errorStatus }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requirePermission("employee", "update", request.headers);
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    const [updatedEmp] = await db
      .update(employees)
      .set({
        firstName: body.firstName?.trim(),
        lastName: body.lastName?.trim(),
        workEmail: body.workEmail?.trim(),
        phone: body.phone?.trim(),
        departmentId: body.departmentId !== undefined ? body.departmentId : undefined,
        jobPositionId: body.jobPositionId !== undefined ? body.jobPositionId : undefined,
        managerId: body.managerId !== undefined ? body.managerId : undefined,
        workingScheduleId: body.workingScheduleId !== undefined ? body.workingScheduleId : undefined,
        employeeType: body.employeeType !== undefined ? body.employeeType : undefined,
        status: body.status !== undefined ? body.status : undefined,
        joiningDate: body.joiningDate !== undefined ? body.joiningDate : undefined,
        bankAccountNumber: body.bankAccountNumber !== undefined ? body.bankAccountNumber : undefined,
        bankName: body.bankName !== undefined ? body.bankName : undefined,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, body.id))
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

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission("employee", "delete", request.headers);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    await db.delete(employees).where(eq(employees.id, id));
    return NextResponse.json({ message: "Employee deleted successfully" });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to delete employee" },
      { status: errorStatus }
    );
  }
}
