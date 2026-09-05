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

function safeEvaluateFormula(
  formula: string,
  results: Record<string, number>,
  contractWage: number
): number {
  try {
    let sanitized = formula.trim();
    for (const [code, val] of Object.entries(results)) {
      const regex = new RegExp(`\\b${code}\\b`, "g");
      sanitized = sanitized.replace(regex, val.toString());
    }
    sanitized = sanitized.replace(/\bWAGE\b/g, contractWage.toString());

    if (!/^[\d\s+\-*/().]+$/.test(sanitized)) {
      console.warn(`Unsafe characters in formula after replacement: ${sanitized}`);
      return 0;
    }

    const fn = new Function(`return (${sanitized});`);
    const val = Number(fn());
    return isNaN(val) ? 0 : Math.round(val * 100) / 100;
  } catch (err) {
    console.error(`Error calculating formula "${formula}":`, err);
    return 0;
  }
}

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
        : (context.results[baseCode] ?? 0);
    return Math.round(baseVal * pct * 100) / 100;
  }

  if (rule.computationType === "formula" && rule.formula) {
    return safeEvaluateFormula(rule.formula, context.results, contractWage);
  }

  return 0;
}

export function executeSalaryEngine(
  rules: SalaryRule[],
  context: PayrollContext
): SalaryComputationResult {
  const sortedRules = [...rules].sort((a, b) => a.sequence - b.sequence);
  const lines: EvaluatedSalaryLine[] = [];

  const contractWage = Number(context.contract.wage || 0);
  context.results["WAGE"] = contractWage;

  for (const rule of sortedRules) {
    const amount = evaluateSalaryRule(rule, context);
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

  let basicAmount = context.results["BASIC"] ?? contractWage;
  let grossAmount = context.results["GROSS"] ?? 0;
  let deductionAmount = context.results["DEDUCTIONS"] ?? 0;
  let netAmount = context.results["NET"] ?? 0;

  if (grossAmount === 0) {
    grossAmount = lines
      .filter((l) => l.category === "basic" || l.category === "allowance")
      .reduce((sum, l) => sum + l.total, 0);
  }

  if (deductionAmount === 0) {
    deductionAmount = lines
      .filter((l) => l.category === "deduction")
      .reduce((sum, l) => sum + l.total, 0);
  }

  if (netAmount === 0) {
    netAmount = grossAmount - deductionAmount;
  }

  return {
    lines,
    basicAmount,
    grossAmount,
    deductionAmount,
    netAmount,
  };
}
