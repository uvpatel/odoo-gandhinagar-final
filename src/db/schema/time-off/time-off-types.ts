import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const leaveUnitEnum = pgEnum("leave_unit", [
  "days",
  "hours",
]);

export const approvalModeEnum = pgEnum(
  "approval_mode",
  [
    "none",
    "manager",
    "hr",
    "manager_and_hr",
  ],
);

export const timeOffTypes = pgTable("time_off_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", {
    length: 100,
  }).notNull(),
  code: varchar("code", {
    length: 30,
  })
    .notNull()
    .unique(),
  unit: leaveUnitEnum("unit")
    .default("days")
    .notNull(),
  requiresAllocation: boolean("requires_allocation")
    .default(true)
    .notNull(),
  approvalMode: approvalModeEnum("approval_mode")
    .default("manager")
    .notNull(),
  isPaid: boolean("is_paid")
    .default(true)
    .notNull(),
  isActive: boolean("is_active")
    .default(true)
    .notNull(),
  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

export type TimeOffType = typeof timeOffTypes.$inferSelect;
export type NewTimeOffType = typeof timeOffTypes.$inferInsert;
