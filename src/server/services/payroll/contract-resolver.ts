import { db } from "@/db";
import { type Contract } from "@/db/schema";

export type ContractResolutionResult =
  | {
      status: "VALID";
      contract: Contract;
    }
  | {
      status: "ERROR";
      message: string;
      contract: null;
    }
  | {
      status: "CONFLICT";
      message: string;
      contracts: Contract[];
      contract: null;
    };

export async function resolveContractForPeriod(
  employeeId: string,
  periodStart: string,
  periodEnd: string
): Promise<ContractResolutionResult> {
  const matchingContracts = await db.query.contracts.findMany({
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

  if (matchingContracts.length === 0) {
    return {
      status: "ERROR",
      message: `No active contract found for employee ${employeeId} overlapping ${periodStart} to ${periodEnd}`,
      contract: null,
    };
  }

  if (matchingContracts.length > 1) {
    return {
      status: "CONFLICT",
      message: `Multiple overlapping active contracts (${matchingContracts.length}) found for employee ${employeeId}`,
      contracts: matchingContracts,
      contract: null,
    };
  }

  return {
    status: "VALID",
    contract: matchingContracts[0],
  };
}
