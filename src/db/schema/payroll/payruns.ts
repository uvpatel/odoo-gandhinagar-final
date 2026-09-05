import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  date,
  text,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { salaryStructures } from "./salary-structures";
import { users } from "../auth/users";

export const payrunStatusEnum = pgEnum("payrun_status", [
  "draft",
  "computed",
  "validated",
  "paid",
  "cancelled",
]);

export const payruns = pgTable(
  "payruns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", {
      length: 150,
    }).notNull(),
    salaryStructureId: uuid("salary_structure_id")
      .notNull()
      .references(() => salaryStructures.id),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    status: payrunStatusEnum("status")
      .default("draft")
      .notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    computedAt: timestamp("computed_at"),
    validatedAt: timestamp("validated_at"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("payrun_period_idx").on(table.periodStart, table.periodEnd),
    index("payrun_status_idx").on(table.status),
  ],
);

export const payrun = payruns;
export type Payrun = typeof payruns.$inferSelect;
export type NewPayrun = typeof payruns.$inferInsert;
