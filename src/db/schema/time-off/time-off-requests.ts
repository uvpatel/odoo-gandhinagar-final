import {
  pgTable,
  uuid,
  numeric,
  timestamp,
  date,
  text,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { employees } from "../employees/employees";
import { timeOffTypes } from "./time-off-types";
import { timeOffAllocations } from "./allocations";
import { users } from "../auth/users";

export const timeOffRequestStatusEnum = pgEnum(
  "time_off_request_status",
  [
    "draft",
    "pending",
    "approved",
    "refused",
    "cancelled",
  ],
);

export const timeOffRequests = pgTable(
  "time_off_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id),
    timeOffTypeId: uuid("time_off_type_id")
      .notNull()
      .references(() => timeOffTypes.id),
    allocationId: uuid("allocation_id")
      .references(() => timeOffAllocations.id),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    duration: numeric("duration", {
      precision: 10,
      scale: 2,
    }).notNull(),
    reason: text("reason"),
    status: timeOffRequestStatusEnum("status")
      .default("draft")
      .notNull(),
    approvedBy: text("approved_by")
      .references(() => users.id),
    approvedAt: timestamp("approved_at"),
    refusalReason: text("refusal_reason"),
    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("time_off_employee_idx").on(table.employeeId),
    index("time_off_status_idx").on(table.status),
    index("time_off_dates_idx").on(table.startDate, table.endDate),
  ],
);

export type TimeOffRequest = typeof timeOffRequests.$inferSelect;
export type NewTimeOffRequest = typeof timeOffRequests.$inferInsert;
