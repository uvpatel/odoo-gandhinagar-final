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
    const session = await requirePermission("timeOffRequest", "approve", request.headers);

    const [updated] = await db
      .update(timeOffRequests)
      .set({
        status: "approved",
        approvedBy: session.user.id,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(timeOffRequests.id, requestId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Time-off request not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to approve time-off request" },
      { status }
    );
  }
}
