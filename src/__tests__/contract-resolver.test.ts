import { describe, it, expect } from "bun:test";

interface MockContract {
  id: string;
  employeeId: string;
  status: "draft" | "active" | "expired" | "terminated" | "cancelled";
  startDate: string;
  endDate: string | null;
  wage: string;
}

/**
 * Pure evaluation of contract resolution logic matching database criteria:
 * 1. Must belong to the employee
 * 2. Must have status === 'active'
 * 3. startDate <= periodStart
 * 4. (endDate is null OR endDate >= periodEnd)
 */
function resolveMockContract(
  contracts: MockContract[],
  employeeId: string,
  periodStart: string,
  periodEnd: string
) {
  const matching = contracts.filter((c) => {
    if (c.employeeId !== employeeId) return false;
    if (c.status !== "active") return false;
    if (c.startDate > periodStart) return false;
    if (c.endDate !== null && c.endDate < periodEnd) return false;
    return true;
  });

  if (matching.length === 0) {
    return { status: "ERROR" as const, message: "No active contract found", contract: null };
  }
  if (matching.length > 1) {
    return { status: "CONFLICT" as const, message: "Multiple overlapping active contracts found", contracts: matching, contract: null };
  }
  return { status: "VALID" as const, contract: matching[0] };
}

describe("Payroll Contract Resolver", () => {
  const sampleContracts: MockContract[] = [
    {
      id: "contract-1",
      employeeId: "emp-101",
      status: "active",
      startDate: "2026-01-01",
      endDate: null, // open-ended active contract
      wage: "65000",
    },
    {
      id: "contract-2",
      employeeId: "emp-102",
      status: "active",
      startDate: "2026-01-01",
      endDate: "2026-03-31", // Q1 fixed contract
      wage: "50000",
    },
    {
      id: "contract-3",
      employeeId: "emp-103",
      status: "expired",
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      wage: "45000",
    },
    {
      id: "contract-4a",
      employeeId: "emp-104",
      status: "active",
      startDate: "2026-01-01",
      endDate: null,
      wage: "70000",
    },
    {
      id: "contract-4b",
      employeeId: "emp-104",
      status: "active",
      startDate: "2026-02-01",
      endDate: null,
      wage: "80000",
    },
  ];

  it("resolves open-ended active contract covering the period", () => {
    const res = resolveMockContract(sampleContracts, "emp-101", "2026-03-01", "2026-03-31");
    expect(res.status).toBe("VALID");
    expect(res.contract?.id).toBe("contract-1");
    expect(res.contract?.wage).toBe("65000");
  });

  it("resolves fixed-term contract when period is within bounds", () => {
    const res = resolveMockContract(sampleContracts, "emp-102", "2026-03-01", "2026-03-31");
    expect(res.status).toBe("VALID");
    expect(res.contract?.id).toBe("contract-2");
  });

  it("fails when fixed-term contract ends before payrun period", () => {
    // Contract ends 2026-03-31, querying for April
    const res = resolveMockContract(sampleContracts, "emp-102", "2026-04-01", "2026-04-30");
    expect(res.status).toBe("ERROR");
    expect(res.contract).toBeNull();
  });

  it("rejects non-active (expired/draft/terminated) contracts", () => {
    const res = resolveMockContract(sampleContracts, "emp-103", "2026-01-01", "2026-01-31");
    expect(res.status).toBe("ERROR");
  });

  it("detects conflict when multiple active contracts overlap", () => {
    const res = resolveMockContract(sampleContracts, "emp-104", "2026-03-01", "2026-03-31");
    expect(res.status).toBe("CONFLICT");
    expect(res.contracts?.length).toBe(2);
  });
});
