import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { attendance } from "@/db/schema";
import { getAuthSession, getCurrentEmployee, AuthorizationError } from "@/lib/auth/authorization";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request.headers);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentEmp = await getCurrentEmployee(session.user.id);
    if (!currentEmp) {
      return NextResponse.json(
        { error: "No employee record associated with this account." },
        { status: 400 }
      );
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Check if attendance record for today already exists
    const [existing] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.employeeId, currentEmp.id),
          eq(attendance.attendanceDate, todayStr)
        )
      )
      .limit(1);

    if (existing && existing.checkIn && !existing.checkOut) {
      return NextResponse.json(
        { error: "Already checked in today.", data: existing },
        { status: 400 }
      );
    }

    const now = new Date();

    if (existing) {
      const [updated] = await db
        .update(attendance)
        .set({
          checkIn: now,
          status: "present",
          updatedAt: now,
        })
        .where(eq(attendance.id, existing.id))
        .returning();

      return NextResponse.json({ message: "Check-in successful", data: updated });
    }

    const [newRecord] = await db
      .insert(attendance)
      .values({
        employeeId: currentEmp.id,
        attendanceDate: todayStr,
        checkIn: now,
        status: "present",
        workedMinutes: 0,
        overtimeMinutes: 0,
      })
      .returning();

    return NextResponse.json({ message: "Check-in successful", data: newRecord }, { status: 201 });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to check in" },
      { status: errorStatus }
    );
  }
}

