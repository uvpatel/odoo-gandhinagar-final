import { db } from "@/db";
import { timeOffAllocations, timeOffRequests, timeOffTypes } from "@/db/schema";
import { and, eq, sql, asc, desc } from "drizzle-orm";
import { calendarDays, remainingAllocation } from "@/server/domain/hr";
import { AuthorizationError } from "@/lib/auth/authorization";

export interface AllocationBalanceDetail {
  id: string;
  timeOffTypeId: string;
  allocatedAmount: number;
  takenAmount: number;
  remainingAmount: number;
  validFrom: string;
  validTo: string | null;
  status: "draft" | "pending" | "approved" | "refused" | "expired";
  isValidForDate: boolean;
}

export interface LeaveTypeBalance {
  timeOffTypeId: string;
  name: string;
  code: string;
  unit: "days" | "hours";
  requiresAllocation: boolean;
  approvalMode: "none" | "manager" | "hr" | "manager_and_hr";
  isPaid: boolean;
  isActive: boolean;
  allocated: number;
  taken: number;
  remaining: number;
  allocations: AllocationBalanceDetail[];
}

export interface EmployeeBalanceSummary {
  employeeId: string;
  asOfDate: string;
  totalAllocated: number;
  totalTaken: number;
  totalRemaining: number;
  leaveTypes: LeaveTypeBalance[];
  byTypeId: Record<string, LeaveTypeBalance>;
}

/**
 * Reusable service to compute an employee's time-off balances across all or specific leave types.
 * Accounts for allocation validity windows (validFrom <= date <= validTo), approved status,
 * and ledger consumption by approved leave requests.
 */
export async function getEmployeeTimeOffBalance(
  employeeId: string,
  timeOffTypeId?: string,
  asOfDate: string = new Date().toISOString().slice(0, 10)
): Promise<EmployeeBalanceSummary> {
  // 1. Fetch leave types
  const leaveTypesQuery = timeOffTypeId
    ? await db.select().from(timeOffTypes).where(eq(timeOffTypes.id, timeOffTypeId))
    : await db.select().from(timeOffTypes).where(eq(timeOffTypes.isActive, true));

  // 2. Fetch all allocations for employee
  const allocConditions = [eq(timeOffAllocations.employeeId, employeeId)];
  if (timeOffTypeId) {
    allocConditions.push(eq(timeOffAllocations.timeOffTypeId, timeOffTypeId));
  }
  const employeeAllocations = await db
    .select()
    .from(timeOffAllocations)
    .where(and(...allocConditions))
    .orderBy(asc(timeOffAllocations.validFrom), asc(timeOffAllocations.validTo));

  // 3. Fetch approved requests for employee to compute consumption
  const reqConditions = [
    eq(timeOffRequests.employeeId, employeeId),
    eq(timeOffRequests.status, "approved"),
  ];
  if (timeOffTypeId) {
    reqConditions.push(eq(timeOffRequests.timeOffTypeId, timeOffTypeId));
  }
  const approvedRequests = await db
    .select()
    .from(timeOffRequests)
    .where(and(...reqConditions));

  // Map requests by allocationId
  const requestDurationByAlloc = new Map<string, number>();
  const unallocatedDurationByType = new Map<string, number>();

  for (const req of approvedRequests) {
    const dur = Number(req.duration) || 0;
    if (req.allocationId) {
      requestDurationByAlloc.set(
        req.allocationId,
        (requestDurationByAlloc.get(req.allocationId) || 0) + dur
      );
    } else {
      unallocatedDurationByType.set(
        req.timeOffTypeId,
        (unallocatedDurationByType.get(req.timeOffTypeId) || 0) + dur
      );
    }
  }

  const byTypeId: Record<string, LeaveTypeBalance> = {};
  const leaveTypesSummary: LeaveTypeBalance[] = [];

  let grandTotalAllocated = 0;
  let grandTotalTaken = 0;
  let grandTotalRemaining = 0;

  for (const type of leaveTypesQuery) {
    const typeAllocs = employeeAllocations.filter((a) => a.timeOffTypeId === type.id);
    const allocDetails: AllocationBalanceDetail[] = [];

    let typeAllocated = 0;
    let typeTaken = 0;
    let typeRemaining = 0;

    let unallocatedSpent = unallocatedDurationByType.get(type.id) || 0;

    for (const a of typeAllocs) {
      const allocatedAmt = Number(a.allocatedAmount) || 0;
      let takenAmt = requestDurationByAlloc.get(a.id) || 0;

      // If there was legacy unallocated spent, attribute it towards available allocations
      if (unallocatedSpent > 0 && a.status === "approved") {
        const canAbsorb = Math.max(0, allocatedAmt - takenAmt);
        const absorb = Math.min(unallocatedSpent, canAbsorb);
        takenAmt += absorb;
        unallocatedSpent -= absorb;
      }

      const remainingAmt = Math.max(0, allocatedAmt - takenAmt);
      const isDateValid =
        a.validFrom <= asOfDate && (!a.validTo || a.validTo >= asOfDate);
      const isValidForDate = a.status === "approved" && isDateValid;

      allocDetails.push({
        id: a.id,
        timeOffTypeId: a.timeOffTypeId,
        allocatedAmount: allocatedAmt,
        takenAmount: takenAmt,
        remainingAmount: remainingAmt,
        validFrom: a.validFrom,
        validTo: a.validTo,
        status: a.status as AllocationBalanceDetail["status"],
        isValidForDate,
      });

      if (isValidForDate) {
        typeAllocated += allocatedAmt;
        typeTaken += takenAmt;
        typeRemaining += remainingAmt;
      }
    }

    if (!type.requiresAllocation) {
      // Type does not require allocation (e.g. unpaid leave, bereavement, etc.)
      const totalTakenForType = approvedRequests
        .filter((r) => r.timeOffTypeId === type.id)
        .reduce((sum, r) => sum + (Number(r.duration) || 0), 0);

      const balanceObj: LeaveTypeBalance = {
        timeOffTypeId: type.id,
        name: type.name,
        code: type.code,
        unit: type.unit,
        requiresAllocation: false,
        approvalMode: type.approvalMode,
        isPaid: type.isPaid,
        isActive: type.isActive,
        allocated: 0,
        taken: totalTakenForType,
        remaining: 999, // Unconstrained
        allocations: allocDetails,
      };

      byTypeId[type.id] = balanceObj;
      leaveTypesSummary.push(balanceObj);
    } else {
      const balanceObj: LeaveTypeBalance = {
        timeOffTypeId: type.id,
        name: type.name,
        code: type.code,
        unit: type.unit,
        requiresAllocation: true,
        approvalMode: type.approvalMode,
        isPaid: type.isPaid,
        isActive: type.isActive,
        allocated: typeAllocated,
        taken: typeTaken,
        remaining: typeRemaining,
        allocations: allocDetails,
      };

      byTypeId[type.id] = balanceObj;
      leaveTypesSummary.push(balanceObj);

      grandTotalAllocated += typeAllocated;
      grandTotalTaken += typeTaken;
      grandTotalRemaining += typeRemaining;
    }
  }

  return {
    employeeId,
    asOfDate,
    totalAllocated: grandTotalAllocated,
    totalTaken: grandTotalTaken,
    totalRemaining: grandTotalRemaining,
    leaveTypes: leaveTypesSummary,
    byTypeId,
  };
}

/**
 * Backwards-compatible leave balance function.
 */
export async function getLeaveBalance(
  employeeId: string,
  timeOffTypeId: string,
  asOfDate?: string
) {
  const summary = await getEmployeeTimeOffBalance(employeeId, timeOffTypeId, asOfDate);
  const typeBal = summary.byTypeId[timeOffTypeId];
  if (!typeBal) {
    return {
      totalAllocated: 0,
      totalConsumed: 0,
      remainingBalance: 0,
    };
  }

  return {
    totalAllocated: typeBal.allocated,
    totalConsumed: typeBal.taken,
    remainingBalance: typeBal.remaining,
  };
}

/**
 * Pre-submission validation for Time Off Requests.
 * Enforces:
 * 1. endDate >= startDate
 * 2. duration > 0
 * 3. leave type exists and isActive
 * 4. if requiresAllocation: requested duration <= remaining balance
 * 5. if allocationId specified: allocation must be valid, active, cover date range, and have remaining balance >= duration.
 */
export async function validateLeaveRequest(params: {
  employeeId: string;
  timeOffTypeId: string;
  startDate: string;
  endDate: string;
  allocationId?: string | null;
}) {
  const { employeeId, timeOffTypeId, startDate, endDate, allocationId } = params;

  // 1. Duration calculation & date order
  const duration = calendarDays(startDate, endDate);
  if (duration <= 0) {
    throw new AuthorizationError("Leave duration must be greater than zero", 400);
  }

  // 2. Fetch leave type
  const [type] = await db
    .select()
    .from(timeOffTypes)
    .where(eq(timeOffTypes.id, timeOffTypeId));

  if (!type) {
    throw new AuthorizationError("Selected time-off type does not exist", 404);
  }
  if (!type.isActive) {
    throw new AuthorizationError("Selected time-off type is currently inactive", 400);
  }

  // 3. Check allocation requirement
  if (!type.requiresAllocation) {
    return {
      valid: true,
      duration,
      leaveType: type,
      suggestedAllocationId: null,
    };
  }

  // If allocation is required, check balances
  const balanceSummary = await getEmployeeTimeOffBalance(employeeId, timeOffTypeId, startDate);
  const typeBalance = balanceSummary.byTypeId[timeOffTypeId];

  if (!typeBalance || typeBalance.remaining < duration) {
    const remaining = typeBalance ? typeBalance.remaining : 0;
    throw new AuthorizationError(
      `Insufficient leave balance. You have ${remaining} ${type.unit} available for ${type.name}, but requested ${duration} ${type.unit}.`,
      400
    );
  }

  // If specific allocation provided, validate it
  if (allocationId) {
    const matchedAlloc = typeBalance.allocations.find((a) => a.id === allocationId);
    if (!matchedAlloc) {
      throw new AuthorizationError("Selected allocation does not belong to this employee or leave type", 400);
    }
    if (matchedAlloc.status !== "approved") {
      throw new AuthorizationError("Selected allocation is not in approved status", 400);
    }
    if (matchedAlloc.validFrom > startDate || (matchedAlloc.validTo && matchedAlloc.validTo < endDate)) {
      throw new AuthorizationError(
        `Leave dates (${startDate} to ${endDate}) fall outside allocation validity period (${matchedAlloc.validFrom} to ${matchedAlloc.validTo || "indefinite"})`,
        400
      );
    }
    if (matchedAlloc.remainingAmount < duration) {
      throw new AuthorizationError(
        `Selected allocation has only ${matchedAlloc.remainingAmount} ${type.unit} remaining, which cannot cover requested ${duration} ${type.unit}.`,
        400
      );
    }

    return {
      valid: true,
      duration,
      leaveType: type,
      suggestedAllocationId: allocationId,
    };
  }

  // Auto-suggest the first valid allocation that can cover the duration
  const candidate = typeBalance.allocations.find(
    (a) =>
      a.isValidForDate &&
      a.validFrom <= startDate &&
      (!a.validTo || a.validTo >= endDate) &&
      a.remainingAmount >= duration
  );

  return {
    valid: true,
    duration,
    leaveType: type,
    suggestedAllocationId: candidate ? candidate.id : null,
  };
}
