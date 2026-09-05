import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { jobPositions, employees } from "@/db/schema";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { eq, sql, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("jobPosition", "read", request.headers);

    const data = await db
      .select({
        id: jobPositions.id,
        title: jobPositions.title,
        code: jobPositions.code,
        description: jobPositions.description,
        isActive: jobPositions.isActive,
        createdAt: jobPositions.createdAt,
        employeeCount: sql<number>`count(${employees.id})::int`,
      })
      .from(jobPositions)
      .leftJoin(employees, eq(jobPositions.id, employees.jobPositionId))
      .groupBy(jobPositions.id)
      .orderBy(asc(jobPositions.title));

    return NextResponse.json({ data });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to fetch job positions" },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission("jobPosition", "create", request.headers);
    const body = await request.json();

    if (!body.title || !body.code) {
      return NextResponse.json(
        { error: "Job title and code are required" },
        { status: 400 }
      );
    }

    const [newJob] = await db
      .insert(jobPositions)
      .values({
        title: body.title.trim(),
        code: body.code.trim().toUpperCase(),
        description: body.description?.trim() || null,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      })
      .returning();

    return NextResponse.json({ data: { ...newJob, employeeCount: 0 } }, { status: 201 });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to create job position" },
      { status }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requirePermission("jobPosition", "update", request.headers);
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "Job Position ID is required" }, { status: 400 });
    }

    const [updatedJob] = await db
      .update(jobPositions)
      .set({
        title: body.title?.trim(),
        code: body.code?.trim().toUpperCase(),
        description: body.description !== undefined ? body.description?.trim() : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(jobPositions.id, body.id))
      .returning();

    if (!updatedJob) {
      return NextResponse.json({ error: "Job position not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updatedJob });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to update job position" },
      { status }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission("jobPosition", "delete", request.headers);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Job Position ID is required" }, { status: 400 });
    }

    // Check if any employees hold this job position
    const [empCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(employees)
      .where(eq(employees.jobPositionId, id));

    if (empCount && empCount.count > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete job position: ${empCount.count} employee(s) are currently assigned to it. Reassign employees first.`,
        },
        { status: 400 }
      );
    }

    await db.delete(jobPositions).where(eq(jobPositions.id, id));
    return NextResponse.json({ message: "Job position deleted successfully" });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to delete job position" },
      { status }
    );
  }
}
