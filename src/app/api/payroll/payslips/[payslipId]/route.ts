import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ payslipId: string }> }
) {
  const { payslipId } = await params;
  return NextResponse.json({
    message: "GET request successful",
    payslipId,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ payslipId: string }> }
) {
  const { payslipId } = await params;
  return NextResponse.json({
    message: "POST request successful",
    payslipId,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ payslipId: string }> }
) {
  const { payslipId } = await params;
  return NextResponse.json({
    message: "PUT request successful",
    payslipId,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ payslipId: string }> }
) {
  const { payslipId } = await params;
  return NextResponse.json({
    message: "DELETE request successful",
    payslipId,
  });
}
