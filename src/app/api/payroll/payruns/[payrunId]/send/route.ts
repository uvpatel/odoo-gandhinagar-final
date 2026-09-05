import { NextRequest, NextResponse } from "next/server";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { sendPayrunPayslipsExecution } from "@/features/payroll/services/payroll.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ payrunId: string }> }
) {
  try {
    await requirePermission("payrun", "send", request.headers);
    const { payrunId } = await params;

    const result = await sendPayrunPayslipsExecution(payrunId);

    return NextResponse.json({
      data: result,
      message: result.summary,
    });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to send payslips" },
      { status }
    );
  }
}
