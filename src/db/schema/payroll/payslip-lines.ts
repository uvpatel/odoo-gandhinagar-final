import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  numeric,
  index,
} from "drizzle-orm/pg-core";
import { payslips } from "./payslips";
import { salaryRules, salaryRuleCategoryEnum } from "./salary-rules";

export const payslipLines = pgTable(
  "payslip_lines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    payslipId: uuid("payslip_id")
      .notNull()
      .references(() => payslips.id, {
        onDelete: "cascade",
      }),
    salaryRuleId: uuid("salary_rule_id")
      .references(() => salaryRules.id),
    ruleCode: varchar("rule_code", {
      length: 30,
    }).notNull(),
    ruleName: varchar("rule_name", {
      length: 120,
    }).notNull(),
    category: salaryRuleCategoryEnum("category")
      .notNull(),
    sequence: integer("sequence").notNull(),
    amount: numeric("amount", {
      precision: 14,
      scale: 2,
    }).notNull(),
    quantity: numeric("quantity", {
      precision: 12,
      scale: 4,
    })
      .default("1")
      .notNull(),
    rate: numeric("rate", {
      precision: 12,
      scale: 4,
    })
      .default("100")
      .notNull(),
    total: numeric("total", {
      precision: 14,
      scale: 2,
    }).notNull(),
    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("payslip_lines_payslip_idx").on(table.payslipId),
    index("payslip_lines_rule_idx").on(table.salaryRuleId),
  ],
);

export type PayslipLine = typeof payslipLines.$inferSelect;
export type NewPayslipLine = typeof payslipLines.$inferInsert;
