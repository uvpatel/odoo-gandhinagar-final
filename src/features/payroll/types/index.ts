export type PayrunStatus = "draft" | "computed" | "validated" | "paid" | "cancelled";
export type PayslipStatus = "draft" | "computed" | "validated" | "paid" | "cancelled";
export type WarningSeverity = "info" | "warning" | "error";

export interface EligibleEmployee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  workEmail: string | null;
  departmentId: string | null;
  departmentName: string | null;
  jobPositionId: string | null;
  jobTitle: string | null;
  bankAccountNumber: string | null;
  bankName: string | null;
  contract: {
    id: string;
    contractNumber: string;
    wage: number;
    startDate: string;
    endDate: string | null;
    status: string;
    salaryStructureId: string | null;
    salaryStructureName: string | null;
  } | null;
  eligibility: "eligible" | "warning" | "ineligible";
  warningMessage: string | null;
}

export interface PayrunListItem {
  id: string;
  name: string;
  salaryStructureId: string;
  salaryStructureName: string;
  salaryStructureCode: string;
  periodStart: string;
  periodEnd: string;
  status: PayrunStatus;
  createdBy: string;
  creatorName: string;
  payslipCount: number;
  grossTotal: number;
  deductionTotal: number;
  netTotal: number;
  warningsCount: number;
  blockingErrorsCount: number;
  computedAt: string | null;
  validatedAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface PayrunDetail extends PayrunListItem {
  payslips: PayslipSummaryItem[];
  allWarnings: Array<{
    id: string;
    payslipId: string;
    employeeName: string;
    employeeNumber: string;
    code: string;
    severity: WarningSeverity;
    message: string;
    resolved: boolean;
  }>;
}

export interface PayslipSummaryItem {
  id: string;
  payslipNumber: string;
  payrunId: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  departmentName: string | null;
  jobTitle: string | null;
  periodStart: string;
  periodEnd: string;
  workedDays: number;
  workedHours: number;
  basicAmount: number;
  grossAmount: number;
  deductionAmount: number;
  netAmount: number;
  status: PayslipStatus;
  warningsCount: number;
  hasErrors: boolean;
  contractNumber: string | null;
  contractWage: number | null;
  workEmail?: string | null;
}

export interface PayslipDetailItem {
  id: string;
  payslipNumber: string;
  payrunId: string;
  payrunName: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  workEmail: string | null;
  phone: string | null;
  departmentName: string | null;
  jobTitle: string | null;
  bankAccountNumber: string | null;
  bankName: string | null;
  contractId: string;
  contractNumber: string;
  contractWage: number;
  salaryStructureId: string;
  salaryStructureName: string;
  periodStart: string;
  periodEnd: string;
  workedDays: number;
  workedHours: number;
  basicAmount: number;
  grossAmount: number;
  deductionAmount: number;
  netAmount: number;
  status: PayslipStatus;
  computedAt: string | null;
  validatedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  lines: Array<{
    id: string;
    salaryRuleId: string | null;
    ruleCode: string;
    ruleName: string;
    category: "basic" | "allowance" | "gross" | "deduction" | "contribution" | "net";
    sequence: number;
    amount: number;
    quantity: number;
    rate: number;
    total: number;
  }>;
  warnings: Array<{
    id: string;
    code: string;
    severity: WarningSeverity;
    message: string;
    resolved: boolean;
  }>;
}

export interface PayrollDashboardData {
  kpis: {
    totalNetPaid: number;
    payslipsGenerated: number;
    averageSalary: number;
    approvedTimeOffDays: number;
    attendanceHealthRate: number;
    draftPayrunsCount: number;
  };
  departmentCosts: Array<{
    departmentId: string;
    departmentName: string;
    headcount: number;
    payslipCount: number;
    grossTotal: number;
    deductionTotal: number;
    netTotal: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    gross: number;
    net: number;
    deductions: number;
    payslipCount: number;
  }>;
  operationalAlerts: Array<{
    id: string;
    type: "payrun" | "contract" | "bank" | "warning";
    title: string;
    description: string;
    severity: "error" | "warning" | "info";
    link: string;
  }>;
  attendanceOverview: {
    presentCount: number;
    lateCount: number;
    absentCount: number;
    overtimeHours: number;
    coverageRate: number;
  };
  timeOffOverview: {
    approvedDays: number;
    pendingRequestsCount: number;
    paidLeaveDays: number;
    unpaidLeaveDays: number;
  };
}
