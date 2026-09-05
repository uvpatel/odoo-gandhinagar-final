import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { attendance } from "./attendance";
import { users } from "../auth/users";

export const attendanceCorrections = pgTable(
  "attendance_corrections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    attendanceId: uuid("attendance_id")
      .notNull()
      .references(() => attendance.id),
    requestedBy: text("requested_by")
      .notNull()
      .references(() => users.id),
    approvedBy: text("approved_by")
      .references(() => users.id),
    oldCheckIn: timestamp("old_check_in"),
    oldCheckOut: timestamp("old_check_out"),
    newCheckIn: timestamp("new_check_in"),
    newCheckOut: timestamp("new_check_out"),
    reason: text("reason").notNull(),
    status: varchar("status", {
      length: 30,
    })
      .default("pending")
      .notNull(),
    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
);

export type AttendanceCorrection = typeof attendanceCorrections.$inferSelect;
export type NewAttendanceCorrection = typeof attendanceCorrections.$inferInsert;
