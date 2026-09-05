import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ payrunId: string }> }
) {
  const { payrunId } = await params;
  return NextResponse.json({
    message: "GET request successful",
    payrunId,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ payrunId: string }> }
) {
  const { payrunId } = await params;
  return NextResponse.json({
    message: "POST request successful",
    payrunId,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ payrunId: string }> }
) {
  const { payrunId } = await params;
  return NextResponse.json({
    message: "PUT request successful",
    payrunId,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ payrunId: string }> }
) {
  const { payrunId } = await params;
  return NextResponse.json({
    message: "DELETE request successful",
    payrunId,
  });
}
