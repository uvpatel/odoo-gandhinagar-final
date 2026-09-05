import { db } from "@/db";

export async function getLeaveBalance(
  employeeId: string,
  timeOffTypeId: string
) {
  const allocations = await db.query.timeOffAllocations.findMany({
    where: {
      employeeId,
      timeOffTypeId,
      status: "approved",
    },
  });

  const requests = await db.query.timeOffRequests.findMany({
    where: {
      employeeId,
      timeOffTypeId,
      status: "approved",
    },
  });

  const totalAllocated = allocations.reduce(
    (sum: number, a) => sum + Number(a.allocatedAmount || 0),
    0
  );
  const totalConsumed = requests.reduce(
    (sum: number, r) => sum + Number(r.duration || 0),
    0
  );

  return {
    totalAllocated,
    totalConsumed,
    remainingBalance: Math.max(0, totalAllocated - totalConsumed),
  };
}
