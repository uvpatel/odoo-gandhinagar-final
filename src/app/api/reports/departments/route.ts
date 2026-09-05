import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { departments, employees, contracts, attendance } from "@/db/schema";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { eq, and, gte, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("dashboard", "reports", request.headers);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

    const deptList = await db
      .select({
        id: departments.id,
        name: departments.name,
        code: departments.code,
        description: departments.description,
        isActive: departments.isActive,
        employeeCount: sql<number>`count(distinct ${employees.id})::int`,
        activeContractsCount: sql<number>`count(distinct case when ${contracts.status} = 'active' then ${contracts.id} end)::int`,
        totalMonthlyCost: sql<number>`coalesce(sum(case when ${contracts.status} = 'active' then ${contracts.wage}::numeric else 0 end), 0)::float`,
      })
      .from(departments)
      .leftJoin(employees, eq(departments.id, employees.departmentId))
      .leftJoin(contracts, and(eq(departments.id, contracts.departmentId), eq(contracts.status, "active")))
      .groupBy(departments.id)
      .orderBy(departments.name);

    // Compute average wages and compliance
    const records = deptList.map((d) => ({
      ...d,
      avgWage: d.activeContractsCount > 0 ? Math.round(d.totalMonthlyCost / d.activeContractsCount) : 0,
    }));

    const totalHeadcount = records.reduce((acc, r) => acc + r.employeeCount, 0);
    const totalActiveContracts = records.reduce((acc, r) => acc + r.activeContractsCount, 0);
    const totalMonthlyPayroll = records.reduce((acc, r) => acc + r.totalMonthlyCost, 0);

    return NextResponse.json({
      summary: {
        totalDepartments: records.length,
        totalHeadcount,
        totalActiveContracts,
        totalMonthlyPayroll,
        avgCompanyWage: totalActiveContracts > 0 ? Math.round(totalMonthlyPayroll / totalActiveContracts) : 0,
      },
      records,
    });
  } catch (error: any) {
    const statusCode = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to generate departments report" },
      { status: statusCode }
    );
  }
}
