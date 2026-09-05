import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const { scheduleId } = await params;
  return NextResponse.json({
    message: "GET request successful",
    scheduleId,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const { scheduleId } = await params;
  return NextResponse.json({
    message: "POST request successful",
    scheduleId,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const { scheduleId } = await params;
  return NextResponse.json({
    message: "PUT request successful",
    scheduleId,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const { scheduleId } = await params;
  return NextResponse.json({
    message: "DELETE request successful",
    scheduleId,
  });
}
