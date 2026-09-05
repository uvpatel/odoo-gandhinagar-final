import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { payslips } from "./payslips";

export const warningSeverityEnum = pgEnum(
  "warning_severity",
  [
    "info",
    "warning",
    "error",
  ],
);

export const payslipWarnings = pgTable(
  "payslip_warnings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    payslipId: uuid("payslip_id")
      .notNull()
      .references(() => payslips.id, {
        onDelete: "cascade",
      }),
    code: varchar("code", {
      length: 50,
    }).notNull(),
    severity: warningSeverityEnum("severity")
      .notNull(),
    message: text("message").notNull(),
    resolved: boolean("resolved")
      .default(false)
      .notNull(),
    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("payslip_warnings_payslip_idx").on(table.payslipId),
  ],
);

export type PayslipWarning = typeof payslipWarnings.$inferSelect;
export type NewPayslipWarning = typeof payslipWarnings.$inferInsert;
