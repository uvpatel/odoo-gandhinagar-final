import { describe, it, expect } from "bun:test";
import {
  remainingAllocation,
  calendarDays,
  timeMinutes,
  weeklyHours,
} from "../server/domain/hr";

describe("Time-Off & Leave Domain Invariants", () => {
  describe("remainingAllocation balance verification", () => {
    it("correctly computes remaining balance after requested leave", () => {
      // 20 allocated, 5 consumed, requesting 3 => 12 remaining
      expect(remainingAllocation(20, 5, 3)).toBe(12);
      // 10 allocated, 0 consumed, requesting 10 => 0 remaining
      expect(remainingAllocation(10, 0, 10)).toBe(0);
      // Fractional days: 12.5 allocated, 2.5 consumed, requesting 1.5 => 8.5
      expect(remainingAllocation(12.5, 2.5, 1.5)).toBe(8.5);
    });

    it("throws when requested leave exceeds available allocation", () => {
      // 10 allocated, 8 consumed, requesting 3 => remaining is -1 => throws
      expect(() => remainingAllocation(10, 8, 3)).toThrow("Insufficient leave allocation");
      // 5 allocated, 5 consumed, requesting 1 => throws
      expect(() => remainingAllocation(5, 5, 1)).toThrow("Insufficient leave allocation");
    });

    it("validates input numbers and rejects negative or non-finite numbers", () => {
      expect(() => remainingAllocation(-5, 0, 1)).toThrow("Invalid allocation amount");
      expect(() => remainingAllocation(10, -2, 1)).toThrow("Invalid allocation amount");
      expect(() => remainingAllocation(10, 2, 0)).toThrow("Invalid allocation amount");
      expect(() => remainingAllocation(10, 2, -1)).toThrow("Invalid allocation amount");
      expect(() => remainingAllocation(NaN, 2, 1)).toThrow("Invalid allocation amount");
    });
  });

  describe("calendarDays calculation", () => {
    it("calculates inclusive calendar days", () => {
      expect(calendarDays("2026-03-01", "2026-03-01")).toBe(1);
      expect(calendarDays("2026-03-01", "2026-03-05")).toBe(5);
      expect(calendarDays("2026-02-01", "2026-02-28")).toBe(28);
    });

    it("throws if end date precedes start date", () => {
      expect(() => calendarDays("2026-03-10", "2026-03-05")).toThrow("End date must follow start date");
    });
  });

  describe("working schedule hour computation", () => {
    it("converts HH:MM time strings to total minutes", () => {
      expect(timeMinutes("09:00")).toBe(540);
      expect(timeMinutes("17:30")).toBe(1050);
      expect(timeMinutes("00:00")).toBe(0);
    });

    it("calculates weekly hours excluding unpaid lunch breaks", () => {
      // 5-day week: 09:00 to 18:00 (9 hrs) minus 60 min break = 8 hrs/day * 5 = 40 hrs/week
      const schedule = [
        { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", breakMinutes: 60 },
        { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", breakMinutes: 60 },
        { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", breakMinutes: 60 },
        { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", breakMinutes: 60 },
        { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", breakMinutes: 60 },
      ];
      expect(weeklyHours(schedule)).toBe(40);
    });

    it("rejects overlapping shifts on the same day", () => {
      const overlapping = [
        { dayOfWeek: 1, startTime: "09:00", endTime: "14:00", breakMinutes: 0 },
        { dayOfWeek: 1, startTime: "12:00", endTime: "18:00", breakMinutes: 0 },
      ];
      expect(() => weeklyHours(overlapping)).toThrow("Schedule intervals overlap");
    });
  });

  describe("Allocation Lifecycle & Remaining Balance Rules", () => {
    it("only approved allocations contribute to available leave balance", () => {
      const allocations = [
        { id: "1", amount: 20, status: "approved" },
        { id: "2", amount: 10, status: "pending" },
        { id: "3", amount: 5, status: "draft" },
        { id: "4", amount: 15, status: "refused" },
      ];

      const activeBalance = allocations
        .filter((a) => a.status === "approved")
        .reduce((sum, a) => sum + a.amount, 0);

      expect(activeBalance).toBe(20);
    });

    it("verifies allocation date validity window", () => {
      const targetDate = "2026-06-15";

      const allocations = [
        // Valid: 2026 full year
        { id: "1", validFrom: "2026-01-01", validTo: "2026-12-31", amount: 20, status: "approved" },
        // Expired in May 2026
        { id: "2", validFrom: "2026-01-01", validTo: "2026-05-31", amount: 10, status: "approved" },
        // Future: starts in July 2026
        { id: "3", validFrom: "2026-07-01", validTo: "2026-12-31", amount: 5, status: "approved" },
        // Open-ended (null validTo)
        { id: "4", validFrom: "2026-01-01", validTo: null, amount: 8, status: "approved" },
      ];

      const validAllocations = allocations.filter((a) => {
        const isApproved = a.status === "approved";
        const started = a.validFrom <= targetDate;
        const notExpired = !a.validTo || a.validTo >= targetDate;
        return isApproved && started && notExpired;
      });

      expect(validAllocations.map((a) => a.id)).toEqual(["1", "4"]);
      const availableAmount = validAllocations.reduce((s, a) => s + a.amount, 0);
      expect(availableAmount).toBe(28);
    });

    it("restores remaining balance when an approved request is cancelled", () => {
      const allocated = 20;
      let approvedRequests = [
        { id: "req-1", duration: 3, status: "approved" },
        { id: "req-2", duration: 5, status: "approved" },
      ];

      // Initial consumed: 8, remaining: 12
      let consumed = approvedRequests
        .filter((r) => r.status === "approved")
        .reduce((sum, r) => sum + r.duration, 0);
      expect(allocated - consumed).toBe(12);
      expect(remainingAllocation(allocated, consumed, 10)).toBe(2);

      // Cancel req-2
      approvedRequests = approvedRequests.map((r) =>
        r.id === "req-2" ? { ...r, status: "cancelled" } : r
      );

      // New consumed: 3, remaining: 17
      consumed = approvedRequests
        .filter((r) => r.status === "approved")
        .reduce((sum, r) => sum + r.duration, 0);
      expect(allocated - consumed).toBe(17);
      expect(remainingAllocation(allocated, consumed, 10)).toBe(7);
    });

    it("payroll leaves calculation respects isPaid flag and status", () => {
      const leaveRequests = [
        { id: "1", duration: 3, status: "approved", isPaid: true },
        { id: "2", duration: 2, status: "approved", isPaid: false },
        { id: "3", duration: 4, status: "pending", isPaid: true }, // Not approved -> ignored
        { id: "4", duration: 1, status: "refused", isPaid: true }, // Refused -> ignored
        { id: "5", duration: 2, status: "approved", isPaid: true },
      ];

      const approvedLeaves = leaveRequests.filter((l) => l.status === "approved");
      const paidDays = approvedLeaves
        .filter((l) => l.isPaid)
        .reduce((sum, l) => sum + l.duration, 0);
      const unpaidDays = approvedLeaves
        .filter((l) => !l.isPaid)
        .reduce((sum, l) => sum + l.duration, 0);

      expect(paidDays).toBe(5); // req 1 (3) + req 5 (2)
      expect(unpaidDays).toBe(2); // req 2 (2)
    });
  });
});
