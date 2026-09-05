import { NextRequest, NextResponse } from "next/server";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { getPayrunDetail } from "@/features/payroll/services/payroll.service";
import { db } from "@/db/index";
import { payruns, payslips, payslipLines, payslipWarnings } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ payrunId: string }> }
) {
  try {
    await requirePermission("payrun", "read", request.headers);
    const { payrunId } = await params;

    const payrun = await getPayrunDetail(payrunId);
    if (!payrun) {
      return NextResponse.json({ error: "Payrun not found" }, { status: 404 });
    }

    return NextResponse.json({ data: payrun });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payrun detail" },
      { status }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ payrunId: string }> }
) {
  try {
    await requirePermission("payrun", "delete", request.headers);
    const { payrunId } = await params;

    const [existing] = await db
      .select()
      .from(payruns)
      .where(eq(payruns.id, payrunId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Payrun not found" }, { status: 404 });
    }

    if (existing.status === "paid") {
      return NextResponse.json(
        { error: "Finalized / paid payruns cannot be deleted. They must remain historical records." },
        { status: 400 }
      );
    }

    // Delete payslips and lines
    const slips = await db
      .select({ id: payslips.id })
      .from(payslips)
      .where(eq(payslips.payrunId, payrunId));

    const slipIds = slips.map((s) => s.id);
    if (slipIds.length > 0) {
      await db.delete(payslipWarnings).where(inArray(payslipWarnings.payslipId, slipIds));
      await db.delete(payslipLines).where(inArray(payslipLines.payslipId, slipIds));
      await db.delete(payslips).where(eq(payslips.payrunId, payrunId));
    }

    await db.delete(payruns).where(eq(payruns.id, payrunId));

    return NextResponse.json({ message: "Payrun deleted successfully" });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to delete payrun" },
      { status }
    );
  }
}
