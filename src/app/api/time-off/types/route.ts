import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { timeOffTypes } from "@/db/schema";
import { requireAuth } from "@/lib/auth/authorization";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request.headers);
    const types = await db.select().from(timeOffTypes);
    return NextResponse.json({ data: types });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch time-off types" },
      { status: 500 }
    );
  }
}
