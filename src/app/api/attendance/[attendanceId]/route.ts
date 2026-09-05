import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attendanceId: string }> }
) {
  const { attendanceId } = await params;
  return NextResponse.json({
    message: "GET request successful",
    attendanceId,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ attendanceId: string }> }
) {
  const { attendanceId } = await params;
  return NextResponse.json({
    message: "POST request successful",
    attendanceId,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ attendanceId: string }> }
) {
  const { attendanceId } = await params;
  return NextResponse.json({
    message: "PUT request successful",
    attendanceId,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ attendanceId: string }> }
) {
  const { attendanceId } = await params;
  return NextResponse.json({
    message: "DELETE request successful",
    attendanceId,
  });
}
