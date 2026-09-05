import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../auth/users";
import { departments } from "../organization/departments";
import { jobPositions } from "../organization/job-positions";
import { workingSchedules } from "../organization/working-schedules";

export const employeeStatusEnum = pgEnum("employee_status", [
  "draft",
  "active",
  "inactive",
  "terminated",
]);

export const employeeTypeEnum = pgEnum("employee_type", [
  "full_time",
  "part_time",
  "contract",
  "intern",
]);

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    employeeNumber: varchar("employee_number", {
      length: 30,
    })
      .notNull()
      .unique(),
    userId: text("user_id")
      .unique()
      .references(() => users.id, {
        onDelete: "set null",
      }),
    firstName: varchar("first_name", {
      length: 100,
    }).notNull(),
    lastName: varchar("last_name", {
      length: 100,
    }).notNull(),
    workEmail: varchar("work_email", {
      length: 255,
    }).unique(),
    phone: varchar("phone", {
      length: 30,
    }),
    departmentId: uuid("department_id")
      .references(() => departments.id),
    jobPositionId: uuid("job_position_id")
      .references(() => jobPositions.id),
    managerId: uuid("manager_id"),
    workingScheduleId: uuid("working_schedule_id")
      .references(() => workingSchedules.id),
    employeeType: employeeTypeEnum("employee_type")
      .default("full_time")
      .notNull(),
    status: employeeStatusEnum("status")
      .default("draft")
      .notNull(),
    joiningDate: date("joining_date"),
    bankAccountNumber: varchar("bank_account_number", {
      length: 100,
    }),
    bankName: varchar("bank_name", {
      length: 120,
    }),
    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("employee_department_idx").on(table.departmentId),
    index("employee_manager_idx").on(table.managerId),
    index("employee_status_idx").on(table.status),
  ],
);

export const employee = employees;
export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
