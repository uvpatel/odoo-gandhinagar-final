import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  date,
  numeric,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { employees } from "../employees/employees";
import { departments } from "../organization/departments";
import { jobPositions } from "../organization/job-positions";
import { workingSchedules } from "../organization/working-schedules";
import { salaryStructures } from "../payroll/salary-structures";

export const contractStatusEnum = pgEnum("contract_status", [
  "draft",
  "active",
  "expired",
  "terminated",
  "cancelled",
]);

export const contracts = pgTable(
  "contracts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id),
    contractNumber: varchar("contract_number", {
      length: 50,
    })
      .notNull()
      .unique(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    departmentId: uuid("department_id")
      .references(() => departments.id),
    jobPositionId: uuid("job_position_id")
      .references(() => jobPositions.id),
    workingScheduleId: uuid("working_schedule_id")
      .references(() => workingSchedules.id),
    salaryStructureId: uuid("salary_structure_id")
      .references(() => salaryStructures.id),
    wage: numeric("wage", {
      precision: 14,
      scale: 2,
    }).notNull(),
    currency: varchar("currency", {
      length: 3,
    })
      .default("INR")
      .notNull(),
    status: contractStatusEnum("status")
      .default("draft")
      .notNull(),
    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("contract_employee_idx").on(table.employeeId),
    index("contract_start_date_idx").on(table.startDate),
    index("contract_end_date_idx").on(table.endDate),
    index("contract_status_idx").on(table.status),
    index("contract_employee_dates_idx").on(table.employeeId, table.startDate, table.endDate),
    index("contract_employee_status_idx").on(table.employeeId, table.status),
  ],
);

export type Contract = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;
