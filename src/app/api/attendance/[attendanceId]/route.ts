import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { attendance, employees, departments, attendanceCorrections } from "@/db/schema";
import { requirePermission, AuthorizationError, getAuthSession, getCurrentEmployee } from "@/lib/auth/authorization";
import { eq, sql, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attendanceId: string }> }
) {
  try {
    const session = await getAuthSession(request.headers);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { attendanceId } = await params;
    const userRole = (session.user as { role?: string })?.role;
    const currentEmp = await getCurrentEmployee(session.user.id);

    const [record] = await db
      .select({
        id: attendance.id,
        employeeId: attendance.employeeId,
        employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`.as("employee_name"),
        employeeNumber: employees.employeeNumber,
        departmentName: departments.name,
        attendanceDate: attendance.attendanceDate,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        workedMinutes: attendance.workedMinutes,
        overtimeMinutes: attendance.overtimeMinutes,
        status: attendance.status,
        isManuallyEdited: attendance.isManuallyEdited,
        notes: attendance.notes,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
      })
      .from(attendance)
      .leftJoin(employees, eq(attendance.employeeId, employees.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .where(eq(attendance.id, attendanceId))
      .limit(1);

    if (!record) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    // IDOR protection
    if (userRole === "employee" || (!["admin", "hr_manager", "payroll_manager", "payroll_user"].includes(userRole || ""))) {
      if (!currentEmp || currentEmp.id !== record.employeeId) {
        return NextResponse.json({ error: "Forbidden: You cannot view other employees' attendance" }, { status: 403 });
      }
    }

    const corrections = await db
      .select()
      .from(attendanceCorrections)
      .where(eq(attendanceCorrections.attendanceId, attendanceId))
      .orderBy(desc(attendanceCorrections.createdAt));

    return NextResponse.json({
      data: {
        ...record,
        corrections,
      },
    });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json({ error: error.message || "Failed to fetch attendance" }, { status: errorStatus });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ attendanceId: string }> }
) {
  try {
    await requirePermission("attendance", "update", request.headers);
    const { attendanceId } = await params;
    const body = await request.json();

    const [existing] = await db.select().from(attendance).where(eq(attendance.id, attendanceId)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    const checkInTime = body.checkIn ? new Date(body.checkIn) : existing.checkIn;
    const checkOutTime = body.checkOut ? new Date(body.checkOut) : existing.checkOut;

    let workedMinutes = body.workedMinutes;
    if (checkInTime && checkOutTime && workedMinutes === undefined) {
      workedMinutes = Math.max(0, Math.floor((new Date(checkOutTime).getTime() - new Date(checkInTime).getTime()) / (1000 * 60)));
    }

    let overtimeMinutes = body.overtimeMinutes;
    if (workedMinutes !== undefined && overtimeMinutes === undefined) {
      overtimeMinutes = workedMinutes > 480 ? workedMinutes - 480 : 0;
    }

    const [updated] = await db
      .update(attendance)
      .set({
        checkIn: checkInTime,
        checkOut: checkOutTime,
        workedMinutes: workedMinutes !== undefined ? workedMinutes : undefined,
        overtimeMinutes: overtimeMinutes !== undefined ? overtimeMinutes : undefined,
        status: body.status !== undefined ? body.status : (workedMinutes && workedMinutes > 480 ? "overtime" : "present"),
        isManuallyEdited: true,
        notes: body.notes !== undefined ? body.notes : undefined,
        updatedAt: new Date(),
      })
      .where(eq(attendance.id, attendanceId))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json({ error: error.message || "Failed to update attendance" }, { status: errorStatus });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ attendanceId: string }> }
) {
  try {
    await requirePermission("attendance", "delete", request.headers);
    const { attendanceId } = await params;

    const [existing] = await db.select().from(attendance).where(eq(attendance.id, attendanceId)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    await db.delete(attendanceCorrections).where(eq(attendanceCorrections.attendanceId, attendanceId));
    await db.delete(attendance).where(eq(attendance.id, attendanceId));

    return NextResponse.json({ message: "Attendance record deleted successfully" });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json({ error: error.message || "Failed to delete attendance" }, { status: errorStatus });
  }
}
