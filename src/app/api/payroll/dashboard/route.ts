import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, AuthorizationError } from "@/lib/auth/authorization";
import { normalizeRole, hasPermission } from "@/lib/auth/permissions";
import { getPayrollDashboardMetrics } from "@/features/payroll/services/payroll.service";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request.headers);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 });
    }

    const userRole = normalizeRole((session.user as { role?: string })?.role);
    const canViewDashboard = hasPermission(userRole, "dashboard", "view");

    if (!canViewDashboard) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view payroll dashboard" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;
    const employeeType = searchParams.get("employeeType") || undefined;

    const data = await getPayrollDashboardMetrics({
      startDate,
      endDate,
      departmentId,
      employeeType,
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payroll dashboard metrics" },
      { status }
    );
  }
}
