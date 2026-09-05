import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import {
  employees,
  contracts,
  departments,
  attendance,
  attendanceCorrections,
  timeOffRequests,
  timeOffTypes,
  payruns,
  payslips,
  users,
} from "@/db/schema";
import { getAuthSession, AuthorizationError } from "@/lib/auth/authorization";
import { eq, sql, desc, and, gte, lte, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request.headers);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

    // 1. Core Overview Counts
    const [empStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(case when ${employees.status} = 'active' then 1 end)::int`,
        draft: sql<number>`count(case when ${employees.status} = 'draft' then 1 end)::int`,
      })
      .from(employees);

    const [contractStats] = await db
      .select({
        active: sql<number>`count(case when ${contracts.status} = 'active' then 1 end)::int`,
      })
      .from(contracts);

    const [deptStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
      })
      .from(departments);

    const [pendingLeave] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(timeOffRequests)
      .where(eq(timeOffRequests.status, "pending"));

    const [pendingCorr] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(attendanceCorrections)
      .where(eq(attendanceCorrections.status, "pending"));

    const [draftPayrunCount] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(payruns)
      .where(inArray(payruns.status, ["draft", "computed"]));

    // Payroll disbursement totals
    const [payrollTotals] = await db
      .select({
        totalDisbursed: sql<number>`coalesce(sum(case when ${payslips.status} = 'paid' then ${payslips.netAmount}::numeric else 0 end), 0)::float`,
        mtdDisbursed: sql<number>`coalesce(sum(case when ${payslips.status} = 'paid' and ${payslips.periodStart} >= ${firstDayOfMonth} then ${payslips.netAmount}::numeric else 0 end), 0)::float`,
      })
      .from(payslips);

    // 2. Today's Attendance Summary
    const [todayAttStats] = await db
      .select({
        present: sql<number>`count(case when ${attendance.status} = 'present' then 1 end)::int`,
        late: sql<number>`count(case when ${attendance.status} = 'late' then 1 end)::int`,
        absent: sql<number>`count(case when ${attendance.status} = 'absent' then 1 end)::int`,
        incomplete: sql<number>`count(case when ${attendance.status} = 'incomplete' then 1 end)::int`,
        overtime: sql<number>`count(case when ${attendance.status} = 'overtime' then 1 end)::int`,
      })
      .from(attendance)
      .where(eq(attendance.attendanceDate, todayStr));

    const [todayLeaveStats] = await db
      .select({
        onLeave: sql<number>`count(*)::int`,
      })
      .from(timeOffRequests)
      .where(
        and(
          eq(timeOffRequests.status, "approved"),
          lte(timeOffRequests.startDate, todayStr),
          gte(timeOffRequests.endDate, todayStr)
        )
      );

    const totalMarked = (todayAttStats?.present || 0) + (todayAttStats?.late || 0) + (todayAttStats?.absent || 0);
    const punctualityRate = totalMarked > 0
      ? Math.round(((todayAttStats?.present || 0) / totalMarked) * 100)
      : 100;

    // 3. Workforce by Department
    const workforceByDepartment = await db
      .select({
        departmentId: departments.id,
        departmentName: departments.name,
        employeeCount: sql<number>`count(distinct ${employees.id})::int`,
        activeContracts: sql<number>`count(distinct case when ${contracts.status} = 'active' then ${contracts.id} end)::int`,
        totalMonthlyCost: sql<number>`coalesce(sum(case when ${contracts.status} = 'active' then ${contracts.wage}::numeric else 0 end), 0)::float`,
      })
      .from(departments)
      .leftJoin(employees, eq(departments.id, employees.departmentId))
      .leftJoin(contracts, and(eq(departments.id, contracts.departmentId), eq(contracts.status, "active")))
      .groupBy(departments.id, departments.name)
      .orderBy(departments.name);

    // 4. Workforce by Status
    const workforceByStatus = await db
      .select({
        status: employees.status,
        count: sql<number>`count(*)::int`,
      })
      .from(employees)
      .groupBy(employees.status);

    // 5. Recent Payruns with stats
    const recentPayruns = await db
      .select({
        id: payruns.id,
        name: payruns.name,
        periodStart: payruns.periodStart,
        periodEnd: payruns.periodEnd,
        status: payruns.status,
        createdAt: payruns.createdAt,
        payslipCount: sql<number>`count(${payslips.id})::int`,
        totalNet: sql<number>`coalesce(sum(${payslips.netAmount}::numeric), 0)::float`,
      })
      .from(payruns)
      .leftJoin(payslips, eq(payruns.id, payslips.payrunId))
      .groupBy(payruns.id)
      .orderBy(desc(payruns.createdAt))
      .limit(5);

    // 6. Pending Actions
    const pendingLeaveItems = await db
      .select({
        id: timeOffRequests.id,
        employeeName: sql<string>`concat(${employees.firstName}, ' ', ${employees.lastName})`,
        leaveType: timeOffTypes.name,
        startDate: timeOffRequests.startDate,
        endDate: timeOffRequests.endDate,
        duration: timeOffRequests.duration,
        reason: timeOffRequests.reason,
        createdAt: timeOffRequests.createdAt,
      })
      .from(timeOffRequests)
      .innerJoin(employees, eq(timeOffRequests.employeeId, employees.id))
      .innerJoin(timeOffTypes, eq(timeOffRequests.timeOffTypeId, timeOffTypes.id))
      .where(eq(timeOffRequests.status, "pending"))
      .orderBy(desc(timeOffRequests.createdAt))
      .limit(5);

    const pendingCorrectionItems = await db
      .select({
        id: attendanceCorrections.id,
        requesterName: sql<string>`coalesce(${users.name}, 'Unknown User')`,
        reason: attendanceCorrections.reason,
        newCheckIn: attendanceCorrections.newCheckIn,
        newCheckOut: attendanceCorrections.newCheckOut,
        createdAt: attendanceCorrections.createdAt,
      })
      .from(attendanceCorrections)
      .leftJoin(users, eq(attendanceCorrections.requestedBy, users.id))
      .where(eq(attendanceCorrections.status, "pending"))
      .orderBy(desc(attendanceCorrections.createdAt))
      .limit(5);

    // 7. Monthly Payroll Trends (Last 6 Months)
    const monthlyTrends = await db
      .select({
        month: sql<string>`to_char(${payslips.periodStart}, 'YYYY-MM')`,
        gross: sql<number>`coalesce(sum(${payslips.grossAmount}::numeric), 0)::float`,
        net: sql<number>`coalesce(sum(${payslips.netAmount}::numeric), 0)::float`,
        deductions: sql<number>`coalesce(sum(${payslips.deductionAmount}::numeric), 0)::float`,
        payrunCount: sql<number>`count(distinct ${payslips.payrunId})::int`,
      })
      .from(payslips)
      .groupBy(sql`to_char(${payslips.periodStart}, 'YYYY-MM')`)
      .orderBy(desc(sql`to_char(${payslips.periodStart}, 'YYYY-MM')`))
      .limit(6);

    return NextResponse.json({
      data: {
        overview: {
          totalEmployees: empStats?.total || 0,
          activeEmployees: empStats?.active || 0,
          draftEmployees: empStats?.draft || 0,
          activeContracts: contractStats?.active || 0,
          totalDepartments: deptStats?.total || 0,
          pendingLeaveRequests: pendingLeave?.count || 0,
          pendingCorrections: pendingCorr?.count || 0,
          draftPayruns: draftPayrunCount?.count || 0,
          mtdPayrollDisbursed: payrollTotals?.mtdDisbursed || 0,
          totalPayrollDisbursed: payrollTotals?.totalDisbursed || 0,
        },
        todayAttendance: {
          date: todayStr,
          present: todayAttStats?.present || 0,
          late: todayAttStats?.late || 0,
          absent: todayAttStats?.absent || 0,
          incomplete: todayAttStats?.incomplete || 0,
          overtime: todayAttStats?.overtime || 0,
          onLeave: todayLeaveStats?.onLeave || 0,
          punctualityRate,
        },
        workforceByDepartment,
        workforceByStatus,
        recentPayruns,
        pendingActions: {
          leaveRequests: pendingLeaveItems,
          attendanceCorrections: pendingCorrectionItems,
        },
        monthlyPayrollTrends: monthlyTrends.reverse(),
      },
    });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to fetch executive dashboard data" },
      { status }
    );
  }
}
