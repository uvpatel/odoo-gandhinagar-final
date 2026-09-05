import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { jobPositions, departments, employees } from "@/db/schema";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { eq, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobPositionId: string }> }
) {
  try {
    await requirePermission("jobPosition", "read", request.headers);
    const { jobPositionId } = await params;

    const [position] = await db
      .select({
        id: jobPositions.id,
        title: jobPositions.title,
        code: jobPositions.code,
        description: jobPositions.description,
        isActive: jobPositions.isActive,
        createdAt: jobPositions.createdAt,
        updatedAt: jobPositions.updatedAt,
        employeeCount: sql<number>`count(${employees.id})::int`,
      })
      .from(jobPositions)
      .leftJoin(employees, eq(jobPositions.id, employees.jobPositionId))
      .where(eq(jobPositions.id, jobPositionId))
      .groupBy(jobPositions.id)
      .limit(1);

    if (!position) {
      return NextResponse.json({ error: "Job position not found" }, { status: 404 });
    }

    return NextResponse.json({ data: position });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json({ error: error.message || "Failed to fetch job position" }, { status: errorStatus });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ jobPositionId: string }> }
) {
  try {
    await requirePermission("jobPosition", "update", request.headers);
    const { jobPositionId } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(jobPositions)
      .set({
        title: body.title?.trim(),
        code: body.code?.trim().toUpperCase(),
        description: body.description !== undefined ? body.description : undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
        updatedAt: new Date(),
      })
      .where(eq(jobPositions.id, jobPositionId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Job position not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json({ error: error.message || "Failed to update job position" }, { status: errorStatus });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobPositionId: string }> }
) {
  try {
    await requirePermission("jobPosition", "delete", request.headers);
    const { jobPositionId } = await params;

    const [posEmployees] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(employees)
      .where(eq(employees.jobPositionId, jobPositionId));

    if (posEmployees && posEmployees.count > 0) {
      return NextResponse.json(
        { error: `Cannot delete job position with ${posEmployees.count} assigned employee(s). Reassign them first.` },
        { status: 400 }
      );
    }

    await db.delete(jobPositions).where(eq(jobPositions.id, jobPositionId));
    return NextResponse.json({ message: "Job position deleted successfully" });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json({ error: error.message || "Failed to delete job position" }, { status: errorStatus });
  }
}
