import { type Employee, type Contract, type NewPayslipWarning } from "@/db/schema";
import { type SalaryComputationResult } from "./salary-engine";

export type ValidationWarningItem = {
  code: string;
  severity: "info" | "warning" | "error";
  message: string;
};

export function validatePayrollEmployee(
  employee: Employee,
  contract: Contract | null,
  salaryResult: SalaryComputationResult | null,
  payslipId: string
): NewPayslipWarning[] {
  const warnings: ValidationWarningItem[] = [];

  if (employee.status !== "active") {
    warnings.push({
      code: "EMPLOYEE_NOT_ACTIVE",
      severity: "warning",
      message: `Employee is currently marked as ${employee.status}, not active.`,
    });
  }

  if (!employee.bankAccountNumber) {
    warnings.push({
      code: "MISSING_BANK_ACCOUNT",
      severity: "warning",
      message: `Employee ${employee.firstName} ${employee.lastName} has no bank account number configured.`,
    });
  }

  if (!contract) {
    warnings.push({
      code: "NO_VALID_CONTRACT",
      severity: "error",
      message: `No valid active contract found for employee for this payrun period.`,
    });
  }

  if (salaryResult) {
    if (salaryResult.netAmount < 0) {
      warnings.push({
        code: "NEGATIVE_NET_SALARY",
        severity: "error",
        message: `Calculated net salary is negative (₹${salaryResult.netAmount}).`,
      });
    }

    if (salaryResult.grossAmount === 0 && salaryResult.basicAmount === 0) {
      warnings.push({
        code: "ZERO_SALARY_COMPUTED",
        severity: "warning",
        message: `Gross and basic salary computed as zero.`,
      });
    }
  }

  return warnings.map((w) => ({
    payslipId,
    code: w.code,
    severity: w.severity,
    message: w.message,
    resolved: false,
  }));
}
