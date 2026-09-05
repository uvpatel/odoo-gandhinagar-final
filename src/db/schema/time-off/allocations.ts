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
import { users } from "../auth/users";

export const allocationStatusEnum = pgEnum(
  "allocation_status",
  [
    "draft",
    "pending",
    "approved",
    "refused",
    "expired",
  ],
);

export const timeOffAllocations = pgTable(
  "time_off_allocations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id),
    timeOffTypeId: uuid("time_off_type_id")
      .notNull()
      .references(() => timeOffTypes.id),
    allocatedAmount: numeric("allocated_amount", {
      precision: 10,
      scale: 2,
    }).notNull(),
    validFrom: date("valid_from").notNull(),
    validTo: date("valid_to"),
    status: allocationStatusEnum("status")
      .default("draft")
      .notNull(),
    approvedBy: text("approved_by")
      .references(() => users.id),
    approvedAt: timestamp("approved_at"),
    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("allocation_employee_type_idx").on(
      table.employeeId,
      table.timeOffTypeId,
    ),
  ],
);

export const allocation = timeOffAllocations;
export type TimeOffAllocation = typeof timeOffAllocations.$inferSelect;
export type NewTimeOffAllocation = typeof timeOffAllocations.$inferInsert;
