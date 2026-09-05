import {
  pgTable,
  uuid,
  integer,
  time,
} from "drizzle-orm/pg-core";
import { workingSchedules } from "./working-schedules";

export const workingScheduleLines = pgTable(
  "working_schedule_lines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scheduleId: uuid("schedule_id")
      .notNull()
      .references(() => workingSchedules.id, {
        onDelete: "cascade",
      }),
    dayOfWeek: integer("day_of_week").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    breakMinutes: integer("break_minutes")
      .default(0)
      .notNull(),
  },
);

export type WorkingScheduleLine = typeof workingScheduleLines.$inferSelect;
export type NewWorkingScheduleLine = typeof workingScheduleLines.$inferInsert;
