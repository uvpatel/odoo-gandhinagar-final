import { NextRequest, NextResponse } from "next/server";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { computePayrunExecution } from "@/features/payroll/services/payroll.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ payrunId: string }> }
) {
  try {
    await requirePermission("payrun", "compute", request.headers);
    const { payrunId } = await params;

    const updated = await computePayrunExecution(payrunId);

    return NextResponse.json({
      data: updated,
      message: "Payrun computation executed successfully",
    });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to compute payrun" },
      { status }
    );
  }
}
