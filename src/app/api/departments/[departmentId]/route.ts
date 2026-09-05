import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  const { departmentId } = await params;
  return NextResponse.json({
    message: "GET request successful",
    departmentId,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  const { departmentId } = await params;
  return NextResponse.json({
    message: "POST request successful",
    departmentId,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  const { departmentId } = await params;
  return NextResponse.json({
    message: "PUT request successful",
    departmentId,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  const { departmentId } = await params;
  return NextResponse.json({
    message: "DELETE request successful",
    departmentId,
  });
}
