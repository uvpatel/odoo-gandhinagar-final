import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { timeOffRequests, timeOffTypes, employees, departments } from "@/db/schema";
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
    const timeOffTypeId = searchParams.get("timeOffTypeId");
    const status = searchParams.get("status");

    const conditions: SQL[] = [];

    if (startDate) {
      conditions.push(gte(timeOffRequests.startDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(timeOffRequests.endDate, endDate));
    }
    if (departmentId && departmentId !== "all") {
      conditions.push(eq(employees.departmentId, departmentId));
    }
    if (employeeId && employeeId !== "all") {
      conditions.push(eq(timeOffRequests.employeeId, employeeId));
    }
    if (timeOffTypeId && timeOffTypeId !== "all") {
      conditions.push(eq(timeOffRequests.timeOffTypeId, timeOffTypeId));
    }
    if (status && status !== "all") {
      conditions.push(eq(timeOffRequests.status, status as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [summary] = await db
      .select({
        totalRequests: sql<number>`count(${timeOffRequests.id})::int`,
        totalDays: sql<number>`coalesce(sum(${timeOffRequests.duration}::numeric), 0)::float`,
        approvedDays: sql<number>`coalesce(sum(case when ${timeOffRequests.status} = 'approved' then ${timeOffRequests.duration}::numeric else 0 end), 0)::float`,
        pendingDays: sql<number>`coalesce(sum(case when ${timeOffRequests.status} = 'pending' then ${timeOffRequests.duration}::numeric else 0 end), 0)::float`,
        refusedDays: sql<number>`coalesce(sum(case when ${timeOffRequests.status} = 'refused' then ${timeOffRequests.duration}::numeric else 0 end), 0)::float`,
      })
      .from(timeOffRequests)
      .innerJoin(employees, eq(timeOffRequests.employeeId, employees.id))
      .where(whereClause);

    const records = await db
      .select({
        id: timeOffRequests.id,
        employeeName: sql<string>`concat(${employees.firstName}, ' ', ${employees.lastName})`,
        employeeNumber: employees.employeeNumber,
        departmentName: sql<string>`coalesce(${departments.name}, 'Unassigned')`,
        leaveType: timeOffTypes.name,
        startDate: timeOffRequests.startDate,
        endDate: timeOffRequests.endDate,
        duration: timeOffRequests.duration,
        reason: timeOffRequests.reason,
        status: timeOffRequests.status,
        refusalReason: timeOffRequests.refusalReason,
        approvedAt: timeOffRequests.approvedAt,
        createdAt: timeOffRequests.createdAt,
      })
      .from(timeOffRequests)
      .innerJoin(employees, eq(timeOffRequests.employeeId, employees.id))
      .innerJoin(timeOffTypes, eq(timeOffRequests.timeOffTypeId, timeOffTypes.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .where(whereClause)
      .orderBy(desc(timeOffRequests.createdAt));

    return NextResponse.json({
      summary: summary || {
        totalRequests: 0,
        totalDays: 0,
        approvedDays: 0,
        pendingDays: 0,
        refusedDays: 0,
      },
      records,
    });
  } catch (error: any) {
    const statusCode = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to generate time-off report" },
      { status: statusCode }
    );
  }
}
