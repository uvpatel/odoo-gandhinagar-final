import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { departments, employees } from "@/db/schema";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { eq, sql, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("department", "read", request.headers);

    const data = await db
      .select({
        id: departments.id,
        name: departments.name,
        code: departments.code,
        description: departments.description,
        isActive: departments.isActive,
        createdAt: departments.createdAt,
        employeeCount: sql<number>`count(${employees.id})::int`,
      })
      .from(departments)
      .leftJoin(employees, eq(departments.id, employees.departmentId))
      .groupBy(departments.id)
      .orderBy(asc(departments.name));

    return NextResponse.json({ data });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to fetch departments" },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission("department", "create", request.headers);
    const body = await request.json();

    if (!body.name || !body.code) {
      return NextResponse.json(
        { error: "Department name and code are required" },
        { status: 400 }
      );
    }

    const [newDept] = await db
      .insert(departments)
      .values({
        name: body.name.trim(),
        code: body.code.trim().toUpperCase(),
        description: body.description?.trim() || null,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      })
      .returning();

    return NextResponse.json({ data: { ...newDept, employeeCount: 0 } }, { status: 201 });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to create department" },
      { status }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requirePermission("department", "update", request.headers);
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "Department ID is required" }, { status: 400 });
    }

    const [updatedDept] = await db
      .update(departments)
      .set({
        name: body.name?.trim(),
        code: body.code?.trim().toUpperCase(),
        description: body.description !== undefined ? body.description?.trim() : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(departments.id, body.id))
      .returning();

    if (!updatedDept) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updatedDept });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to update department" },
      { status }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission("department", "delete", request.headers);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Department ID is required" }, { status: 400 });
    }

    // Check if any employees belong to this department
    const [empCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(employees)
      .where(eq(employees.departmentId, id));

    if (empCount && empCount.count > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete department: ${empCount.count} employee(s) are currently assigned to it. Reassign employees first.`,
        },
        { status: 400 }
      );
    }

    await db.delete(departments).where(eq(departments.id, id));
    return NextResponse.json({ message: "Department deleted successfully" });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to delete department" },
      { status }
    );
  }
}
