import { NextRequest, NextResponse } from "next/server";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { transitionAllocation } from "@/server/services/time-off/approval";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ allocationId: string }> }
) {
  try {
    const session = await requirePermission("timeOffAllocation", "update", request.headers);
    const { allocationId } = await params;

    const updated = await transitionAllocation(allocationId, "approved", session.user.id);
    return NextResponse.json({ data: updated });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to approve allocation" },
      { status }
    );
  }
}
