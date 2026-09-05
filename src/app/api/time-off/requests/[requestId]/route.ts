import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;
  return NextResponse.json({
    message: "GET request successful",
    requestId,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;
  return NextResponse.json({
    message: "POST request successful",
    requestId,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;
  return NextResponse.json({
    message: "PUT request successful",
    requestId,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;
  return NextResponse.json({
    message: "DELETE request successful",
    requestId,
  });
}
