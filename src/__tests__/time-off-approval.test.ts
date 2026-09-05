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
});
