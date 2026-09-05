import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, getCurrentEmployee, AuthorizationError } from "@/lib/auth/authorization";
import { normalizeRole, hasPermission } from "@/lib/auth/permissions";
import { getPayslipsList } from "@/features/payroll/services/payroll.service";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request.headers);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 });
    }

    const userRole = normalizeRole((session.user as { role?: string })?.role);
    const canReadSelf = hasPermission(userRole, "payslip", "read-self");
    const canReadAll = hasPermission(userRole, "payslip", "read");

    if (!canReadSelf && !canReadAll) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view payslips" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const payrunId = searchParams.get("payrunId") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;
    const periodStart = searchParams.get("periodStart") || undefined;
    const periodEnd = searchParams.get("periodEnd") || undefined;
    const isMe = searchParams.get("me") === "true";

    let targetEmployeeId = searchParams.get("employeeId") || undefined;

    // If user only has read-self OR explicitly requested /me
    if (!canReadAll || isMe) {
      const currentEmployee = await getCurrentEmployee(session.user.id);
      if (!currentEmployee) {
        return NextResponse.json({ data: [] });
      }
      targetEmployeeId = currentEmployee.id;
    }

    const payslips = await getPayslipsList({
      search,
      status,
      payrunId,
      employeeId: targetEmployeeId,
      departmentId,
      periodStart,
      periodEnd,
    });

    return NextResponse.json({ data: payslips });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payslips" },
      { status }
    );
  }
}
