import {
  pgTable,
  uuid,
  timestamp,
  date,
  integer,
  boolean,
  text,
  pgEnum,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { employees } from "../employees/employees";

export const attendanceStatusEnum = pgEnum(
  "attendance_status",
  [
    "present",
    "late",
    "absent",
    "overtime",
    "incomplete",
  ],
);

export const attendance = pgTable(
  "attendance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id),
    attendanceDate: date("attendance_date")
      .notNull(),
    checkIn: timestamp("check_in"),
    checkOut: timestamp("check_out"),
    workedMinutes: integer("worked_minutes")
      .default(0)
      .notNull(),
    overtimeMinutes: integer("overtime_minutes")
      .default(0)
      .notNull(),
    status: attendanceStatusEnum("status"),
    isManuallyEdited: boolean("is_manually_edited")
      .default(false)
      .notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique().on(
      table.employeeId,
      table.attendanceDate,
    ),
    index("attendance_employee_date_idx").on(
      table.employeeId,
      table.attendanceDate,
    ),
  ],
);

export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;
