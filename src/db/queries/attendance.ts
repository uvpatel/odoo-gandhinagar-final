import { type Database } from "@/db";
import { db } from "../index";
import {
  attendance,
  attendanceCorrections,
  type NewAttendance,
  type NewAttendanceCorrection,
} from "../schema";
import { eq } from "drizzle-orm";

export async function getAttendances() {
  return await db.query.attendance.findMany({
    with: {
      employee: true,
      corrections: true,
    },
    orderBy: { attendanceDate: "desc" },
  });
}

export async function getAttendanceByEmployeeAndPeriod(
  employeeId: string,
  startDate: string,
  endDate: string
, database: Database = db) {
  return await database.query.attendance.findMany({
    where: {
      employeeId,
      attendanceDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { attendanceDate: "asc" },
  });
}

export async function getAttendanceByEmployeeAndDate(
  employeeId: string,
  attendanceDate: string
) {
  return await db.query.attendance.findFirst({
    where: {
      employeeId,
      attendanceDate,
    },
    with: {
      corrections: true,
    },
  });
}

export async function recordCheckIn(
  employeeId: string,
  attendanceDate: string,
  checkIn: Date
) {
  const existing = await getAttendanceByEmployeeAndDate(
    employeeId,
    attendanceDate
  );
  if (existing) {
    const [updated] = await db
      .update(attendance)
      .set({
        checkIn,
        status: "present",
        updatedAt: new Date(),
      })
      .where(eq(attendance.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(attendance)
    .values({
      employeeId,
      attendanceDate,
      checkIn,
      status: "present",
      workedMinutes: 0,
      overtimeMinutes: 0,
    })
    .returning();
  return created;
}

export async function recordCheckOut(
  attendanceId: string,
  checkOut: Date,
  workedMinutes: number,
  overtimeMinutes = 0
) {
  const [updated] = await db
    .update(attendance)
    .set({
      checkOut,
      workedMinutes,
      overtimeMinutes,
      updatedAt: new Date(),
    })
    .where(eq(attendance.id, attendanceId))
    .returning();
  return updated;
}

export async function requestAttendanceCorrection(
  data: NewAttendanceCorrection
) {
  const [created] = await db
    .insert(attendanceCorrections)
    .values(data)
    .returning();
  return created;
}

export async function getPendingCorrections() {
  return await db.query.attendanceCorrections.findMany({
    where: {
      status: "pending",
    },
    with: {
      attendance: {
        with: {
          employee: true,
        },
      },
      requester: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
