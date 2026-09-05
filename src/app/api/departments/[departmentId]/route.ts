import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { departments, employees } from "@/db/schema";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { eq, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    await requirePermission("department", "read", request.headers);
    const { departmentId } = await params;

    const [dept] = await db
      .select({
        id: departments.id,
        name: departments.name,
        code: departments.code,
        description: departments.description,
        isActive: departments.isActive,
        createdAt: departments.createdAt,
        updatedAt: departments.updatedAt,
        employeeCount: sql<number>`count(${employees.id})::int`,
      })
      .from(departments)
      .leftJoin(employees, eq(departments.id, employees.departmentId))
      .where(eq(departments.id, departmentId))
      .groupBy(departments.id)
      .limit(1);

    if (!dept) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    return NextResponse.json({ data: dept });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json({ error: error.message || "Failed to fetch department" }, { status: errorStatus });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    await requirePermission("department", "update", request.headers);
    const { departmentId } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(departments)
      .set({
        name: body.name?.trim(),
        code: body.code?.trim().toUpperCase(),
        description: body.description !== undefined ? body.description : undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
        updatedAt: new Date(),
      })
      .where(eq(departments.id, departmentId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json({ error: error.message || "Failed to update department" }, { status: errorStatus });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    await requirePermission("department", "delete", request.headers);
    const { departmentId } = await params;

    const [deptEmployees] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(employees)
      .where(eq(employees.departmentId, departmentId));

    if (deptEmployees && deptEmployees.count > 0) {
      return NextResponse.json(
        { error: `Cannot delete department with ${deptEmployees.count} assigned employee(s). Reassign them first.` },
        { status: 400 }
      );
    }

    await db.delete(departments).where(eq(departments.id, departmentId));
    return NextResponse.json({ message: "Department deleted successfully" });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json({ error: error.message || "Failed to delete department" }, { status: errorStatus });
  }
}
