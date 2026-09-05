import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { attendance } from "@/db/schema";
import { getAuthSession, getCurrentEmployee, AuthorizationError } from "@/lib/auth/authorization";
import { eq, and, isNotNull, isNull, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request.headers);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentEmp = await getCurrentEmployee(session.user.id);
    if (!currentEmp) {
      return NextResponse.json({ isCheckedIn: false, activeRecord: null });
    }

    const [activeRecord] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.employeeId, currentEmp.id),
          isNotNull(attendance.checkIn),
          isNull(attendance.checkOut)
        )
      )
      .orderBy(desc(attendance.checkIn))
      .limit(1);

    return NextResponse.json({
      isCheckedIn: Boolean(activeRecord),
      activeRecord: activeRecord || null,
    });
  } catch (error: any) {
    return NextResponse.json({ isCheckedIn: false, activeRecord: null });
  }
}

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

    // 1. Check if there is already an active session (checked in, not checked out)
    const [activeRecord] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.employeeId, currentEmp.id),
          isNotNull(attendance.checkIn),
          isNull(attendance.checkOut)
        )
      )
      .orderBy(desc(attendance.checkIn))
      .limit(1);

    if (activeRecord) {
      return NextResponse.json(
        { error: "Already checked in. Please check out first.", data: activeRecord },
        { status: 400 }
      );
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const now = new Date();

    // 2. Check if a record for today exists (e.g. previously checked out)
    const [existingToday] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.employeeId, currentEmp.id),
          eq(attendance.attendanceDate, todayStr)
        )
      )
      .limit(1);

    let resultRecord;

    if (existingToday) {
      // Re-open check-in for today by clearing checkOut
      const [updated] = await db
        .update(attendance)
        .set({
          checkIn: now,
          checkOut: null,
          workedMinutes: 0,
          overtimeMinutes: 0,
          status: "present",
          updatedAt: now,
        })
        .where(eq(attendance.id, existingToday.id))
        .returning();
      resultRecord = updated;
    } else {
      // Create new attendance record
      const [inserted] = await db
        .insert(attendance)
        .values({
          employeeId: currentEmp.id,
          attendanceDate: todayStr,
          checkIn: now,
          checkOut: null,
          status: "present",
          workedMinutes: 0,
          overtimeMinutes: 0,
        })
        .returning();
      resultRecord = inserted;
    }

    return NextResponse.json(
      { message: "Checked in successfully", data: resultRecord },
      { status: 201 }
    );
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to check in" },
      { status: errorStatus }
    );
  }
}
