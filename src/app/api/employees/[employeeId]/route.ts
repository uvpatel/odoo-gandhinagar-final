import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const { employeeId } = await params;
  return NextResponse.json({
    message: "GET request successful",
    employeeId,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const { employeeId } = await params;
  return NextResponse.json({
    message: "POST request successful",
    employeeId,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const { employeeId } = await params;
  return NextResponse.json({
    message: "PUT request successful",
    employeeId,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const { employeeId } = await params;
  return NextResponse.json({
    message: "DELETE request successful",
    employeeId,
  });
}
