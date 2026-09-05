import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { workingSchedules } from "@/db/schema";
import { getAuthSession, requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request.headers);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await db.select().from(workingSchedules);
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch working schedules" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission("workingSchedule", "create", request.headers);
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: "Schedule name is required" }, { status: 400 });
    }

    const [newSchedule] = await db
      .insert(workingSchedules)
      .values({
        name: body.name.trim(),
        scheduleType: body.scheduleType || "standard",
        timezone: body.timezone || "Asia/Kolkata",
        isActive: body.isActive ?? true,
      })
      .returning();

    return NextResponse.json({ data: newSchedule }, { status: 201 });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json({ error: error.message || "Failed to create working schedule" }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requirePermission("workingSchedule", "update", request.headers);
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "Schedule ID is required" }, { status: 400 });
    }

    const [updated] = await db
      .update(workingSchedules)
      .set({
        name: body.name?.trim(),
        scheduleType: body.scheduleType,
        timezone: body.timezone,
        isActive: body.isActive,
        updatedAt: new Date(),
      })
      .where(eq(workingSchedules.id, body.id))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json({ error: error.message || "Failed to update working schedule" }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission("workingSchedule", "delete", request.headers);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Schedule ID is required" }, { status: 400 });
    }

    await db.delete(workingSchedules).where(eq(workingSchedules.id, id));
    return NextResponse.json({ message: "Working schedule deleted successfully" });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json({ error: error.message || "Failed to delete working schedule" }, { status });
  }
}


