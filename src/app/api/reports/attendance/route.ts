import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { attendance, employees, departments } from "@/db/schema";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { eq, and, gte, lte, desc, sql, SQL } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("dashboard", "reports", request.headers);

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const departmentId = searchParams.get("departmentId");
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    const conditions: SQL[] = [];

    if (startDate) {
      conditions.push(gte(attendance.attendanceDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(attendance.attendanceDate, endDate));
    }
    if (departmentId && departmentId !== "all") {
      conditions.push(eq(employees.departmentId, departmentId));
    }
    if (employeeId && employeeId !== "all") {
      conditions.push(eq(attendance.employeeId, employeeId));
    }
    if (status && status !== "all") {
      conditions.push(eq(attendance.status, status as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [summary] = await db
      .select({
        totalRecords: sql<number>`count(${attendance.id})::int`,
        presentCount: sql<number>`count(case when ${attendance.status} = 'present' then 1 end)::int`,
        lateCount: sql<number>`count(case when ${attendance.status} = 'late' then 1 end)::int`,
        absentCount: sql<number>`count(case when ${attendance.status} = 'absent' then 1 end)::int`,
        overtimeCount: sql<number>`count(case when ${attendance.status} = 'overtime' then 1 end)::int`,
        totalWorkedMinutes: sql<number>`coalesce(sum(${attendance.workedMinutes}), 0)::int`,
        totalOvertimeMinutes: sql<number>`coalesce(sum(${attendance.overtimeMinutes}), 0)::int`,
      })
      .from(attendance)
      .innerJoin(employees, eq(attendance.employeeId, employees.id))
      .where(whereClause);

    const records = await db
      .select({
        id: attendance.id,
        attendanceDate: attendance.attendanceDate,
        employeeName: sql<string>`concat(${employees.firstName}, ' ', ${employees.lastName})`,
        employeeNumber: employees.employeeNumber,
        departmentName: sql<string>`coalesce(${departments.name}, 'Unassigned')`,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        workedMinutes: attendance.workedMinutes,
        overtimeMinutes: attendance.overtimeMinutes,
        status: attendance.status,
        isManuallyEdited: attendance.isManuallyEdited,
        notes: attendance.notes,
      })
      .from(attendance)
      .innerJoin(employees, eq(attendance.employeeId, employees.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .where(whereClause)
      .orderBy(desc(attendance.attendanceDate), desc(attendance.checkIn));

    return NextResponse.json({
      summary: summary || {
        totalRecords: 0,
        presentCount: 0,
        lateCount: 0,
        absentCount: 0,
        overtimeCount: 0,
        totalWorkedMinutes: 0,
        totalOvertimeMinutes: 0,
      },
      records,
    });
  } catch (error: any) {
    const statusCode = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to generate attendance report" },
      { status: statusCode }
    );
  }
}
