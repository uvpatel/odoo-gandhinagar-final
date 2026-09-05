import { NextRequest, NextResponse } from "next/server";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { sendSinglePayslipExecution } from "@/features/payroll/services/payroll.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ payslipId: string }> }
) {
  try {
    await requirePermission("payslip", "send", request.headers);
    const { payslipId } = await params;

    const result = await sendSinglePayslipExecution(payslipId);

    return NextResponse.json({
      data: result,
      message: `Payslip email sent successfully to ${result.email}`,
    });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to send payslip email" },
      { status }
    );
  }
}
