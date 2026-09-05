import { transitionLeave } from "@/server/services/time-off/approval";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { timeOffRequests } from "@/db/schema";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const session = await requirePermission("timeOffRequest", "refuse", request.headers);
    const body = await request.json().catch(() => ({}));

    const updated = await transitionLeave(requestId, "refused", session.user.id, body.reason);

    if (!updated) {
      return NextResponse.json({ error: "Time-off request not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to refuse time-off request" },
      { status }
    );
  }
}
