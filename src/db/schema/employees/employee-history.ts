import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
} from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { departments } from "../organization/departments";
import { jobPositions } from "../organization/job-positions";

export const employeeHistory = pgTable("employee_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, {
      onDelete: "cascade",
    }),
  eventType: varchar("event_type", {
    length: 50,
  }).notNull(),
  effectiveDate: date("effective_date").notNull(),
  previousDepartmentId: uuid("previous_department_id")
    .references(() => departments.id),
  newDepartmentId: uuid("new_department_id")
    .references(() => departments.id),
  previousJobPositionId: uuid("previous_job_position_id")
    .references(() => jobPositions.id),
  newJobPositionId: uuid("new_job_position_id")
    .references(() => jobPositions.id),
  notes: text("notes"),
  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

export type EmployeeHistory = typeof employeeHistory.$inferSelect;
export type NewEmployeeHistory = typeof employeeHistory.$inferInsert;
