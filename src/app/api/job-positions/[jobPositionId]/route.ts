import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobPositionId: string }> }
) {
  const { jobPositionId } = await params;
  return NextResponse.json({
    message: "GET request successful",
    jobPositionId,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobPositionId: string }> }
) {
  const { jobPositionId } = await params;
  return NextResponse.json({
    message: "POST request successful",
    jobPositionId,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ jobPositionId: string }> }
) {
  const { jobPositionId } = await params;
  return NextResponse.json({
    message: "PUT request successful",
    jobPositionId,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobPositionId: string }> }
) {
  const { jobPositionId } = await params;
  return NextResponse.json({
    message: "DELETE request successful",
    jobPositionId,
  });
}
