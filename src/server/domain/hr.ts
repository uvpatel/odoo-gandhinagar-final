import { z } from "zod";
export const dateSchema = z.iso.date();
export const periodSchema = z.object({ startDate: dateSchema, endDate: dateSchema }).refine((v) => v.endDate >= v.startDate, "End date must follow start date");
export function calendarDays(startDate: string, endDate: string): number {
  periodSchema.parse({ startDate, endDate });
  return (Date.parse(endDate) - Date.parse(startDate)) / 86400000 + 1;
}
export const scheduleLineSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(?::00)?$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(?::00)?$/),
  breakMinutes: z.number().int().nonnegative(),
}).refine((v) => timeMinutes(v.endTime) > timeMinutes(v.startTime) + v.breakMinutes, "End must follow start and leave positive working time after breaks; overnight shifts are unsupported");
export function timeMinutes(time: string) { const [hours, minutes] = time.split(":").map(Number); return hours * 60 + minutes; }
export function weeklyHours(lines: z.infer<typeof scheduleLineSchema>[]) {
  const parsed = z.array(scheduleLineSchema).parse(lines);
  for (const [i, line] of parsed.entries()) {
    if (parsed.slice(i + 1).some((other) => line.dayOfWeek === other.dayOfWeek && line.startTime < other.endTime && other.startTime < line.endTime)) throw new Error("Schedule intervals overlap");
  }
  return parsed.reduce((sum, line) => sum + timeMinutes(line.endTime) - timeMinutes(line.startTime) - line.breakMinutes, 0) / 60;
}
export function remainingAllocation(allocated: number, consumed: number, requested: number) {
  if (![allocated, consumed, requested].every(Number.isFinite) || allocated < 0 || consumed < 0 || requested <= 0) throw new Error("Invalid allocation amount");
  const remaining = Math.round((allocated - consumed - requested) * 100) / 100;
  if (remaining < 0) throw new Error("Insufficient leave allocation");
  return remaining;
}
