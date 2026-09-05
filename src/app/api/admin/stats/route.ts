import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { users, employees, departments } from "@/db/schema";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { sql, desc, isNull, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("administration", "manage-users", request.headers);

    // 1. Total users
    const [totalUsersRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users);
    const totalUsers = totalUsersRes?.count || 0;

    // 2. Active users (not banned)
    const [activeUsersRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(sql`${users.banned} = false OR ${users.banned} IS NULL`);
    const activeUsers = activeUsersRes?.count || 0;

    // 3. Banned / deactivated users
    const [bannedUsersRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.banned, true));
    const bannedUsers = bannedUsersRes?.count || 0;

    // 4. Employees without user accounts
    const [unlinkedEmpRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(employees)
      .where(isNull(employees.userId));
    const unlinkedEmployees = unlinkedEmpRes?.count || 0;

    // 5. Total employees
    const [totalEmpRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(employees);
    const totalEmployees = totalEmpRes?.count || 0;

    // 6. Role distribution
    const roleCountsRaw = await db
      .select({
        role: users.role,
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .groupBy(users.role);

    // Normalize role names if any legacy roles exist
    const roleDistribution: Record<string, number> = {
      admin: 0,
      hr_manager: 0,
      payroll_manager: 0,
      payroll_user: 0,
      employee: 0,
    };

    for (const r of roleCountsRaw) {
      let key = r.role as string;
      if (key === "hr_payroll_manager") key = "payroll_manager";
      if (key === "hr_payroll_user") key = "payroll_user";
      if (roleDistribution[key] !== undefined) {
        roleDistribution[key] += r.count;
      } else {
        roleDistribution[key] = r.count;
      }
    }

    // 7. Recent users
    const recentUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        role: users.role,
        banned: users.banned,
        createdAt: users.createdAt,
        employeeId: employees.id,
        employeeNumber: employees.employeeNumber,
        departmentName: departments.name,
      })
      .from(users)
      .leftJoin(employees, eq(users.id, employees.userId))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .orderBy(desc(users.createdAt))
      .limit(8);

    return NextResponse.json({
      data: {
        totalUsers,
        activeUsers,
        bannedUsers,
        unlinkedEmployees,
        totalEmployees,
        roleDistribution,
        recentUsers,
      },
    });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to fetch admin stats" },
      { status }
    );
  }
}
