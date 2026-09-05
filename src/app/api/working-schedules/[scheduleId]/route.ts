import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { workingSchedules, workingScheduleLines } from "@/db/schema";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { eq } from "drizzle-orm";
import { scheduleLineSchema, weeklyHours } from "@/server/domain/hr";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  scheduleType: z.string().max(30).optional(),
  timezone: z
    .string()
    .refine((v) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: v });
        return true;
      } catch {
        return false;
      }
    }, "Invalid timezone")
    .optional(),
  isActive: z.boolean().optional(),
  lines: z.array(scheduleLineSchema).min(1).max(21).optional(),
});

function failure(error: unknown) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Schedule operation failed" },
    { status: error instanceof AuthorizationError ? error.status : 400 }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    await requirePermission("workingSchedule", "read", request.headers);
    const { scheduleId } = await params;

    const [schedule] = await db
      .select()
      .from(workingSchedules)
      .where(eq(workingSchedules.id, scheduleId))
      .limit(1);

    if (!schedule) {
      return NextResponse.json({ error: "Working schedule not found" }, { status: 404 });
    }

    const lines = await db
      .select()
      .from(workingScheduleLines)
      .where(eq(workingScheduleLines.scheduleId, scheduleId));

    return NextResponse.json({
      data: {
        ...schedule,
        lines,
        weeklyHours: weeklyHours(lines),
      },
    });
  } catch (error) {
    return failure(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    await requirePermission("workingSchedule", "update", request.headers);
    const { scheduleId } = await params;
    const body = updateSchema.parse(await request.json());

    const data = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(workingSchedules)
        .where(eq(workingSchedules.id, scheduleId))
        .limit(1);

      if (!existing) throw new AuthorizationError("Working schedule not found", 404);

      if (body.lines) {
        weeklyHours(body.lines);
      }

      const [updated] = await tx
        .update(workingSchedules)
        .set({
          name: body.name !== undefined ? body.name : undefined,
          scheduleType: body.scheduleType !== undefined ? body.scheduleType : undefined,
          timezone: body.timezone !== undefined ? body.timezone : undefined,
          isActive: body.isActive !== undefined ? body.isActive : undefined,
          updatedAt: new Date(),
        })
        .where(eq(workingSchedules.id, scheduleId))
        .returning();

      let activeLines;
      if (body.lines) {
        await tx
          .delete(workingScheduleLines)
          .where(eq(workingScheduleLines.scheduleId, scheduleId));
        activeLines = await tx
          .insert(workingScheduleLines)
          .values(body.lines.map((l) => ({ ...l, scheduleId })))
          .returning();
      } else {
        activeLines = await tx
          .select()
          .from(workingScheduleLines)
          .where(eq(workingScheduleLines.scheduleId, scheduleId));
      }

      return {
        ...updated,
        lines: activeLines,
        weeklyHours: weeklyHours(activeLines),
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    await requirePermission("workingSchedule", "delete", request.headers);
    const { scheduleId } = await params;

    const [existing] = await db
      .select()
      .from(workingSchedules)
      .where(eq(workingSchedules.id, scheduleId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Working schedule not found" }, { status: 404 });
    }

    await db
      .update(workingSchedules)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(workingSchedules.id, scheduleId));

    return NextResponse.json({ message: "Working schedule archived successfully" });
  } catch (error) {
    return failure(error);
  }
}
