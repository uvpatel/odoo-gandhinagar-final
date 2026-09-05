import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { salaryStructures } from "@/db/schema";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { asc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("salaryStructure", "read", request.headers);
    const structures = await db
      .select()
      .from(salaryStructures)
      .orderBy(asc(salaryStructures.name));

    return NextResponse.json({ data: structures });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to fetch salary structures" },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission("salaryStructure", "create", request.headers);
    const body = await request.json();

    const [newStructure] = await db
      .insert(salaryStructures)
      .values({
        name: body.name,
        code: body.code,
        description: body.description || null,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      })
      .returning();

    return NextResponse.json({ data: newStructure }, { status: 201 });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to create salary structure" },
      { status }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requirePermission("salaryStructure", "update", request.headers);
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Missing structure id" }, { status: 400 });
    }

    const [updatedStructure] = await db
      .update(salaryStructures)
      .set({
        name: body.name,
        code: body.code,
        description: body.description,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(salaryStructures.id, body.id))
      .returning();

    return NextResponse.json({ data: updatedStructure });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to update salary structure" },
      { status }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission("salaryStructure", "delete", request.headers);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing structure id parameter" }, { status: 400 });
    }

    await db.delete(salaryStructures).where(eq(salaryStructures.id, id));
    return NextResponse.json({ message: "Salary structure deleted successfully" });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to delete salary structure" },
      { status }
    );
  }
}
