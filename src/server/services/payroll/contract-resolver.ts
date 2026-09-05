import { db, type Database } from "@/db";
import { contracts, type Contract } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export interface ContractResolutionResultValid {
  status: "VALID";
  contract: Contract;
  message?: string;
}

export interface ContractResolutionResultError {
  status: "ERROR";
  message: string;
  contract: null;
}

export interface ContractResolutionResultConflict {
  status: "CONFLICT";
  message: string;
  contracts: Contract[];
  contract: null;
}

export type ContractResolutionResult =
  | ContractResolutionResultValid
  | ContractResolutionResultError
  | ContractResolutionResultConflict;

export type PayrollPeriodInput =
  | string // Single date e.g. "2026-03-15"
  | { periodStart: string; periodEnd: string };

export interface ContractLike {
  id: string;
  employeeId: string;
  contractNumber?: string;
  startDate: string;
  endDate?: string | null;
  wage?: string | number;
  status: "draft" | "active" | "expired" | "terminated" | "cancelled";
  salaryStructureId?: string | null;
}

export interface OverlapCheckResult {
  hasOverlap: boolean;
  overlappingContract?: ContractLike;
  message?: string;
}

/**
 * Pure in-memory check to see if a proposed contract dates overlap with an existing contract for the same employee.
 * Standard inclusive interval overlap logic:
 * Interval A [sA, eA] and Interval B [sB, eB] overlap iff (sA <= eB) and (sB <= eA).
 * Open-ended contracts use '9999-12-31' as upper bound.
 */
export function checkContractOverlapInMemory(
  existingContracts: ContractLike[],
  candidate: {
    id?: string;
    employeeId: string;
    startDate: string;
    endDate?: string | null;
    status?: string;
  }
): OverlapCheckResult {
  const candStart = candidate.startDate;
  const candEnd = candidate.endDate || "9999-12-31";

  // Filter out the contract itself (if editing) and cancelled contracts
  const activeCandidates = existingContracts.filter(
    (c) =>
      c.employeeId === candidate.employeeId &&
      c.id !== candidate.id &&
      c.status !== "cancelled"
  );

  for (const existing of activeCandidates) {
    const exStart = existing.startDate;
    const exEnd = existing.endDate || "9999-12-31";

    const isOverlapping = candStart <= exEnd && candEnd >= exStart;

    if (isOverlapping) {
      const exRangeStr = existing.endDate
        ? `${existing.startDate} to ${existing.endDate}`
        : `started ${existing.startDate} (open-ended)`;
      const candRangeStr = candidate.endDate
        ? `${candidate.startDate} to ${candidate.endDate}`
        : `started ${candidate.startDate} (open-ended)`;

      const ref = existing.contractNumber || existing.id;
      return {
        hasOverlap: true,
        overlappingContract: existing,
        message: `Contract date range (${candRangeStr}) overlaps with existing contract ${ref} (${exRangeStr}). An employee cannot have concurrent contracts during the same period.`,
      };
    }
  }

  return { hasOverlap: false };
}

/**
 * Pure in-memory contract resolution matching payroll applicability rules:
 * 1. Must belong to the employee.
 * 2. Must not be in 'cancelled' or 'draft' status.
 * 3. Date bounds: startDate <= periodStart AND (endDate IS NULL OR endDate >= periodEnd).
 * 4. Exactly one contract must cover the entire period.
 */
export function resolveContractInMemory(
  allContracts: ContractLike[],
  employeeId: string,
  period: PayrollPeriodInput
): ContractResolutionResult {
  const periodStart = typeof period === "string" ? period : period.periodStart;
  const periodEnd = typeof period === "string" ? period : period.periodEnd;

  if (!periodStart || !periodEnd) {
    return {
      status: "ERROR",
      message: "Invalid payroll period: periodStart and periodEnd are required",
      contract: null,
    };
  }

  if (periodStart > periodEnd) {
    return {
      status: "ERROR",
      message: `Invalid payroll period: periodStart (${periodStart}) cannot be after periodEnd (${periodEnd})`,
      contract: null,
    };
  }

  // 1. All contracts for this employee
  const empContracts = allContracts.filter((c) => c.employeeId === employeeId);

  if (empContracts.length === 0) {
    return {
      status: "ERROR",
      message: `No employment contracts found for employee ${employeeId}. An active contract is required for payroll processing.`,
      contract: null,
    };
  }

  // 2. Filter out void/unapproved contracts (cancelled and draft)
  const validContracts = empContracts.filter(
    (c) => c.status !== "cancelled" && c.status !== "draft"
  );

  if (validContracts.length === 0) {
    const list = empContracts.map((c) => `${c.contractNumber || c.id} (${c.status})`).join(", ");
    return {
      status: "ERROR",
      message: `Employee has contracts on record, but none are in an executed status: ${list}. Draft or cancelled contracts cannot be processed.`,
      contract: null,
    };
  }

  // 3. Contracts that fully cover the requested period
  const matching = validContracts.filter((c) => {
    const startsBeforeOrOn = c.startDate <= periodStart;
    const endsAfterOrOn = !c.endDate || c.endDate >= periodEnd;
    return startsBeforeOrOn && endsAfterOrOn;
  });

  if (matching.length === 1) {
    return {
      status: "VALID",
      contract: matching[0] as unknown as Contract,
    };
  }

  if (matching.length > 1) {
    const listStr = matching
      .map((c) => `${c.contractNumber || c.id} (${c.startDate} to ${c.endDate || "indefinite"})`)
      .join(", ");
    return {
      status: "CONFLICT",
      message: `Data integrity violation: Multiple overlapping contracts (${listStr}) cover the payroll period ${periodStart} to ${periodEnd}. Only one contract can apply per period.`,
      contracts: matching as unknown as Contract[],
      contract: null,
    };
  }

  // 4. Detailed diagnostic reporting when 0 contracts cover the FULL period
  // A. Check for partial overlaps (e.g. Contract transition mid-month)
  const partials = validContracts.filter((c) => {
    const cEnd = c.endDate || "9999-12-31";
    return c.startDate <= periodEnd && cEnd >= periodStart;
  });

  if (partials.length > 0) {
    const partialsStr = partials
      .map((c) => `${c.contractNumber || c.id} (${c.startDate} to ${c.endDate || "indefinite"})`)
      .join(", ");
    return {
      status: "ERROR",
      message: `Payroll period ${periodStart} to ${periodEnd} crosses contract transition boundaries (${partialsStr}). No single contract covers the full payroll period.`,
      contract: null,
    };
  }

  // B. Check if contracts ended in the past (expired relative to period)
  const pastContracts = validContracts.filter(
    (c) => c.endDate && c.endDate < periodStart
  );
  // C. Check if contracts start in the future (upcoming relative to period)
  const futureContracts = validContracts.filter((c) => c.startDate > periodEnd);

  if (futureContracts.length > 0 && pastContracts.length === 0) {
    const earliest = futureContracts.sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
    return {
      status: "ERROR",
      message: `Contract ${earliest.contractNumber || earliest.id} starts on ${earliest.startDate}, which is after payroll period ${periodStart} to ${periodEnd}.`,
      contract: null,
    };
  }

  if (pastContracts.length > 0 && futureContracts.length === 0) {
    const latest = pastContracts.sort((a, b) => (b.endDate || "").localeCompare(a.endDate || ""))[0];
    return {
      status: "ERROR",
      message: `Most recent contract ${latest.contractNumber || latest.id} ended on ${latest.endDate}, prior to payroll period ${periodStart} to ${periodEnd}.`,
      contract: null,
    };
  }

  return {
    status: "ERROR",
    message: `No applicable employment contract found covering payroll period ${periodStart} to ${periodEnd}.`,
    contract: null,
  };
}

/**
 * Server/Database-backed contract overlap check.
 * Validates that creating or updating a contract does not introduce concurrent overlapping contracts
 * for the same employee.
 */
export async function checkContractOverlap(params: {
  employeeId: string;
  startDate: string;
  endDate?: string | null;
  excludeContractId?: string;
  database?: Database;
}): Promise<OverlapCheckResult> {
  const { employeeId, startDate, endDate, excludeContractId, database = db } = params;
  const targetEnd = endDate || "9999-12-31";

  const conditions = [
    eq(contracts.employeeId, employeeId),
    sql`${contracts.status} <> 'cancelled'`,
  ];

  if (excludeContractId) {
    conditions.push(sql`${contracts.id} <> ${excludeContractId}`);
  }

  const existingContracts = await database
    .select({
      id: contracts.id,
      employeeId: contracts.employeeId,
      contractNumber: contracts.contractNumber,
      startDate: contracts.startDate,
      endDate: contracts.endDate,
      status: contracts.status,
    })
    .from(contracts)
    .where(and(...conditions));

  return checkContractOverlapInMemory(existingContracts, {
    id: excludeContractId,
    employeeId,
    startDate,
    endDate,
  });
}

/**
 * Resolves the single applicable employment contract for an employee covering a given payroll period.
 * Primary contract-resolution function for payroll processing.
 */
export async function getApplicableContract(
  employeeId: string,
  period: PayrollPeriodInput,
  database: Database = db
): Promise<ContractResolutionResult> {
  const periodStart = typeof period === "string" ? period : period.periodStart;
  const periodEnd = typeof period === "string" ? period : period.periodEnd;

  if (!periodStart || !periodEnd) {
    return {
      status: "ERROR",
      message: "Invalid payroll period: periodStart and periodEnd are required",
      contract: null,
    };
  }

  if (periodStart > periodEnd) {
    return {
      status: "ERROR",
      message: `Invalid payroll period: periodStart (${periodStart}) cannot be after periodEnd (${periodEnd})`,
      contract: null,
    };
  }

  // Load all contracts for the employee
  const empContracts = await database
    .select()
    .from(contracts)
    .where(eq(contracts.employeeId, employeeId))
    .orderBy(contracts.startDate);

  return resolveContractInMemory(empContracts, employeeId, { periodStart, periodEnd });
}

/**
 * Alias for getApplicableContract with periodStart and periodEnd arguments.
 * Retained for backward compatibility and test coverage.
 */
export async function resolveContractForPeriod(
  employeeId: string,
  periodStart: string,
  periodEnd: string,
  database: Database = db
): Promise<ContractResolutionResult> {
  return getApplicableContract(employeeId, { periodStart, periodEnd }, database);
}
