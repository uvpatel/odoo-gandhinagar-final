import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { payslips, payruns, employees, departments } from "@/db/schema";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { eq, and, gte, lte, desc, sql, SQL } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("dashboard", "reports", request.headers);

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const departmentId = searchParams.get("departmentId");
    const payrunId = searchParams.get("payrunId");
    const status = searchParams.get("status");

    const conditions: SQL[] = [];

    if (startDate) {
      conditions.push(gte(payslips.periodStart, startDate));
    }
    if (endDate) {
      conditions.push(lte(payslips.periodEnd, endDate));
    }
    if (departmentId && departmentId !== "all") {
      conditions.push(eq(employees.departmentId, departmentId));
    }
    if (payrunId && payrunId !== "all") {
      conditions.push(eq(payslips.payrunId, payrunId));
    }
    if (status && status !== "all") {
      conditions.push(eq(payslips.status, status as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [summary] = await db
      .select({
        totalPayslips: sql<number>`count(${payslips.id})::int`,
        totalGross: sql<number>`coalesce(sum(${payslips.grossAmount}::numeric), 0)::float`,
        totalNet: sql<number>`coalesce(sum(${payslips.netAmount}::numeric), 0)::float`,
        totalDeductions: sql<number>`coalesce(sum(${payslips.deductionAmount}::numeric), 0)::float`,
        totalEmployerCost: sql<number>`coalesce(sum(${payslips.grossAmount}::numeric * 0.12), 0)::float`,
      })
      .from(payslips)
      .innerJoin(employees, eq(payslips.employeeId, employees.id))
      .where(whereClause);

    const records = await db
      .select({
        id: payslips.id,
        payslipNumber: payslips.payslipNumber,
        employeeName: sql<string>`concat(${employees.firstName}, ' ', ${employees.lastName})`,
        employeeNumber: employees.employeeNumber,
        workEmail: employees.workEmail,
        departmentName: sql<string>`coalesce(${departments.name}, 'Unassigned')`,
        payrunName: payruns.name,
        periodStart: payslips.periodStart,
        periodEnd: payslips.periodEnd,
        basicWage: payslips.basicAmount,
        grossSalary: payslips.grossAmount,
        totalDeductions: payslips.deductionAmount,
        netSalary: payslips.netAmount,
        employerCost: sql<string>`(${payslips.grossAmount}::numeric * 0.12)::text`,
        status: payslips.status,
        paidAt: payslips.paidAt,
      })
      .from(payslips)
      .innerJoin(employees, eq(payslips.employeeId, employees.id))
      .innerJoin(payruns, eq(payslips.payrunId, payruns.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .where(whereClause)
      .orderBy(desc(payslips.createdAt));

    return NextResponse.json({
      summary: summary || {
        totalPayslips: 0,
        totalGross: 0,
        totalNet: 0,
        totalDeductions: 0,
        totalEmployerCost: 0,
      },
      records,
    });
  } catch (error: any) {
    const statusCode = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to generate payroll report" },
      { status: statusCode }
    );
  }
}
