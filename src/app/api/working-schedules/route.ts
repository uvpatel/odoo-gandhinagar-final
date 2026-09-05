import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { workingSchedules, workingScheduleLines } from "@/db/schema";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { eq } from "drizzle-orm";
import { scheduleLineSchema, weeklyHours } from "@/server/domain/hr";
const schema = z.object({ id: z.string().uuid().optional(), name: z.string().trim().min(1).max(120), scheduleType: z.string().max(30).default("standard"), timezone: z.string().refine((v) => { try { new Intl.DateTimeFormat("en", { timeZone: v }); return true; } catch { return false; } }, "Invalid timezone"), isActive: z.boolean().default(true), lines: z.array(scheduleLineSchema).min(1).max(21) });
function failure(error: unknown) { return NextResponse.json({ error: error instanceof Error ? error.message : "Schedule operation failed" }, { status: error instanceof AuthorizationError ? error.status : 400 }); }
export async function GET(request: NextRequest) {
  try {
    await requirePermission("workingSchedule", "read", request.headers);
    const [schedules, lines] = await Promise.all([db.select().from(workingSchedules), db.select().from(workingScheduleLines)]);
    return NextResponse.json({ data: schedules.map((s) => { const ownLines = lines.filter((l) => l.scheduleId === s.id); return { ...s, lines: ownLines, weeklyHours: weeklyHours(ownLines) }; }) });
  } catch (error) { return failure(error); }
}
async function save(request: NextRequest, update: boolean) {
  try {
    await requirePermission("workingSchedule", update ? "update" : "create", request.headers);
    const { id, lines, ...values } = schema.parse(await request.json());
    weeklyHours(lines);
    if (update && !id) throw new Error("Schedule ID required");
    const data = await db.transaction(async (tx) => {
      const [schedule] = update && id ? await tx.update(workingSchedules).set({ ...values, updatedAt: new Date() }).where(eq(workingSchedules.id, id)).returning() : await tx.insert(workingSchedules).values(values).returning();
      if (!schedule) throw new AuthorizationError("Schedule not found", 404);
      await tx.delete(workingScheduleLines).where(eq(workingScheduleLines.scheduleId, schedule.id));
      await tx.insert(workingScheduleLines).values(lines.map((line) => ({ ...line, scheduleId: schedule.id })));
      return { ...schedule, lines, weeklyHours: weeklyHours(lines) };
    });
    return NextResponse.json({ data }, { status: update ? 200 : 201 });
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) { return save(request, false); }
export async function PUT(request: NextRequest) { return save(request, true); }
export async function DELETE(request: NextRequest) {
  try {
    await requirePermission("workingSchedule", "delete", request.headers);
    const id = z.string().uuid().parse(request.nextUrl.searchParams.get("id"));
    await db.update(workingSchedules).set({ isActive: false }).where(eq(workingSchedules.id, id));
    return NextResponse.json({ message: "Schedule archived" });
  } catch (error) { return failure(error); }
}
