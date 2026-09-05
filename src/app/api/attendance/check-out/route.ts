import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { attendance } from "@/db/schema";
import { getAuthSession, getCurrentEmployee, AuthorizationError } from "@/lib/auth/authorization";
import { eq, and, isNotNull, isNull, desc } from "drizzle-orm";

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

    // Find active check-in session (checkIn is NOT null, checkOut IS null)
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

    if (!activeRecord || !activeRecord.checkIn) {
      return NextResponse.json(
        { error: "No active check-in session found." },
        { status: 400 }
      );
    }

    const now = new Date();
    const checkInTime = new Date(activeRecord.checkIn);
    const workedMinutes = Math.max(0, Math.floor((now.getTime() - checkInTime.getTime()) / (1000 * 60)));
    const overtimeMinutes = workedMinutes > 480 ? workedMinutes - 480 : 0;

    const [updated] = await db
      .update(attendance)
      .set({
        checkOut: now,
        workedMinutes,
        overtimeMinutes,
        status: workedMinutes > 480 ? "overtime" : "present",
        updatedAt: now,
      })
      .where(eq(attendance.id, activeRecord.id))
      .returning();

    return NextResponse.json({ message: "Checked out successfully", data: updated });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to check out" },
      { status: errorStatus }
    );
  }
}
