import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  date,
  numeric,
  pgEnum,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { payruns } from "./payruns";
import { employees } from "../employees/employees";
import { contracts } from "../contracts/contracts";
import { salaryStructures } from "./salary-structures";

export const payslipStatusEnum = pgEnum(
  "payslip_status",
  [
    "draft",
    "computed",
    "validated",
    "paid",
    "cancelled",
  ],
);

export const payslips = pgTable(
  "payslips",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    payslipNumber: varchar("payslip_number", {
      length: 50,
    })
      .notNull()
      .unique(),
    payrunId: uuid("payrun_id")
      .notNull()
      .references(() => payruns.id),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id),
    contractId: uuid("contract_id")
      .notNull()
      .references(() => contracts.id),
    salaryStructureId: uuid("salary_structure_id")
      .notNull()
      .references(() => salaryStructures.id),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    workedDays: numeric("worked_days", {
      precision: 8,
      scale: 2,
    }).default("0"),
    workedHours: numeric("worked_hours", {
      precision: 10,
      scale: 2,
    }).default("0"),
    basicAmount: numeric("basic_amount", {
      precision: 14,
      scale: 2,
    }).default("0"),
    grossAmount: numeric("gross_amount", {
      precision: 14,
      scale: 2,
    }).default("0"),
    deductionAmount: numeric("deduction_amount", {
      precision: 14,
      scale: 2,
    }).default("0"),
    netAmount: numeric("net_amount", {
      precision: 14,
      scale: 2,
    }).default("0"),
    status: payslipStatusEnum("status")
      .default("draft")
      .notNull(),
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
    unique().on(
      table.payrunId,
      table.employeeId,
    ),
    index("payslip_payrun_idx").on(table.payrunId),
    index("payslip_employee_idx").on(table.employeeId),
    index("payslip_employee_period_idx").on(
      table.employeeId,
      table.periodStart,
      table.periodEnd,
    ),
  ],
);

export type Payslip = typeof payslips.$inferSelect;
export type NewPayslip = typeof payslips.$inferInsert;
