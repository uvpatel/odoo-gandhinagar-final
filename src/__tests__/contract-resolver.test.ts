import { describe, it, expect } from "bun:test";
import {
  resolveContractInMemory,
  checkContractOverlapInMemory,
  type ContractLike,
} from "@/server/services/payroll/contract-resolver";

describe("Contract Period Resolution & Overlap Validation", () => {
  const sampleContracts: ContractLike[] = [
    // emp-101: Single open-ended active contract
    {
      id: "c-101",
      employeeId: "emp-101",
      contractNumber: "CON-101",
      status: "active",
      startDate: "2026-01-01",
      endDate: null,
      wage: "65000",
    },
    // emp-102: Fixed-term Q1 2026 contract
    {
      id: "c-102",
      employeeId: "emp-102",
      contractNumber: "CON-102",
      status: "active",
      startDate: "2026-01-01",
      endDate: "2026-03-31",
      wage: "50000",
    },
    // emp-103: Expired contract from 2025
    {
      id: "c-103",
      employeeId: "emp-103",
      contractNumber: "CON-103",
      status: "expired",
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      wage: "45000",
    },
    // emp-104: Conflicting overlapping active contracts
    {
      id: "c-104a",
      employeeId: "emp-104",
      contractNumber: "CON-104A",
      status: "active",
      startDate: "2026-01-01",
      endDate: "2026-06-30",
      wage: "70000",
    },
    {
      id: "c-104b",
      employeeId: "emp-104",
      contractNumber: "CON-104B",
      status: "active",
      startDate: "2026-05-01",
      endDate: "2026-12-31",
      wage: "80000",
    },
    // emp-105: Sequential contracts (H1 and H2)
    {
      id: "c-105a",
      employeeId: "emp-105",
      contractNumber: "CON-105A",
      status: "expired",
      startDate: "2026-01-01",
      endDate: "2026-06-30",
      wage: "60000",
    },
    {
      id: "c-105b",
      employeeId: "emp-105",
      contractNumber: "CON-105B",
      status: "active",
      startDate: "2026-07-01",
      endDate: "2026-12-31",
      wage: "75000",
    },
    // emp-106: Future / upcoming contract starting 2026-07-01
    {
      id: "c-106",
      employeeId: "emp-106",
      contractNumber: "CON-106",
      status: "active",
      startDate: "2026-07-01",
      endDate: null,
      wage: "90000",
    },
    // emp-107: Contract transition mid-month (Contract A ends Mar 15, Contract B starts Mar 16)
    {
      id: "c-107a",
      employeeId: "emp-107",
      contractNumber: "CON-107A",
      status: "active",
      startDate: "2026-01-01",
      endDate: "2026-03-15",
      wage: "50000",
    },
    {
      id: "c-107b",
      employeeId: "emp-107",
      contractNumber: "CON-107B",
      status: "active",
      startDate: "2026-03-16",
      endDate: "2026-12-31",
      wage: "60000",
    },
    // emp-108: Void / cancelled contract
    {
      id: "c-108",
      employeeId: "emp-108",
      contractNumber: "CON-108",
      status: "cancelled",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      wage: "50000",
    },
  ];

  describe("Requirement 4 & 8: Applicable Contract Resolution", () => {
    it("Case 1: Employee with no contracts fails resolution with descriptive error", () => {
      const res = resolveContractInMemory(sampleContracts, "emp-nonexistent", {
        periodStart: "2026-03-01",
        periodEnd: "2026-03-31",
      });
      expect(res.status).toBe("ERROR");
      expect(res.contract).toBeNull();
      expect(res.message).toContain("No employment contracts found");
    });

    it("Case 2: Employee with one active open-ended contract resolves successfully", () => {
      const res = resolveContractInMemory(sampleContracts, "emp-101", {
        periodStart: "2026-03-01",
        periodEnd: "2026-03-31",
      });
      expect(res.status).toBe("VALID");
      expect(res.contract?.id).toBe("c-101");
    });

    it("Case 3: Employee with fixed-term contract resolves when period is within bounds", () => {
      const res = resolveContractInMemory(sampleContracts, "emp-102", {
        periodStart: "2026-03-01",
        periodEnd: "2026-03-31",
      });
      expect(res.status).toBe("VALID");
      expect(res.contract?.id).toBe("c-102");
    });

    it("Case 4: Employee with expired contract fails for current/future payruns", () => {
      const res = resolveContractInMemory(sampleContracts, "emp-103", {
        periodStart: "2026-03-01",
        periodEnd: "2026-03-31",
      });
      expect(res.status).toBe("ERROR");
      expect(res.contract).toBeNull();
      expect(res.message).toContain("ended on 2025-12-31");
    });

    it("Case 5: Employee with expired contract resolves successfully for historical period when it was active", () => {
      // Contract c-103 was 2025-01-01 to 2025-12-31. For Oct 2025, it was active!
      const res = resolveContractInMemory(sampleContracts, "emp-103", {
        periodStart: "2025-10-01",
        periodEnd: "2025-10-31",
      });
      expect(res.status).toBe("VALID");
      expect(res.contract?.id).toBe("c-103");
    });

    it("Case 6: Employee with future contract fails for current payrun", () => {
      const res = resolveContractInMemory(sampleContracts, "emp-106", {
        periodStart: "2026-03-01",
        periodEnd: "2026-03-31",
      });
      expect(res.status).toBe("ERROR");
      expect(res.contract).toBeNull();
      expect(res.message).toContain("starts on 2026-07-01");
    });

    it("Case 7: Sequential contracts resolve the correct contract for each period", () => {
      // H1 period resolves c-105a
      const resH1 = resolveContractInMemory(sampleContracts, "emp-105", {
        periodStart: "2026-04-01",
        periodEnd: "2026-04-30",
      });
      expect(resH1.status).toBe("VALID");
      expect(resH1.contract?.id).toBe("c-105a");

      // H2 period resolves c-105b
      const resH2 = resolveContractInMemory(sampleContracts, "emp-105", {
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
      });
      expect(resH2.status).toBe("VALID");
      expect(resH2.contract?.id).toBe("c-105b");
    });

    it("Case 8: Overlapping contracts produce CONFLICT status", () => {
      // Both c-104a and c-104b cover May 2026
      const res = resolveContractInMemory(sampleContracts, "emp-104", {
        periodStart: "2026-05-01",
        periodEnd: "2026-05-31",
      });
      expect(res.status).toBe("CONFLICT");
      expect(res.contract).toBeNull();
      if (res.status === "CONFLICT") {
        expect(res.contracts?.length).toBe(2);
      }
    });

    it("Case 9: Payroll period crossing a mid-month contract transition reports boundary error", () => {
      // c-107a ends Mar 15, c-107b starts Mar 16. Neither covers full March.
      const res = resolveContractInMemory(sampleContracts, "emp-107", {
        periodStart: "2026-03-01",
        periodEnd: "2026-03-31",
      });
      expect(res.status).toBe("ERROR");
      expect(res.contract).toBeNull();
      expect(res.message).toContain("crosses contract transition boundaries");
    });

    it("Case 10: Cancelled contract is never used for payroll", () => {
      const res = resolveContractInMemory(sampleContracts, "emp-108", {
        periodStart: "2026-03-01",
        periodEnd: "2026-03-31",
      });
      expect(res.status).toBe("ERROR");
      expect(res.contract).toBeNull();
      expect(res.message).toContain("none are in an executed status");
    });
  });

  describe("Requirement 5: Overlap Validation Rules", () => {
    it("allows valid sequential contracts (Jan 1 -> Jun 30, then Jul 1 -> Dec 31)", () => {
      const existing: ContractLike[] = [
        {
          id: "con-1",
          employeeId: "emp-A",
          contractNumber: "CON-1",
          status: "active",
          startDate: "2026-01-01",
          endDate: "2026-06-30",
        },
      ];

      const overlapCheck = checkContractOverlapInMemory(existing, {
        employeeId: "emp-A",
        startDate: "2026-07-01",
        endDate: "2026-12-31",
      });

      expect(overlapCheck.hasOverlap).toBe(false);
    });

    it("rejects overlapping contracts (Jan 1 -> Jun 30, and May 1 -> Dec 31)", () => {
      const existing: ContractLike[] = [
        {
          id: "con-1",
          employeeId: "emp-A",
          contractNumber: "CON-1",
          status: "active",
          startDate: "2026-01-01",
          endDate: "2026-06-30",
        },
      ];

      const overlapCheck = checkContractOverlapInMemory(existing, {
        employeeId: "emp-A",
        startDate: "2026-05-01",
        endDate: "2026-12-31",
      });

      expect(overlapCheck.hasOverlap).toBe(true);
      expect(overlapCheck.message).toContain("overlaps with existing contract CON-1");
    });

    it("rejects same-day contract transitions (Contract 1 ends Jun 30, Contract 2 starts Jun 30)", () => {
      const existing: ContractLike[] = [
        {
          id: "con-1",
          employeeId: "emp-A",
          contractNumber: "CON-1",
          status: "active",
          startDate: "2026-01-01",
          endDate: "2026-06-30",
        },
      ];

      const overlapCheck = checkContractOverlapInMemory(existing, {
        employeeId: "emp-A",
        startDate: "2026-06-30", // Collision on June 30
        endDate: "2026-12-31",
      });

      expect(overlapCheck.hasOverlap).toBe(true);
      expect(overlapCheck.message).toContain("overlaps with existing contract CON-1");
    });

    it("detects conflict when creating a contract overlapping an open-ended contract", () => {
      const existing: ContractLike[] = [
        {
          id: "con-open",
          employeeId: "emp-B",
          contractNumber: "CON-OPEN",
          status: "active",
          startDate: "2026-01-01",
          endDate: null,
        },
      ];

      const overlapCheck = checkContractOverlapInMemory(existing, {
        employeeId: "emp-B",
        startDate: "2026-07-01",
        endDate: "2026-12-31",
      });

      expect(overlapCheck.hasOverlap).toBe(true);
      expect(overlapCheck.message).toContain("open-ended");
    });

    it("allows editing an existing contract without self-collision", () => {
      const existing: ContractLike[] = [
        {
          id: "con-edit",
          employeeId: "emp-C",
          contractNumber: "CON-EDIT",
          status: "active",
          startDate: "2026-01-01",
          endDate: "2026-12-31",
        },
      ];

      const overlapCheck = checkContractOverlapInMemory(existing, {
        id: "con-edit", // Same contract ID
        employeeId: "emp-C",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      });

      expect(overlapCheck.hasOverlap).toBe(false);
    });

    it("rejects editing an existing contract if the new date range collides with another contract", () => {
      const existing: ContractLike[] = [
        {
          id: "con-1",
          employeeId: "emp-D",
          contractNumber: "CON-1",
          status: "active",
          startDate: "2026-01-01",
          endDate: "2026-06-30",
        },
        {
          id: "con-2",
          employeeId: "emp-D",
          contractNumber: "CON-2",
          status: "active",
          startDate: "2026-07-01",
          endDate: "2026-12-31",
        },
      ];

      // Attempt to expand con-2 backwards into June 15
      const overlapCheck = checkContractOverlapInMemory(existing, {
        id: "con-2",
        employeeId: "emp-D",
        startDate: "2026-06-15",
        endDate: "2026-12-31",
      });

      expect(overlapCheck.hasOverlap).toBe(true);
      expect(overlapCheck.message).toContain("overlaps with existing contract CON-1");
    });
  });
});
