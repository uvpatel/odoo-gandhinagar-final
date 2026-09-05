import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { timeOffTypes } from "@/db/schema";
import { requireAuth, requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request.headers);
    const types = await db.select().from(timeOffTypes);
    return NextResponse.json({ data: types });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch time-off types" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission("timeOffType", "create", request.headers);
    const body = await request.json();

    if (!body.name || !body.code) {
      return NextResponse.json(
        { error: "Type name and code are required" },
        { status: 400 }
      );
    }

    const [newType] = await db
      .insert(timeOffTypes)
      .values({
        name: body.name.trim(),
        code: body.code.trim().toUpperCase(),
        unit: body.unit || "days",
        requiresAllocation: body.requiresAllocation ?? true,
        approvalMode: body.approvalMode || "manager",
        isPaid: body.isPaid ?? true,
        isActive: body.isActive ?? true,
      })
      .returning();

    return NextResponse.json({ data: newType }, { status: 201 });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to create time-off type" },
      { status }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requirePermission("timeOffType", "update", request.headers);
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "Time off type ID is required" }, { status: 400 });
    }

    const [updated] = await db
      .update(timeOffTypes)
      .set({
        name: body.name?.trim(),
        code: body.code?.trim().toUpperCase(),
        unit: body.unit,
        requiresAllocation: body.requiresAllocation,
        approvalMode: body.approvalMode,
        isPaid: body.isPaid,
        isActive: body.isActive,
      })
      .where(eq(timeOffTypes.id, body.id))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to update time-off type" },
      { status }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission("timeOffType", "delete", request.headers);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Time off type ID is required" }, { status: 400 });
    }

    await db.delete(timeOffTypes).where(eq(timeOffTypes.id, id));
    return NextResponse.json({ message: "Time off type deleted successfully" });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to delete time-off type" },
      { status }
    );
  }
}

