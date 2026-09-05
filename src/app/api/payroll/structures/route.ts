import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { salaryStructures, salaryStructureRules, salaryRules } from "@/db/schema";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

const structureSchema = z.object({
  id: z.string().uuid().or(z.literal("")).nullish().transform((v) => v || undefined),
  name: z.string().trim().min(1, "Name is required").max(120),
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(30)
    .transform((v) => v.toUpperCase().replace(/\s+/g, "_")),
  description: z.string().max(2000).nullish(),
  isActive: z.boolean().default(true),
  ruleIds: z
    .array(z.string().uuid())
    .default([])
    .refine((v) => new Set(v).size === v.length, "Duplicate rules selected"),
});

function failure(error: unknown) {
  let message = "Structure operation failed";
  let status = 400;

  if (error instanceof AuthorizationError) {
    status = error.status;
    message = error.message;
  } else if (error instanceof z.ZodError) {
    message = error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
  } else if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("unique") || msg.includes("duplicate") || msg.includes("salary_structures_code_key")) {
      message = "A salary structure with this code already exists. Please use a unique code.";
    } else {
      message = error.message;
    }
  }

  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    await requirePermission("salaryStructure", "read", request.headers);
    const [structures, links] = await Promise.all([
      db.select().from(salaryStructures).orderBy(asc(salaryStructures.name)),
      db.select().from(salaryStructureRules).orderBy(asc(salaryStructureRules.sequence)),
    ]);

    const data = structures.map((s) => {
      const sLinks = links.filter((l) => l.salaryStructureId === s.id);
      return {
        ...s,
        ruleIds: sLinks.map((l) => l.salaryRuleId),
        ruleCount: sLinks.length,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    return failure(error);
  }
}

async function save(request: NextRequest, update: boolean) {
  try {
    await requirePermission("salaryStructure", update ? "update" : "create", request.headers);
    const rawBody = await request.json();
    const { id, ruleIds, ...values } = structureSchema.parse(rawBody);

    if (update && !id) {
      throw new Error("Structure ID is required for update");
    }

    const data = await db.transaction(async (tx) => {
      if (ruleIds.length) {
        const found = await tx.select().from(salaryRules).where(inArray(salaryRules.id, ruleIds));
        if (found.length !== ruleIds.length) {
          throw new Error("One or more selected salary rules were not found");
        }
      }

      let structure;
      if (update && id) {
        const [updated] = await tx
          .update(salaryStructures)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(salaryStructures.id, id))
          .returning();
        structure = updated;
      } else {
        const [created] = await tx
          .insert(salaryStructures)
          .values({
            name: values.name,
            code: values.code,
            description: values.description || null,
            isActive: values.isActive,
          })
          .returning();
        structure = created;
      }

      if (!structure) {
        throw new AuthorizationError("Salary structure not found", 404);
      }

      // Sync rule mappings
      await tx.delete(salaryStructureRules).where(eq(salaryStructureRules.salaryStructureId, structure.id));
      if (ruleIds.length) {
        await tx.insert(salaryStructureRules).values(
          ruleIds.map((salaryRuleId, i) => ({
            salaryStructureId: structure.id,
            salaryRuleId,
            sequence: (i + 1) * 10,
            isActive: true,
          }))
        );
      }

      return structure;
    });

    return NextResponse.json({ data }, { status: update ? 200 : 201 });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  return save(request, false);
}

export async function PUT(request: NextRequest) {
  return save(request, true);
}

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission("salaryStructure", "delete", request.headers);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      throw new Error("Structure ID is required");
    }

    await db.delete(salaryStructures).where(eq(salaryStructures.id, id));
    return NextResponse.json({ message: "Salary structure deleted successfully" });
  } catch (error) {
    return failure(error);
  }
}
