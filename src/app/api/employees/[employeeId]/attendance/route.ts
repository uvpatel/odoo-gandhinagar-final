import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { attendance } from "@/db/schema";
import { requirePermission, AuthorizationError, getAuthSession, getCurrentEmployee } from "@/lib/auth/authorization";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const session = await getAuthSession(request.headers);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { employeeId } = await params;
    const userRole = (session.user as { role?: string })?.role;
    const currentEmp = await getCurrentEmployee(session.user.id);

    // IDOR protection: standard employee can only view their own attendance
    if (
      userRole === "employee" ||
      !["admin", "hr_manager", "payroll_manager", "payroll_user"].includes(userRole || "")
    ) {
      if (!currentEmp || currentEmp.id !== employeeId) {
        return NextResponse.json(
          { error: "Forbidden: You cannot view other employees' attendance" },
          { status: 403 }
        );
      }
    } else {
      await requirePermission("attendance", "read", request.headers);
    }

    const data = await db
      .select({
        id: attendance.id,
        employeeId: attendance.employeeId,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        workedMinutes: attendance.workedMinutes,
        status: attendance.status,
        isManuallyEdited: attendance.isManuallyEdited,
        notes: attendance.notes,
        createdAt: attendance.createdAt,
      })
      .from(attendance)
      .where(eq(attendance.employeeId, employeeId))
      .orderBy(desc(attendance.checkIn));

    return NextResponse.json({ data });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to fetch employee attendance" },
      { status: errorStatus }
    );
  }
}

