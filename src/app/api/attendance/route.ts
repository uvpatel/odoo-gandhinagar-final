import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { attendance, employees, departments } from "@/db/schema";
import { requirePermission, AuthorizationError, getAuthSession, getCurrentEmployee } from "@/lib/auth/authorization";
import { eq, sql, desc, ilike, and, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request.headers);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const date = searchParams.get("date");
    const todayOnly = searchParams.get("todayOnly") === "true";
    const q = searchParams.get("q");

    const userRole = (session.user as { role?: string })?.role;
    const currentEmp = await getCurrentEmployee(session.user.id);

    const conditions = [];

    // Restrict regular employees to their own attendance
    if (userRole === "employee" || (!["admin", "hr_manager", "payroll_manager", "payroll_user"].includes(userRole || ""))) {
      if (currentEmp) {
        conditions.push(eq(attendance.employeeId, currentEmp.id));
      } else {
        return NextResponse.json({ data: [] });
      }
    } else if (employeeId && employeeId !== "all") {
      conditions.push(eq(attendance.employeeId, employeeId));
    }

    if (todayOnly) {
      const todayStr = new Date().toISOString().split("T")[0];
      conditions.push(eq(attendance.attendanceDate, todayStr));
    } else if (date) {
      conditions.push(eq(attendance.attendanceDate, date));
    }

    if (q) {
      const search = `%${q}%`;
      conditions.push(
        or(
          ilike(employees.firstName, search),
          ilike(employees.lastName, search),
          ilike(employees.employeeNumber, search)
        )
      );
    }

    const data = await db
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
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(attendance.attendanceDate), desc(attendance.checkIn));

    return NextResponse.json({ data });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to fetch attendance records" },
      { status: errorStatus }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission("attendance", "create", request.headers);
    const body = await request.json();

    if (!body.employeeId || !body.attendanceDate) {
      return NextResponse.json(
        { error: "Employee and attendance date are required" },
        { status: 400 }
      );
    }

    const checkInTime = body.checkIn ? new Date(body.checkIn) : null;
    const checkOutTime = body.checkOut ? new Date(body.checkOut) : null;

    let workedMinutes = body.workedMinutes || 0;
    if (checkInTime && checkOutTime && !body.workedMinutes) {
      workedMinutes = Math.max(0, Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60)));
    }

    let overtimeMinutes = body.overtimeMinutes || 0;
    if (workedMinutes > 480 && !body.overtimeMinutes) {
      overtimeMinutes = workedMinutes - 480;
    }

    const [newRecord] = await db
      .insert(attendance)
      .values({
        employeeId: body.employeeId,
        attendanceDate: body.attendanceDate,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        workedMinutes,
        overtimeMinutes,
        status: body.status || (checkInTime ? "present" : "absent"),
        isManuallyEdited: body.isManuallyEdited ?? true,
        notes: body.notes || "Manually created record.",
      })
      .returning();

    return NextResponse.json({ data: newRecord }, { status: 201 });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to create attendance record" },
      { status: errorStatus }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requirePermission("attendance", "update", request.headers);
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "Attendance ID is required" }, { status: 400 });
    }

    const checkInTime = body.checkIn ? new Date(body.checkIn) : undefined;
    const checkOutTime = body.checkOut ? new Date(body.checkOut) : undefined;

    let workedMinutes = body.workedMinutes;
    if (checkInTime && checkOutTime && workedMinutes === undefined) {
      workedMinutes = Math.max(0, Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60)));
    }

    const [updatedRecord] = await db
      .update(attendance)
      .set({
        checkIn: checkInTime,
        checkOut: checkOutTime,
        workedMinutes: workedMinutes !== undefined ? workedMinutes : undefined,
        overtimeMinutes: body.overtimeMinutes !== undefined ? body.overtimeMinutes : undefined,
        status: body.status !== undefined ? body.status : undefined,
        isManuallyEdited: true,
        notes: body.notes !== undefined ? body.notes : undefined,
        updatedAt: new Date(),
      })
      .where(eq(attendance.id, body.id))
      .returning();

    if (!updatedRecord) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updatedRecord });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to update attendance record" },
      { status: errorStatus }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission("attendance", "delete", request.headers);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Attendance ID is required" }, { status: 400 });
    }

    await db.delete(attendance).where(eq(attendance.id, id));
    return NextResponse.json({ message: "Attendance record deleted successfully" });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to delete attendance record" },
      { status: errorStatus }
    );
  }
}

