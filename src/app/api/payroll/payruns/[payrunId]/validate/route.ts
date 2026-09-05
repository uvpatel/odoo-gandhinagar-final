import { NextRequest, NextResponse } from "next/server";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { validatePayrunExecution } from "@/features/payroll/services/payroll.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ payrunId: string }> }
) {
  try {
    await requirePermission("payrun", "validate", request.headers);
    const { payrunId } = await params;

    const validated = await validatePayrunExecution(payrunId);

    return NextResponse.json({
      data: validated,
      message: "Payrun validated successfully",
    });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to validate payrun" },
      { status }
    );
  }
}
