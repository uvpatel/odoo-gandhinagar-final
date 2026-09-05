import { db } from "../index";
import { contracts, type NewContract } from "../schema";
import { eq } from "drizzle-orm";

export async function getContracts() {
  return await db.query.contracts.findMany({
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

export async function getContractById(id: string) {
  return await db.query.contracts.findFirst({
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

export async function getContractsByEmployeeId(employeeId: string) {
  return await db.query.contracts.findMany({
    where: { employeeId },
    with: {
      salaryStructure: true,
      workingSchedule: true,
    },
    orderBy: { startDate: "desc" },
  });
}

export async function getApplicableContractsForPeriod(
  employeeId: string,
  periodStart: string,
  periodEnd: string
) {
  return await db.query.contracts.findMany({
    where: {
      employeeId,
      status: "active",
      startDate: { lte: periodEnd },
      OR: [
        { endDate: { isNull: true } },
        { endDate: { gte: periodStart } },
      ],
    },
    with: {
      salaryStructure: true,
      workingSchedule: true,
    },
  });
}

export async function createContract(data: NewContract) {
  const [created] = await db.insert(contracts).values(data).returning();
  return created;
}

export async function updateContract(id: string, data: Partial<NewContract>) {
  const [updated] = await db
    .update(contracts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(contracts.id, id))
    .returning();
  return updated;
}
