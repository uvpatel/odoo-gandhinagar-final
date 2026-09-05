import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { salaryStructures, salaryStructureRules, salaryRules } from "@/db/schema";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
const structureSchema = z.object({ id: z.string().uuid().optional(), name: z.string().trim().min(1).max(120), code: z.string().regex(/^[A-Z][A-Z0-9_]*$/).max(30), description: z.string().max(2000).nullish(), isActive: z.boolean().default(true), ruleIds: z.array(z.string().uuid()).max(100).refine((v) => new Set(v).size === v.length, "Duplicate rules") });
function failure(error: unknown) { return NextResponse.json({ error: error instanceof Error ? error.message : "Structure operation failed" }, { status: error instanceof AuthorizationError ? error.status : 400 }); }
export async function GET(request: NextRequest) {
  try {
    await requirePermission("salaryStructure", "read", request.headers);
    const [structures, links] = await Promise.all([db.select().from(salaryStructures).orderBy(asc(salaryStructures.name)), db.select().from(salaryStructureRules).orderBy(asc(salaryStructureRules.sequence))]);
    return NextResponse.json({ data: structures.map((s) => ({ ...s, ruleIds: links.filter((l) => l.salaryStructureId === s.id).map((l) => l.salaryRuleId), ruleCount: links.filter((l) => l.salaryStructureId === s.id).length })) });
  } catch (error) { return failure(error); }
}
async function save(request: NextRequest, update: boolean) {
  try {
    await requirePermission("salaryStructure", update ? "update" : "create", request.headers);
    const { id, ruleIds, ...values } = structureSchema.parse(await request.json());
    if (update && !id) throw new Error("Structure ID required");
    const data = await db.transaction(async (tx) => {
      if (ruleIds.length) {
        const found = await tx.select().from(salaryRules).where(inArray(salaryRules.id, ruleIds));
        if (found.length !== ruleIds.length) throw new Error("Unknown salary rule");
      }
      const [structure] = update && id ? await tx.update(salaryStructures).set({ ...values, updatedAt: new Date() }).where(eq(salaryStructures.id, id)).returning() : await tx.insert(salaryStructures).values(values).returning();
      if (!structure) throw new AuthorizationError("Structure not found", 404);
      await tx.delete(salaryStructureRules).where(eq(salaryStructureRules.salaryStructureId, structure.id));
      if (ruleIds.length) await tx.insert(salaryStructureRules).values(ruleIds.map((salaryRuleId, i) => ({ salaryStructureId: structure.id, salaryRuleId, sequence: (i + 1) * 10, isActive: true })));
      return structure;
    });
    return NextResponse.json({ data }, { status: update ? 200 : 201 });
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) { return save(request, false); }
export async function PUT(request: NextRequest) { return save(request, true); }
export async function DELETE(request: NextRequest) {
  try {
    await requirePermission("salaryStructure", "delete", request.headers);
    const id = z.string().uuid().parse(request.nextUrl.searchParams.get("id"));
    await db.delete(salaryStructures).where(eq(salaryStructures.id, id));
    return NextResponse.json({ message: "Structure deleted" });
  } catch (error) { return failure(error); }
}
