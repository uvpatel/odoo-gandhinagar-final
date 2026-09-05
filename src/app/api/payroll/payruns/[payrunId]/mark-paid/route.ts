import { NextRequest, NextResponse } from "next/server";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { markPayrunPaidExecution } from "@/features/payroll/services/payroll.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ payrunId: string }> }
) {
  try {
    await requirePermission("payrun", "mark-paid", request.headers);
    const { payrunId } = await params;

    const updated = await markPayrunPaidExecution(payrunId);

    return NextResponse.json({
      data: updated,
      message: "Payrun marked as paid successfully",
    });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to mark payrun as paid" },
      { status }
    );
  }
}
