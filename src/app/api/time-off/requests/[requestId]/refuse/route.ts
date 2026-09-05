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
    await requirePermission("timeOffRequest", "refuse", request.headers);
    const body = await request.json().catch(() => ({}));

    const [updated] = await db
      .update(timeOffRequests)
      .set({
        status: "refused",
        refusalReason: body.reason || "Refused by manager",
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
      { error: error.message || "Failed to refuse time-off request" },
      { status }
    );
  }
}
