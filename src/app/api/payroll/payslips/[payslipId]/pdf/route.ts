import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, getCurrentEmployee, AuthorizationError } from "@/lib/auth/authorization";
import { normalizeRole, hasPermission } from "@/lib/auth/permissions";
import { getPayslipDetail } from "@/features/payroll/services/payroll.service";
import { generatePayslipPdf } from "@/server/services/payroll/pdf-generator";

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
    const canPrintAll = hasPermission(userRole, "payslip", "print");
    const canPrintSelf = hasPermission(userRole, "payslip", "print-self");

    if (!canPrintAll) {
      if (!canPrintSelf) {
        return NextResponse.json(
          { error: "Forbidden: You do not have permission to print payslips" },
          { status: 403 }
        );
      }
      const currentEmployee = await getCurrentEmployee(session.user.id);
      if (!currentEmployee || currentEmployee.id !== slip.employeeId) {
        return NextResponse.json(
          { error: "Forbidden: You can only print your own payslip" },
          { status: 403 }
        );
      }
    }

    const pdfBytes = await generatePayslipPdf(slip);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="payslip-${slip.payslipNumber}.pdf"`,
        "Content-Length": String(pdfBytes.byteLength),
      },
    });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to generate printable payslip" },
      { status }
    );
  }
}
