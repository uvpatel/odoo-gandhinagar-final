import { evaluateExpression } from "./expression";
import { type SalaryRule, type Employee, type Contract } from "@/db/schema";

export type PayrollContext = {
  employee: Employee;
  contract: Contract;
  period: {
    start: string;
    end: string;
  };
  attendance: {
    workedDays: number;
    workedHours: number;
    overtimeHours: number;
  };
  leave: {
    paidDays: number;
    unpaidDays: number;
  };
  results: Record<string, number>;
};

export type EvaluatedSalaryLine = {
  salaryRuleId: string;
  ruleCode: string;
  ruleName: string;
  category: "basic" | "allowance" | "gross" | "deduction" | "contribution" | "net";
  sequence: number;
  amount: number;
  quantity: number;
  rate: number;
  total: number;
};

export type SalaryComputationResult = {
  lines: EvaluatedSalaryLine[];
  basicAmount: number;
  grossAmount: number;
  deductionAmount: number;
  netAmount: number;
};

export function evaluateSalaryRule(
  rule: SalaryRule,
  context: PayrollContext
): number {
  const contractWage = Number(context.contract.wage || 0);

  if (rule.computationType === "fixed") {
    if (rule.code === "BASIC" && (!rule.fixedAmount || Number(rule.fixedAmount) === 0)) {
      return contractWage;
    }
    return Number(rule.fixedAmount || 0);
  }

  if (rule.computationType === "percentage") {
    const pct = Number(rule.percentage || 0) / 100;
    const baseCode = rule.percentageBase || "BASIC";
    const baseVal =
      baseCode === "BASIC"
        ? (context.results["BASIC"] ?? contractWage)
        : (context.results[baseCode] ?? (() => { throw new Error(`Unknown percentage base: ${baseCode}`); })());
    return Math.round(baseVal * pct * 100) / 100;
  }

  if (rule.computationType === "formula" && rule.formula) {
    return evaluateExpression(rule.formula, { ...context.results, WAGE: contractWage, WORKED_DAYS: context.attendance.workedDays, WORKED_HOURS: context.attendance.workedHours, OVERTIME_HOURS: context.attendance.overtimeHours, PAID_DAYS: context.leave.paidDays, UNPAID_DAYS: context.leave.unpaidDays });
  }

  throw new Error(`Invalid configuration for rule ${rule.code}`);
}

export function executeSalaryEngine(
  rules: SalaryRule[],
  context: PayrollContext
): SalaryComputationResult {
  const sortedRules = rules.filter((r) => r.isActive).sort((a, b) => a.sequence - b.sequence || a.code.localeCompare(b.code));
  if (!sortedRules.length) throw new Error("Salary structure has no active rules");
  if (new Set(sortedRules.map((r) => r.code)).size !== sortedRules.length) throw new Error("Duplicate salary rule codes");
  context = { ...context, results: {} };
  const lines: EvaluatedSalaryLine[] = [];

  const contractWage = Number(context.contract.wage || 0);
  context.results["WAGE"] = contractWage;

  for (const rule of sortedRules) {
    const rawAmount = evaluateSalaryRule(rule, context);
    if (!Number.isFinite(rawAmount) || Math.abs(rawAmount) >= 1e12) throw new Error(`Invalid amount for ${rule.code}`);
    const amount = Math.round((rawAmount + Number.EPSILON) * 100) / 100;
    context.results[rule.code] = amount;

    lines.push({
      salaryRuleId: rule.id,
      ruleCode: rule.code,
      ruleName: rule.name,
      category: rule.category,
      sequence: rule.sequence,
      amount,
      quantity: 1,
      rate: 100,
      total: amount,
    });
  }

  const basicAmount = context.results["BASIC"] ?? contractWage;
  let grossAmount = context.results["GROSS"] ?? 0;
  let deductionAmount = context.results["DEDUCTIONS"] ?? 0;
  let netAmount = context.results["NET"] ?? 0;

  if (context.results["GROSS"] === undefined) {
    grossAmount = lines
      .filter((l) => l.category === "basic" || l.category === "allowance")
      .reduce((sum, l) => sum + l.total, 0);
  }

  if (context.results["DEDUCTIONS"] === undefined) {
    deductionAmount = lines
      .filter((l) => l.category === "deduction")
      .reduce((sum, l) => sum + l.total, 0);
  }

  if (context.results["NET"] === undefined) {
    netAmount = grossAmount - deductionAmount;
  }

  return {
    lines,
    basicAmount,
    grossAmount: Math.round(grossAmount * 100) / 100,
    deductionAmount: Math.round(deductionAmount * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
  };
}
