import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const { contractId } = await params;
  return NextResponse.json({
    message: "GET request successful",
    contractId,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const { contractId } = await params;
  return NextResponse.json({
    message: "POST request successful",
    contractId,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const { contractId } = await params;
  return NextResponse.json({
    message: "PUT request successful",
    contractId,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const { contractId } = await params;
  return NextResponse.json({
    message: "DELETE request successful",
    contractId,
  });
}
