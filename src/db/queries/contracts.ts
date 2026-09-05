import { db, type Database } from "../index";
import { contracts, type NewContract, type Contract } from "../schema";
import { eq } from "drizzle-orm";
import {
  getApplicableContract,
  resolveContractForPeriod,
  checkContractOverlap,
  type ContractResolutionResult,
  type OverlapCheckResult,
} from "@/server/services/payroll/contract-resolver";

export {
  getApplicableContract,
  resolveContractForPeriod,
  checkContractOverlap,
  type ContractResolutionResult,
  type OverlapCheckResult,
};

export async function getContracts(database: Database = db) {
  return await database.query.contracts.findMany({
    with: {
      employee: true,
      department: true,
      jobPosition: true,
      workingSchedule: true,
      salaryStructure: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getContractById(id: string, database: Database = db) {
  return await database.query.contracts.findFirst({
    where: { id },
    with: {
      employee: true,
      department: true,
      jobPosition: true,
      workingSchedule: true,
      salaryStructure: true,
    },
  });
}

export async function getContractsByEmployeeId(employeeId: string, database: Database = db) {
  return await database.query.contracts.findMany({
    where: { employeeId },
    with: {
      salaryStructure: true,
      workingSchedule: true,
      department: true,
      jobPosition: true,
    },
    orderBy: { startDate: "desc" },
  });
}

export async function getApplicableContractsForPeriod(
  employeeId: string,
  periodStart: string,
  periodEnd: string,
  database: Database = db
) {
  return getApplicableContract(employeeId, { periodStart, periodEnd }, database);
}

export async function createContract(data: NewContract, database: Database = db) {
  // Validate end date not before start date
  if (data.endDate && data.endDate < data.startDate) {
    throw new Error("Contract end date cannot precede start date");
  }

  // Validate non-negative wage
  if (Number(data.wage) <= 0) {
    throw new Error("Contract wage must be greater than zero");
  }

  // Validate overlap prevention
  if (data.status !== "cancelled") {
    const overlap = await checkContractOverlap({
      employeeId: data.employeeId,
      startDate: data.startDate,
      endDate: data.endDate,
      database,
    });

    if (overlap.hasOverlap) {
      throw new Error(overlap.message || "Contract dates overlap with an existing contract for this employee");
    }
  }

  const [created] = await database.insert(contracts).values(data).returning();
  return created;
}

export async function updateContract(
  id: string,
  data: Partial<NewContract>,
  database: Database = db
) {
  const existing = await database.query.contracts.findFirst({
    where: { id },
  });

  if (!existing) {
    throw new Error(`Contract with ID ${id} not found`);
  }

  const effectiveStartDate = data.startDate ?? existing.startDate;
  const effectiveEndDate = data.endDate !== undefined ? data.endDate : existing.endDate;
  const effectiveEmployeeId = data.employeeId ?? existing.employeeId;
  const effectiveStatus = data.status ?? existing.status;

  if (effectiveEndDate && effectiveEndDate < effectiveStartDate) {
    throw new Error("Contract end date cannot precede start date");
  }

  if (data.wage !== undefined && Number(data.wage) <= 0) {
    throw new Error("Contract wage must be greater than zero");
  }

  if (effectiveStatus !== "cancelled") {
    const overlap = await checkContractOverlap({
      employeeId: effectiveEmployeeId,
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
      excludeContractId: id,
      database,
    });

    if (overlap.hasOverlap) {
      throw new Error(overlap.message || "Updated contract dates overlap with an existing contract for this employee");
    }
  }

  const [updated] = await database
    .update(contracts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(contracts.id, id))
    .returning();

  return updated;
}
