import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { workingSchedules } from "@/db/schema";
import { getAuthSession } from "@/lib/auth/authorization";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request.headers);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await db.select().from(workingSchedules);
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch working schedules" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    message: "POST request successful",
  });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({
    message: "PUT request successful",
  });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({
    message: "DELETE request successful",
  });
}

