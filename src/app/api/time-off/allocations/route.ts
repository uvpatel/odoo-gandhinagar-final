import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "GET request successful",
  });
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
