import { NextRequest, NextResponse } from "next/server";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { createPayrunSchema } from "@/features/payroll/schemas/payrun.schema";
import {
  getPayrunsList,
  createPayrunTransaction,
} from "@/features/payroll/services/payroll.service";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("payrun", "read", request.headers);

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || undefined;
    const status = searchParams.get("status") || undefined;
    const structureId = searchParams.get("structureId") || undefined;
    const search = searchParams.get("q") || undefined;

    const payruns = await getPayrunsList({
      period,
      status,
      structureId,
      search,
    });

    return NextResponse.json({ data: payruns });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payruns" },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("payrun", "create", request.headers);
    const body = await request.json();

    const parsed = createPayrunSchema.safeParse(body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const payrun = await createPayrunTransaction(parsed.data, session.user.id);

    return NextResponse.json(
      { data: payrun, message: "Payrun created successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to create payrun" },
      { status }
    );
  }
}
