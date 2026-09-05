import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const workingSchedules = pgTable("working_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  scheduleType: varchar("schedule_type", {
    length: 30,
  })
    .default("standard")
    .notNull(),
  timezone: varchar("timezone", {
    length: 100,
  })
    .default("Asia/Kolkata")
    .notNull(),
  isActive: boolean("is_active")
    .default(true)
    .notNull(),
  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

export type WorkingSchedule = typeof workingSchedules.$inferSelect;
export type NewWorkingSchedule = typeof workingSchedules.$inferInsert;
