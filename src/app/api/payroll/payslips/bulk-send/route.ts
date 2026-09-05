import { NextRequest, NextResponse } from "next/server";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { sendBulkPayslipsExecution } from "@/features/payroll/services/payroll.service";

export async function POST(request: NextRequest) {
  try {
    await requirePermission("payslip", "send", request.headers);

    const body = await request.json();
    const { payslipIds, overrideRecipient, attachPdf, customNote } = body || {};

    if (!Array.isArray(payslipIds) || payslipIds.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one payslip to send." },
        { status: 400 }
      );
    }

    const result = await sendBulkPayslipsExecution(payslipIds, {
      overrideRecipient: typeof overrideRecipient === "string" ? overrideRecipient.trim() : undefined,
      attachPdf: typeof attachPdf === "boolean" ? attachPdf : true,
      customNote: typeof customNote === "string" ? customNote.trim() : undefined,
    });

    return NextResponse.json({
      data: result,
      message: result.summary,
    });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to bulk send payslips" },
      { status }
    );
  }
}
