import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { salaryRules } from "@/db/schema";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { asc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("salaryRule", "read", request.headers);
    const rules = await db
      .select()
      .from(salaryRules)
      .orderBy(asc(salaryRules.sequence));

    return NextResponse.json({ data: rules });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to fetch salary rules" },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission("salaryRule", "create", request.headers);
    const body = await request.json();

    const [newRule] = await db
      .insert(salaryRules)
      .values({
        name: body.name,
        code: body.code,
        category: body.category,
        computationType: body.computationType,
        fixedAmount: body.fixedAmount !== undefined && body.fixedAmount !== null ? String(body.fixedAmount) : null,
        percentage: body.percentage !== undefined && body.percentage !== null ? String(body.percentage) : null,
        percentageBase: body.percentageBase || null,
        formula: body.formula || null,
        sequence: body.sequence !== undefined ? Number(body.sequence) : 10,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      })
      .returning();

    return NextResponse.json({ data: newRule }, { status: 201 });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to create salary rule" },
      { status }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requirePermission("salaryRule", "update", request.headers);
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Missing rule id" }, { status: 400 });
    }

    const [updatedRule] = await db
      .update(salaryRules)
      .set({
        name: body.name,
        code: body.code,
        category: body.category,
        computationType: body.computationType,
        fixedAmount: body.fixedAmount !== undefined ? String(body.fixedAmount) : undefined,
        percentage: body.percentage !== undefined ? String(body.percentage) : undefined,
        percentageBase: body.percentageBase,
        formula: body.formula,
        sequence: body.sequence !== undefined ? Number(body.sequence) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(salaryRules.id, body.id))
      .returning();

    return NextResponse.json({ data: updatedRule });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to update salary rule" },
      { status }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission("salaryRule", "delete", request.headers);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing rule id parameter" }, { status: 400 });
    }

    await db.delete(salaryRules).where(eq(salaryRules.id, id));
    return NextResponse.json({ message: "Salary rule deleted successfully" });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to delete salary rule" },
      { status }
    );
  }
}
