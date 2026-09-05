import { db } from "@/db";

export async function calculateWorkedHours(
  checkIn: Date,
  checkOut: Date,
  breakMinutes = 0
): Promise<{ workedMinutes: number; workedHours: number }> {
  const diffMs = checkOut.getTime() - checkIn.getTime();
  const rawMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
  const workedMinutes = Math.max(0, rawMinutes - breakMinutes);
  const workedHours = Math.round((workedMinutes / 60) * 100) / 100;
  return { workedMinutes, workedHours };
}

export async function getEmployeeAttendanceStats(
  employeeId: string,
  startDate: string,
  endDate: string
) {
  const records = await db.query.attendance.findMany({
    where: {
      employeeId,
      attendanceDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const totalWorkedMinutes = records.reduce(
    (acc: number, r) => acc + (r.workedMinutes || 0),
    0
  );
  const totalOvertimeMinutes = records.reduce(
    (acc: number, r) => acc + (r.overtimeMinutes || 0),
    0
  );

  return {
    totalDaysPresent: records.filter((r) => r.status === "present").length,
    totalWorkedHours: Math.round((totalWorkedMinutes / 60) * 100) / 100,
    totalOvertimeHours: Math.round((totalOvertimeMinutes / 60) * 100) / 100,
    missingCheckouts: records.filter((r) => r.checkIn && !r.checkOut).length,
  };
}
