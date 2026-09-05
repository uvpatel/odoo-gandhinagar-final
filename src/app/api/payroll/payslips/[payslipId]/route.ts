import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, getCurrentEmployee, AuthorizationError } from "@/lib/auth/authorization";
import { normalizeRole, hasPermission } from "@/lib/auth/permissions";
import { getPayslipDetail } from "@/features/payroll/services/payroll.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ payslipId: string }> }
) {
  try {
    const session = await getAuthSession(request.headers);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 });
    }

    const { payslipId } = await params;
    const slip = await getPayslipDetail(payslipId);

    if (!slip) {
      return NextResponse.json({ error: "Payslip not found" }, { status: 404 });
    }

    const userRole = normalizeRole((session.user as { role?: string })?.role);
    const canReadAll = hasPermission(userRole, "payslip", "read");
    const canReadSelf = hasPermission(userRole, "payslip", "read-self");

    if (!canReadAll) {
      if (!canReadSelf) {
        return NextResponse.json(
          { error: "Forbidden: You do not have permission to view payslips" },
          { status: 403 }
        );
      }
      const currentEmployee = await getCurrentEmployee(session.user.id);
      if (!currentEmployee || currentEmployee.id !== slip.employeeId) {
        return NextResponse.json(
          { error: "Forbidden: You can only view your own payslips" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ data: slip });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payslip" },
      { status }
    );
  }
}
