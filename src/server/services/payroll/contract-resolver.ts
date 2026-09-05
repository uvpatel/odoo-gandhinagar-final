import { db, type Database } from "@/db";
import { contracts, type Contract } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

import {
  type OverlapCheckResult,
  checkContractOverlapInMemory,
  type PayrollPeriodInput,
  type ContractResolutionResult,
  resolveContractInMemory,
} from "@/features/contracts/utils/contract-validation";
export * from "@/features/contracts/utils/contract-validation";

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
