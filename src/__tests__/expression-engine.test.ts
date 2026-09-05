import { describe, it, expect } from "bun:test";
import { evaluateExpression } from "../server/services/payroll/expression";

describe("Payroll Safe Expression Engine", () => {
  it("evaluates basic arithmetic operations", () => {
    expect(evaluateExpression("10 + 5", {})).toBe(15);
    expect(evaluateExpression("10 - 4", {})).toBe(6);
    expect(evaluateExpression("6 * 7", {})).toBe(42);
    expect(evaluateExpression("20 / 4", {})).toBe(5);
    expect(evaluateExpression("10.5 + 4.25", {})).toBe(14.75);
  });

  it("respects standard mathematical operator precedence", () => {
    expect(evaluateExpression("2 + 3 * 4", {})).toBe(14);
    expect(evaluateExpression("(2 + 3) * 4", {})).toBe(20);
    expect(evaluateExpression("100 - 20 / 2", {})).toBe(90);
    expect(evaluateExpression("(100 - 20) / 2", {})).toBe(40);
  });

  it("handles unary signs correctly", () => {
    expect(evaluateExpression("-5 + 15", {})).toBe(10);
    expect(evaluateExpression("+5 * +2", {})).toBe(10);
    expect(evaluateExpression("-(10 + 5)", {})).toBe(-15);
  });

  it("evaluates payroll variables accurately", () => {
    const variables = {
      WAGE: 50000,
      BASIC: 25000,
      WORKED_DAYS: 22,
      WORKED_HOURS: 176,
      OVERTIME_HOURS: 10,
      PAID_DAYS: 2,
      UNPAID_DAYS: 1,
    };

    // 50% Basic wage
    expect(evaluateExpression("WAGE * 0.50", variables)).toBe(25000);

    // HRA at 40% of Basic
    expect(evaluateExpression("BASIC * 0.40", variables)).toBe(10000);

    // Provident fund (12% of Basic)
    expect(evaluateExpression("BASIC * 0.12", variables)).toBe(3000);

    // Overtime at 2x hourly rate (assuming 26 days, 8 hrs/day)
    // (50000 / 26 / 8) * 10 * 2 = 480.769...
    const otAmount = evaluateExpression("(WAGE / 26 / 8) * OVERTIME_HOURS * 2", variables);
    expect(Math.round(otAmount * 100) / 100).toBe(4807.69);

    // Prorated wage for attendance: (WAGE / 26) * WORKED_DAYS
    const prorated = evaluateExpression("(WAGE / 26) * WORKED_DAYS", variables);
    expect(Math.round(prorated * 100) / 100).toBe(42307.69);
  });

  it("protects against divide-by-zero errors", () => {
    expect(() => evaluateExpression("100 / 0", {})).toThrow("Division by zero");
    expect(() => evaluateExpression("50 / (10 - 10)", {})).toThrow("Division by zero");
  });

  it("rejects invalid formulas and missing variables", () => {
    expect(() => evaluateExpression("BASIC * 0.5", {})).toThrow("Unknown formula input: BASIC");
    expect(() => evaluateExpression("(10 + 5", {})).toThrow("Unbalanced formula parentheses");
    expect(() => evaluateExpression("10 + * 5", {})).toThrow();
  });

  it("rejects malicious expressions (no code execution)", () => {
    expect(() => evaluateExpression("process.exit(1)", {})).toThrow();
    expect(() => evaluateExpression("require('fs')", {})).toThrow();
    expect(() => evaluateExpression("console.log('pwned')", {})).toThrow();
  });
});
