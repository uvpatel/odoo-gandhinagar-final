import { db, type Database } from "@/db/index";
import {
  payruns,
  payslips,
  payslipLines,
  payslipWarnings,
  employees,
  contracts,
  salaryStructures,
  salaryRules,
  departments,
  jobPositions,
  attendance,
  timeOffRequests,
  users,
} from "@/db/schema";
import { eq, and, or, sql, desc, asc, isNull, inArray } from "drizzle-orm";
import { Resend } from "resend";
import {
  type EligibleEmployee,
  type PayrunListItem,
  type PayrunDetail,
  type PayslipSummaryItem,
  type PayslipDetailItem,
  type PayrollDashboardData,
} from "../types";
import { type CreatePayrunInput } from "../schemas/payrun.schema";
import { executeSalaryEngine, type PayrollContext } from "@/server/services/payroll/salary-engine";
import { validatePayrollEmployee } from "@/server/services/payroll/payroll-validator";
import { getAttendanceByEmployeeAndPeriod } from "@/db/queries/attendance";
import { getApprovedLeaveForPeriod } from "@/db/queries/time-off";
import { getSalaryStructureById } from "@/db/queries/payroll";
import {
  getApplicableContract,
  resolveContractInMemory,
} from "@/server/services/payroll/contract-resolver";
import { generatePayslipPdf } from "@/server/services/payroll/pdf-generator";
export { generatePayslipPdf } from "@/server/services/payroll/pdf-generator";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

export function getFromEmail(): string {
  return (
    process.env.RESEND_FROM_EMAIL ||
    process.env.EMAIL_FROM ||
    "PeoplePay360 <onboarding@resend.dev>"
  );
}

export function generatePayslipEmailHtml(
  slip: {
    payslipNumber: string;
    employeeName: string;
    employeeNumber?: string;
    departmentName?: string | null;
    jobTitle?: string | null;
    periodStart: string;
    periodEnd: string;
    basicAmount?: number;
    grossAmount: number;
    deductionAmount: number;
    netAmount: number;
  },
  customNote?: string
): string {
  const formattedGross = Number(slip.grossAmount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formattedDeductions = Number(slip.deductionAmount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formattedNet = Number(slip.netAmount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payslip ${slip.payslipNumber}</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 28px 32px; color: #ffffff;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.025em; color: #ffffff;">PeoplePay360</h1>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #bfdbfe; font-weight: 400;">Enterprise Payroll Management</p>
                  </td>
                  <td align="right" valign="top">
                    <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #ffffff;">
                      Confidential
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #0f172a;">
                Dear <strong>${slip.employeeName}</strong>${slip.employeeNumber ? ` (${slip.employeeNumber})` : ""},
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 22px; color: #475569;">
                Your salary slip for pay period <strong>${slip.periodStart}</strong> to <strong>${slip.periodEnd}</strong> has been issued and processed. Please find below the summary breakdown and your official itemized PDF document attached.
              </p>

              ${customNote ? `
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin-bottom: 24px; border-radius: 4px;">
                <p style="margin: 0; font-size: 13px; font-style: italic; color: #1e40af;">
                  ${customNote}
                </p>
              </div>
              ` : ""}

              <!-- Summary Card -->
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px; font-size: 13px;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 45%;">Payslip Reference</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; font-family: monospace; color: #0f172a;">${slip.payslipNumber}</td>
                </tr>
                ${slip.departmentName ? `
                <tr>
                  <td style="padding: 10px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Department</td>
                  <td style="padding: 10px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #334155;">${slip.departmentName}</td>
                </tr>
                ` : ""}
                <tr>
                  <td style="padding: 10px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Gross Earnings</td>
                  <td style="padding: 10px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #0f172a;">₹${formattedGross}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Total Deductions</td>
                  <td style="padding: 10px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #dc2626;">-₹${formattedDeductions}</td>
                </tr>
                <tr style="background-color: #f0fdf4;">
                  <td style="padding: 14px 16px; font-size: 15px; font-weight: 700; color: #166534;">Net Take-Home Salary</td>
                  <td style="padding: 14px 16px; text-align: right; font-size: 17px; font-weight: 800; color: #15803d; font-family: monospace;">₹${formattedNet}</td>
                </tr>
              </table>

              <!-- Attachment Callout -->
              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="32" valign="middle">
                      <span style="font-size: 20px;">📎</span>
                    </td>
                    <td valign="middle" style="font-size: 13px; color: #334155;">
                      <strong>PDF Attachment:</strong> <code style="font-size: 12px; background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px;">payslip-${slip.payslipNumber}.pdf</code>
                      <br><span style="font-size: 11px; color: #64748b;">Includes full itemized breakdown of base salary, allowances, statutory deductions, and tax compliance.</span>
                    </td>
                  </tr>
                </table>
              </div>

              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                If you have any questions regarding your salary computation or deductions, please reach out to your HR/Payroll department or access your PeoplePay360 Employee Self-Service portal.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} PeoplePay360 Inc. This is a computer-generated notification sent via Resend API. Please do not reply directly to this automated email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ============================================================================
// 1. ELIGIBLE EMPLOYEES (WIZARD STEP 2)
// ============================================================================
export async function getEligibleEmployeesForPeriod(
  periodStart: string,
  periodEnd: string,
  targetStructureId?: string,
  database: Database = db
): Promise<EligibleEmployee[]> {
  const activeEmployees = await database
    .select({
      id: employees.id,
      employeeNumber: employees.employeeNumber,
      firstName: employees.firstName,
      lastName: employees.lastName,
      fullName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`.as("full_name"),
      workEmail: employees.workEmail,
      departmentId: employees.departmentId,
      departmentName: departments.name,
      jobPositionId: employees.jobPositionId,
      jobTitle: jobPositions.title,
      bankAccountNumber: employees.bankAccountNumber,
      bankName: employees.bankName,
      status: employees.status,
    })
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(jobPositions, eq(employees.jobPositionId, jobPositions.id))
    .where(eq(employees.status, "active"))
    .orderBy(asc(employees.employeeNumber));

  if (activeEmployees.length === 0) return [];

  // Fetch all non-cancelled contracts for active employees
  const candidateContracts = await database
    .select({
      id: contracts.id,
      employeeId: contracts.employeeId,
      contractNumber: contracts.contractNumber,
      wage: contracts.wage,
      startDate: contracts.startDate,
      endDate: contracts.endDate,
      status: contracts.status,
      salaryStructureId: contracts.salaryStructureId,
      salaryStructureName: salaryStructures.name,
    })
    .from(contracts)
    .leftJoin(salaryStructures, eq(contracts.salaryStructureId, salaryStructures.id))
    .where(
      and(
        sql`${contracts.status} <> 'cancelled'`,
        inArray(
          contracts.employeeId,
          activeEmployees.map((e) => e.id)
        )
      )
    );

  const contractMap = new Map<string, typeof candidateContracts>();
  for (const c of candidateContracts) {
    const list = contractMap.get(c.employeeId) || [];
    list.push(c);
    contractMap.set(c.employeeId, list);
  }

  const duplicates = await database.select({ employeeId: payslips.employeeId }).from(payslips).where(and(
    sql`${payslips.status} <> 'cancelled'`, sql`${payslips.periodStart} <= ${periodEnd}`, sql`${payslips.periodEnd} >= ${periodStart}`
  ));
  const duplicateIds = new Set(duplicates.map((s) => s.employeeId));
  const result: EligibleEmployee[] = activeEmployees.map((emp) => {
    const empContracts = contractMap.get(emp.id) || [];

    // Use centralized, date-aware contract resolution logic
    const resolution = resolveContractInMemory(empContracts, emp.id, {
      periodStart,
      periodEnd,
    });

    if (resolution.status === "ERROR" || resolution.status === "CONFLICT") {
      return {
        id: emp.id,
        employeeNumber: emp.employeeNumber,
        firstName: emp.firstName,
        lastName: emp.lastName,
        fullName: emp.fullName,
        workEmail: emp.workEmail,
        departmentId: emp.departmentId,
        departmentName: emp.departmentName,
        jobPositionId: emp.jobPositionId,
        jobTitle: emp.jobTitle,
        bankAccountNumber: emp.bankAccountNumber,
        bankName: emp.bankName,
        contract: null,
        eligibility: "ineligible",
        warningMessage: resolution.message || "No applicable contract for this payroll period",
      };
    }

    const c = resolution.contract;
    const wageNum = Number(c.wage || 0);

    let eligibility: "eligible" | "warning" | "ineligible" = "eligible";
    let warningMessage: string | null = null;

    if (!emp.bankAccountNumber) {
      eligibility = "warning";
      warningMessage = "Missing bank account number for direct disbursement";
    } else if (wageNum <= 0) {
      eligibility = "warning";
      warningMessage = "Contract basic wage is configured as 0.00";
    } else if (
      targetStructureId &&
      c.salaryStructureId &&
      c.salaryStructureId !== targetStructureId
    ) {
      eligibility = "warning";
      warningMessage = `Contract specifies structure, different from payrun structure`;
    }

    if (targetStructureId && c.salaryStructureId && c.salaryStructureId !== targetStructureId) {
      eligibility = "ineligible";
      warningMessage = "Contract salary structure does not match selected structure";
    }
    if (duplicateIds.has(emp.id)) {
      eligibility = "ineligible";
      warningMessage = "An overlapping payslip already exists";
    }

    const matchedMeta = empContracts.find((x) => x.id === c.id);

    return {
      ...emp,
      contract: {
        id: c.id,
        contractNumber: c.contractNumber,
        wage: wageNum,
        startDate: c.startDate,
        endDate: c.endDate,
        status: c.status,
        salaryStructureId: c.salaryStructureId,
        salaryStructureName: matchedMeta?.salaryStructureName || null,
      },
      eligibility,
      warningMessage,
    };
  });

  return result;
}

// ============================================================================
// 2. CREATE PAYRUN TRANSACTIONALLY
// ============================================================================
export async function createPayrunTransaction(
  input: CreatePayrunInput,
  userId: string
) {
  return db.transaction(async (tx) => {
    // Serializes creation across batches, including periods that overlap without identical dates.
    await tx.execute(sql`select pg_advisory_xact_lock(360001)`);
    const structure = await getSalaryStructureById(input.salaryStructureId, tx);
    if (!structure?.isActive || !structure.rules.some((r) => r.rule?.isActive)) throw new Error("Select an active structure with active rules");
    if (!input.employeeIds.length || new Set(input.employeeIds).size !== input.employeeIds.length) throw new Error("Select unique employees");
    const eligible = await getEligibleEmployeesForPeriod(input.periodStart, input.periodEnd, input.salaryStructureId, tx);
    const selected = input.employeeIds.map((id) => {
      const employee = eligible.find((e) => e.id === id);
      if (!employee?.contract || employee.eligibility === "ineligible") {
        throw new Error(
          `Employee ${employee?.fullName || id} cannot be processed for payrun: ${employee?.warningMessage ?? "No applicable contract for this period"}`
        );
      }
      return { employee, contract: employee.contract };
    });
    const [payrun] = await tx.insert(payruns).values({ name: input.name.trim(), salaryStructureId: input.salaryStructureId,
      periodStart: input.periodStart, periodEnd: input.periodEnd, status: "draft", createdBy: userId }).returning();
    await tx.insert(payslips).values(selected.map(({employee, contract}) => ({
      payslipNumber: `SLIP-${crypto.randomUUID()}`, payrunId: payrun.id, employeeId: employee.id, contractId: contract.id,
      salaryStructureId: input.salaryStructureId, periodStart: input.periodStart, periodEnd: input.periodEnd, status: "draft" as const,
    })));
    return payrun;
  });
}

// ============================================================================
// 3. GET PAYRUNS LIST
// ============================================================================
export async function getPayrunsList(filters?: {
  period?: string;
  status?: string;
  structureId?: string;
  search?: string;
}): Promise<PayrunListItem[]> {
  const conditions = [];

  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(payruns.status, filters.status as any));
  }

  if (filters?.structureId && filters.structureId !== "all") {
    conditions.push(eq(payruns.salaryStructureId, filters.structureId));
  }

  if (filters?.search) {
    conditions.push(sql`${payruns.name} ILIKE ${`%${filters.search}%`}`);
  }

  const list = await db
    .select({
      id: payruns.id,
      name: payruns.name,
      salaryStructureId: payruns.salaryStructureId,
      salaryStructureName: salaryStructures.name,
      salaryStructureCode: salaryStructures.code,
      periodStart: payruns.periodStart,
      periodEnd: payruns.periodEnd,
      status: payruns.status,
      createdBy: payruns.createdBy,
      creatorName: users.name,
      computedAt: payruns.computedAt,
      validatedAt: payruns.validatedAt,
      paidAt: payruns.paidAt,
      createdAt: payruns.createdAt,
      payslipCount: sql<number>`count(distinct ${payslips.id})::int`,
      grossTotal: sql<number>`coalesce(sum(${payslips.grossAmount}), 0)::float`,
      deductionTotal: sql<number>`coalesce(sum(${payslips.deductionAmount}), 0)::float`,
      netTotal: sql<number>`coalesce(sum(${payslips.netAmount}), 0)::float`,
      warningsCount: sql<number>`count(distinct ${payslipWarnings.id})::int`,
      blockingErrorsCount: sql<number>`count(distinct case when ${payslipWarnings.severity} = 'error' then ${payslipWarnings.id} end)::int`,
    })
    .from(payruns)
    .leftJoin(salaryStructures, eq(payruns.salaryStructureId, salaryStructures.id))
    .leftJoin(users, eq(payruns.createdBy, users.id))
    .leftJoin(payslips, eq(payruns.id, payslips.payrunId))
    .leftJoin(payslipWarnings, eq(payslips.id, payslipWarnings.payslipId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(payruns.id, salaryStructures.id, users.id)
    .orderBy(desc(payruns.createdAt));

  return list.map((item) => ({
    id: item.id,
    name: item.name,
    salaryStructureId: item.salaryStructureId,
    salaryStructureName: item.salaryStructureName || "Standard",
    salaryStructureCode: item.salaryStructureCode || "STD",
    periodStart: item.periodStart,
    periodEnd: item.periodEnd,
    status: item.status,
    createdBy: item.createdBy,
    creatorName: item.creatorName || "Admin",
    payslipCount: item.payslipCount || 0,
    grossTotal: Math.round(item.grossTotal * 100) / 100,
    deductionTotal: Math.round(item.deductionTotal * 100) / 100,
    netTotal: Math.round(item.netTotal * 100) / 100,
    warningsCount: item.warningsCount || 0,
    blockingErrorsCount: item.blockingErrorsCount || 0,
    computedAt: item.computedAt ? new Date(item.computedAt).toISOString() : null,
    validatedAt: item.validatedAt ? new Date(item.validatedAt).toISOString() : null,
    paidAt: item.paidAt ? new Date(item.paidAt).toISOString() : null,
    createdAt: new Date(item.createdAt).toISOString(),
  }));
}

// ============================================================================
// 4. GET PAYRUN DETAIL
// ============================================================================
export async function getPayrunDetail(payrunId: string): Promise<PayrunDetail | null> {
  const matched = (await getPayrunsList()).find((p) => p.id === payrunId);

  if (!matched) return null;

  // Fetch all payslips for this payrun
  const rawSlips = await db
    .select({
      id: payslips.id,
      payslipNumber: payslips.payslipNumber,
      payrunId: payslips.payrunId,
      employeeId: payslips.employeeId,
      employeeNumber: employees.employeeNumber,
      firstName: employees.firstName,
      lastName: employees.lastName,
      workEmail: employees.workEmail,
      departmentName: departments.name,
      jobTitle: jobPositions.title,
      periodStart: payslips.periodStart,
      periodEnd: payslips.periodEnd,
      workedDays: payslips.workedDays,
      workedHours: payslips.workedHours,
      basicAmount: payslips.basicAmount,
      grossAmount: payslips.grossAmount,
      deductionAmount: payslips.deductionAmount,
      netAmount: payslips.netAmount,
      status: payslips.status,
      contractNumber: contracts.contractNumber,
      contractWage: contracts.wage,
      warningsCount: sql<number>`count(${payslipWarnings.id})::int`,
      hasErrors: sql<boolean>`bool_or(${payslipWarnings.severity} = 'error')`,
    })
    .from(payslips)
    .leftJoin(employees, eq(payslips.employeeId, employees.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(jobPositions, eq(employees.jobPositionId, jobPositions.id))
    .leftJoin(contracts, eq(payslips.contractId, contracts.id))
    .leftJoin(payslipWarnings, eq(payslips.id, payslipWarnings.payslipId))
    .where(eq(payslips.payrunId, payrunId))
    .groupBy(payslips.id, employees.id, employees.workEmail, departments.id, jobPositions.id, contracts.id)
    .orderBy(asc(employees.employeeNumber));

  const slipItems: PayslipSummaryItem[] = rawSlips.map((s) => ({
    id: s.id,
    payslipNumber: s.payslipNumber,
    payrunId: s.payrunId,
    employeeId: s.employeeId,
    employeeName: `${s.firstName || ""} ${s.lastName || ""}`.trim() || "Employee",
    employeeNumber: s.employeeNumber || "",
    workEmail: s.workEmail || null,
    departmentName: s.departmentName,
    jobTitle: s.jobTitle,
    periodStart: s.periodStart,
    periodEnd: s.periodEnd,
    workedDays: Number(s.workedDays || 0),
    workedHours: Number(s.workedHours || 0),
    basicAmount: Number(s.basicAmount || 0),
    grossAmount: Number(s.grossAmount || 0),
    deductionAmount: Number(s.deductionAmount || 0),
    netAmount: Number(s.netAmount || 0),
    status: s.status,
    warningsCount: s.warningsCount || 0,
    hasErrors: Boolean(s.hasErrors),
    contractNumber: s.contractNumber,
    contractWage: s.contractWage ? Number(s.contractWage) : null,
  }));

  // Fetch all warnings
  const slipIds = slipItems.map((s) => s.id);
  let allWarnings: PayrunDetail["allWarnings"] = [];

  if (slipIds.length > 0) {
    const rawWarnings = await db
      .select({
        id: payslipWarnings.id,
        payslipId: payslipWarnings.payslipId,
        code: payslipWarnings.code,
        severity: payslipWarnings.severity,
        message: payslipWarnings.message,
        resolved: payslipWarnings.resolved,
        employeeNumber: employees.employeeNumber,
        firstName: employees.firstName,
        lastName: employees.lastName,
      })
      .from(payslipWarnings)
      .leftJoin(payslips, eq(payslipWarnings.payslipId, payslips.id))
      .leftJoin(employees, eq(payslips.employeeId, employees.id))
      .where(inArray(payslipWarnings.payslipId, slipIds));

    allWarnings = rawWarnings.map((w) => ({
      id: w.id,
      payslipId: w.payslipId,
      code: w.code,
      severity: w.severity,
      message: w.message,
      resolved: w.resolved,
      employeeNumber: w.employeeNumber || "",
      employeeName: `${w.firstName || ""} ${w.lastName || ""}`.trim(),
    }));
  }

  return {
    ...matched,
    payslips: slipItems,
    allWarnings,
  };
}

// ============================================================================
// 5. COMPUTE PAYRUN (COMPUTATION ENGINE)
// ============================================================================
export async function computePayrunExecution(payrunId: string) {
  return db.transaction(async (db) => {
    await db.execute(sql`select pg_advisory_xact_lock(360001)`);

  const [payrun] = await db
    .select()
    .from(payruns)
    .where(eq(payruns.id, payrunId))
    .limit(1).for("update");

  if (!payrun) throw new Error(`Payrun not found`);
  if (payrun.status !== "draft" && payrun.status !== "computed") {
    throw new Error(`Cannot recompute a payrun with status '${payrun.status}'`);
  }

  const runSlips = await db
    .select()
    .from(payslips)
    .where(eq(payslips.payrunId, payrunId));

  if (!runSlips.length) throw new Error("Cannot compute an empty payrun");
  for (const slip of runSlips) {
    // 1. Get employee
    const [emp] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, slip.employeeId))
      .limit(1);

    if (!emp) throw new Error("Employee not found");

    // 2. Resolve applicable contract using centralized, date-aware resolver
    const resolution = await getApplicableContract(
      slip.employeeId,
      { periodStart: payrun.periodStart, periodEnd: payrun.periodEnd },
      db
    );
    const contract = resolution.status === "VALID" ? resolution.contract : null;
    const contractResolutionError = resolution.status !== "VALID" ? resolution.message : null;

    // 3. Load structure & rules
    const structureId =
      payrun.salaryStructureId;
    const structure = await getSalaryStructureById(structureId, db);

    const rules = (structure?.rules
      ?.map((r) => r.rule ? { ...r.rule, sequence: r.sequence } : null)
      .filter((r): r is NonNullable<typeof r> => Boolean(r)) || []);

    // 4. Attendance aggregation
    const attendances = await getAttendanceByEmployeeAndPeriod(
      slip.employeeId,
      payrun.periodStart,
      payrun.periodEnd, db
    );

    const totalWorkedMinutes = attendances.reduce(
      (sum: number, a) => sum + (a.workedMinutes || 0),
      0
    );
    const totalOvertimeMinutes = attendances.reduce(
      (sum: number, a) => sum + (a.overtimeMinutes || 0),
      0
    );
    const workedHours = Math.round((totalWorkedMinutes / 60) * 100) / 100;
    const workedDays = attendances.filter((a) => a.checkIn).length;
    const overtimeHours = Math.round((totalOvertimeMinutes / 60) * 100) / 100;

    // 5. Approved Leaves
    const approvedLeaves = await getApprovedLeaveForPeriod(
      slip.employeeId,
      payrun.periodStart,
      payrun.periodEnd, db
    );

    const paidDays = approvedLeaves
      .filter((l) => l.timeOffType?.isPaid)
      .reduce((sum: number, l) => sum + Number(l.duration), 0);
    const unpaidDays = approvedLeaves
      .filter((l) => !l.timeOffType?.isPaid)
      .reduce((sum: number, l) => sum + Number(l.duration), 0);

    // 6. Build Payroll Context
    const context = contract ? {
      employee: emp,
      contract,
      period: {
        start: payrun.periodStart,
        end: payrun.periodEnd,
      },
      attendance: {
        workedDays,
        workedHours,
        overtimeHours,
      },
      leave: {
        paidDays,
        unpaidDays,
      },
      results: {},
    } satisfies PayrollContext : null;

    // 7. Execute Salary Engine
    let computation = null;
    let calculationError: string | null = null;
    try {
      if (!context || !contract) {
        throw new Error(contractResolutionError || "Missing or ambiguous contract covering the full payroll period");
      }
      if (!structure?.isActive) throw new Error("Salary structure is inactive or missing");
      if (contract?.salaryStructureId && contract.salaryStructureId !== structureId) throw new Error("Contract structure mismatch");
      computation = executeSalaryEngine(rules, context);
    } catch (error) { calculationError = error instanceof Error ? error.message : "Calculation failed"; }

    // 8. Delete old lines and warnings for this slip
    await db.delete(payslipLines).where(eq(payslipLines.payslipId, slip.id));
    await db.delete(payslipWarnings).where(eq(payslipWarnings.payslipId, slip.id));

    // 9. Update payslip
    await db
      .update(payslips)
      .set({
        contractId: contract?.id || slip.contractId,
        salaryStructureId: structureId,
        workedDays: workedDays.toFixed(2),
        workedHours: workedHours.toFixed(2),
        basicAmount: (computation?.basicAmount ?? 0).toFixed(2),
        grossAmount: (computation?.grossAmount ?? 0).toFixed(2),
        deductionAmount: (computation?.deductionAmount ?? 0).toFixed(2),
        netAmount: (computation?.netAmount ?? 0).toFixed(2),
        status: "computed",
        computedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payslips.id, slip.id));

    // 10. Persist Lines
    if (computation && computation.lines.length > 0) {
      await db.insert(payslipLines).values(
        computation.lines.map((l) => ({
          payslipId: slip.id,
          salaryRuleId: l.salaryRuleId,
          ruleCode: l.ruleCode,
          ruleName: l.ruleName,
          category: l.category,
          sequence: l.sequence,
          amount: l.amount.toFixed(2),
          quantity: l.quantity.toFixed(4),
          rate: l.rate.toFixed(4),
          total: l.total.toFixed(2),
        }))
      );
    }

    // 11. Generate and persist warnings
    const warnings = validatePayrollEmployee(emp, contract || null, computation, slip.id);
    if (calculationError) warnings.push({ payslipId: slip.id, code: "CALCULATION_FAILED", severity: "error", message: calculationError, resolved: false });
    if (warnings.length > 0) {
      await db.insert(payslipWarnings).values(warnings);
    }
  }

  // Update payrun status to "computed"
  const [updatedPayrun] = await db
    .update(payruns)
    .set({
      status: "computed",
      computedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(payruns.id, payrunId))
    .returning();

  return updatedPayrun;
  });
}

// ============================================================================
// 6. VALIDATE PAYRUN (BLOCKING ERROR CHECKS)
// ============================================================================
export async function validatePayrunExecution(payrunId: string) {
  return db.transaction(async (db) => {
    await db.execute(sql`select pg_advisory_xact_lock(360001)`);

  const [payrun] = await db
    .select()
    .from(payruns)
    .where(eq(payruns.id, payrunId))
    .limit(1).for("update");

  if (!payrun) throw new Error("Payrun not found");
  if (payrun.status === "validated") return payrun;
  if (payrun.status !== "computed") {
    throw new Error("Only computed payruns can be validated");
  }

  const slips = await db.select().from(payslips).where(eq(payslips.payrunId, payrunId));
  if (!slips.length || slips.some((s) => s.status !== "computed" || !s.computedAt)) throw new Error("Every payslip must be computed before validation");
  // Check for blocking errors
  const blockingErrors = await db
    .select({
      id: payslipWarnings.id,
      code: payslipWarnings.code,
      message: payslipWarnings.message,
      employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`,
    })
    .from(payslipWarnings)
    .leftJoin(payslips, eq(payslipWarnings.payslipId, payslips.id))
    .leftJoin(employees, eq(payslips.employeeId, employees.id))
    .where(
      and(
        eq(payslips.payrunId, payrunId),
        eq(payslipWarnings.severity, "error"),
        eq(payslipWarnings.resolved, false)
      )
    );

  if (blockingErrors.length > 0) {
    const errorDetails = blockingErrors
      .slice(0, 3)
      .map((e) => `• ${e.employeeName}: ${e.message}`)
      .join("\n");
    throw new Error(
      `Cannot validate payrun: ${blockingErrors.length} blocking error(s) must be resolved first:\n${errorDetails}`
    );
  }

  // Update payrun status to "validated"
  const [validated] = await db
    .update(payruns)
    .set({
      status: "validated",
      validatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(payruns.id, payrunId))
    .returning();

  // Update all payslips in payrun to "validated"
  await db
    .update(payslips)
    .set({
      status: "validated",
      validatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(payslips.payrunId, payrunId));

  return validated;
  });
}

// ============================================================================
// 7. MARK PAID (FINALIZATION)
// ============================================================================
export async function markPayrunPaidExecution(payrunId: string) {
  return db.transaction(async (db) => {
    await db.execute(sql`select pg_advisory_xact_lock(360001)`);

  const [payrun] = await db
    .select()
    .from(payruns)
    .where(eq(payruns.id, payrunId))
    .limit(1).for("update");

  if (!payrun) throw new Error("Payrun not found");
  if (payrun.status === "paid") return payrun;
  if (payrun.status !== "validated") {
    throw new Error("Only validated payruns can be marked as paid");
  }

  const now = new Date();

  // Mark payrun as paid
  const [paidRun] = await db
    .update(payruns)
    .set({
      status: "paid",
      paidAt: now,
      updatedAt: now,
    })
    .where(eq(payruns.id, payrunId))
    .returning();

  // Mark all payslips as paid
  await db
    .update(payslips)
    .set({
      status: "paid",
      paidAt: now,
      updatedAt: now,
    })
    .where(eq(payslips.payrunId, payrunId));

  return paidRun;
  });
}

// ============================================================================
// 8. SEND PAYSLIPS IN BULK VIA RESEND
// ============================================================================
export async function sendPayrunPayslipsExecution(payrunId: string) {
  const [payrun] = await db
    .select({
      id: payruns.id,
      name: payruns.name,
      status: payruns.status,
      periodStart: payruns.periodStart,
      periodEnd: payruns.periodEnd,
    })
    .from(payruns)
    .where(eq(payruns.id, payrunId))
    .limit(1);

  if (!payrun) throw new Error("Payrun not found");
  if (payrun.status !== "validated" && payrun.status !== "paid") {
    throw new Error("Payslips can only be sent for validated or paid payruns");
  }

  const slips = await db
    .select({
      id: payslips.id,
      payslipNumber: payslips.payslipNumber,
      netAmount: payslips.netAmount,
      grossAmount: payslips.grossAmount,
      deductionAmount: payslips.deductionAmount,
      firstName: employees.firstName,
      lastName: employees.lastName,
      workEmail: employees.workEmail,
      employeeNumber: employees.employeeNumber,
      departmentName: departments.name,
    })
    .from(payslips)
    .leftJoin(employees, eq(payslips.employeeId, employees.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .where(eq(payslips.payrunId, payrunId));

  let sentCount = 0;
  let failedCount = 0;

  for (const s of slips) {
    if (!s.workEmail) {
      failedCount++;
      continue;
    }

    try {
      const fullDetail = await getPayslipDetail(s.id);
      let attachments: Array<{ filename: string; content: Buffer }> | undefined = undefined;
      if (fullDetail) {
        try {
          const pdfBytes = await generatePayslipPdf(fullDetail);
          attachments = [
            {
              filename: `payslip-${s.payslipNumber}.pdf`,
              content: Buffer.from(pdfBytes),
            },
          ];
        } catch (pdfErr) {
          console.warn(`Could not generate PDF attachment for payslip ${s.payslipNumber}:`, pdfErr);
        }
      }

      const sendRes = await resend.emails.send({
        from: getFromEmail(),
        to: [s.workEmail],
        subject: `Your Payslip for ${payrun.name} (${s.payslipNumber})`,
        html: generatePayslipEmailHtml({
          payslipNumber: s.payslipNumber,
          employeeName: `${s.firstName || ""} ${s.lastName || ""}`.trim() || "Employee",
          employeeNumber: s.employeeNumber || "",
          departmentName: s.departmentName,
          periodStart: payrun.periodStart,
          periodEnd: payrun.periodEnd,
          grossAmount: Number(s.grossAmount),
          deductionAmount: Number(s.deductionAmount),
          netAmount: Number(s.netAmount),
        }),
        attachments,
      });

      if (sendRes.error) {
        throw new Error(sendRes.error.message || "Resend dispatch failed");
      }

      sentCount++;
    } catch (err) {
      console.error(`Failed to send payslip email to ${s.workEmail}:`, err);
      failedCount++;
    }
  }

  return {
    sentCount,
    failedCount,
    totalCount: slips.length,
    summary: `${sentCount} sent · ${failedCount} failed of ${slips.length} employees`,
  };
}

// ============================================================================
// 9. GET SINGLE PAYSLIP DETAIL
// ============================================================================
export async function getPayslipDetail(payslipId: string): Promise<PayslipDetailItem | null> {
  const [slip] = await db
    .select({
      id: payslips.id,
      payslipNumber: payslips.payslipNumber,
      payrunId: payslips.payrunId,
      payrunName: payruns.name,
      employeeId: payslips.employeeId,
      employeeNumber: employees.employeeNumber,
      firstName: employees.firstName,
      lastName: employees.lastName,
      workEmail: employees.workEmail,
      phone: employees.phone,
      departmentName: departments.name,
      jobTitle: jobPositions.title,
      bankAccountNumber: employees.bankAccountNumber,
      bankName: employees.bankName,
      contractId: payslips.contractId,
      contractNumber: contracts.contractNumber,
      contractWage: contracts.wage,
      salaryStructureId: payslips.salaryStructureId,
      salaryStructureName: salaryStructures.name,
      periodStart: payslips.periodStart,
      periodEnd: payslips.periodEnd,
      workedDays: payslips.workedDays,
      workedHours: payslips.workedHours,
      basicAmount: payslips.basicAmount,
      grossAmount: payslips.grossAmount,
      deductionAmount: payslips.deductionAmount,
      netAmount: payslips.netAmount,
      status: payslips.status,
      computedAt: payslips.computedAt,
      validatedAt: payslips.validatedAt,
      paidAt: payslips.paidAt,
      createdAt: payslips.createdAt,
    })
    .from(payslips)
    .leftJoin(payruns, eq(payslips.payrunId, payruns.id))
    .leftJoin(employees, eq(payslips.employeeId, employees.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(jobPositions, eq(employees.jobPositionId, jobPositions.id))
    .leftJoin(contracts, eq(payslips.contractId, contracts.id))
    .leftJoin(salaryStructures, eq(payslips.salaryStructureId, salaryStructures.id))
    .where(eq(payslips.id, payslipId))
    .limit(1);

  if (!slip) return null;

  // Fetch ordered lines
  const lines = await db
    .select({
      id: payslipLines.id,
      salaryRuleId: payslipLines.salaryRuleId,
      ruleCode: payslipLines.ruleCode,
      ruleName: payslipLines.ruleName,
      category: payslipLines.category,
      sequence: payslipLines.sequence,
      amount: payslipLines.amount,
      quantity: payslipLines.quantity,
      rate: payslipLines.rate,
      total: payslipLines.total,
    })
    .from(payslipLines)
    .where(eq(payslipLines.payslipId, payslipId))
    .orderBy(asc(payslipLines.sequence));

  // Fetch warnings
  const warnings = await db
    .select({
      id: payslipWarnings.id,
      code: payslipWarnings.code,
      severity: payslipWarnings.severity,
      message: payslipWarnings.message,
      resolved: payslipWarnings.resolved,
    })
    .from(payslipWarnings)
    .where(eq(payslipWarnings.payslipId, payslipId));

  return {
    id: slip.id,
    payslipNumber: slip.payslipNumber,
    payrunId: slip.payrunId,
    payrunName: slip.payrunName || "Payrun",
    employeeId: slip.employeeId,
    employeeName: `${slip.firstName || ""} ${slip.lastName || ""}`.trim() || "Employee",
    employeeNumber: slip.employeeNumber || "",
    workEmail: slip.workEmail,
    phone: slip.phone,
    departmentName: slip.departmentName,
    jobTitle: slip.jobTitle,
    bankAccountNumber: slip.bankAccountNumber,
    bankName: slip.bankName,
    contractId: slip.contractId,
    contractNumber: slip.contractNumber || "N/A",
    contractWage: Number(slip.contractWage || 0),
    salaryStructureId: slip.salaryStructureId,
    salaryStructureName: slip.salaryStructureName || "Standard",
    periodStart: slip.periodStart,
    periodEnd: slip.periodEnd,
    workedDays: Number(slip.workedDays || 0),
    workedHours: Number(slip.workedHours || 0),
    basicAmount: Number(slip.basicAmount || 0),
    grossAmount: Number(slip.grossAmount || 0),
    deductionAmount: Number(slip.deductionAmount || 0),
    netAmount: Number(slip.netAmount || 0),
    status: slip.status,
    computedAt: slip.computedAt ? new Date(slip.computedAt).toISOString() : null,
    validatedAt: slip.validatedAt ? new Date(slip.validatedAt).toISOString() : null,
    paidAt: slip.paidAt ? new Date(slip.paidAt).toISOString() : null,
    createdAt: new Date(slip.createdAt).toISOString(),
    lines: lines.map((l) => ({
      id: l.id,
      salaryRuleId: l.salaryRuleId,
      ruleCode: l.ruleCode,
      ruleName: l.ruleName,
      category: l.category,
      sequence: l.sequence,
      amount: Number(l.amount),
      quantity: Number(l.quantity),
      rate: Number(l.rate),
      total: Number(l.total),
    })),
    warnings,
  };
}

// ============================================================================
// 9.5 GET PAYSLIPS LIST & SINGLE SEND
// ============================================================================
export async function getPayslipsList(filters?: {
  search?: string;
  status?: string;
  payrunId?: string;
  employeeId?: string;
  departmentId?: string;
  periodStart?: string;
  periodEnd?: string;
  limit?: number;
  offset?: number;
}): Promise<PayslipSummaryItem[]> {
  const conditions = [];

  if (filters?.payrunId) {
    conditions.push(eq(payslips.payrunId, filters.payrunId));
  }
  if (filters?.employeeId) {
    conditions.push(eq(payslips.employeeId, filters.employeeId));
  }
  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(payslips.status, filters.status as any));
  }
  if (filters?.departmentId && filters.departmentId !== "all") {
    conditions.push(eq(employees.departmentId, filters.departmentId));
  }
  if (filters?.periodStart) {
    conditions.push(sql`${payslips.periodStart} >= ${filters.periodStart}`);
  }
  if (filters?.periodEnd) {
    conditions.push(sql`${payslips.periodEnd} <= ${filters.periodEnd}`);
  }
  if (filters?.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        sql`${payslips.payslipNumber} ILIKE ${term}`,
        sql`${employees.firstName} ILIKE ${term}`,
        sql`${employees.lastName} ILIKE ${term}`,
        sql`${employees.employeeNumber} ILIKE ${term}`
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rawSlips = await db
    .select({
      id: payslips.id,
      payslipNumber: payslips.payslipNumber,
      payrunId: payslips.payrunId,
      employeeId: payslips.employeeId,
      firstName: employees.firstName,
      lastName: employees.lastName,
      workEmail: employees.workEmail,
      employeeNumber: employees.employeeNumber,
      departmentName: departments.name,
      jobTitle: jobPositions.title,
      periodStart: payslips.periodStart,
      periodEnd: payslips.periodEnd,
      workedDays: payslips.workedDays,
      workedHours: payslips.workedHours,
      basicAmount: payslips.basicAmount,
      grossAmount: payslips.grossAmount,
      deductionAmount: payslips.deductionAmount,
      netAmount: payslips.netAmount,
      status: payslips.status,
      contractNumber: contracts.contractNumber,
      contractWage: contracts.wage,
      warningsCount: sql<number>`count(${payslipWarnings.id})::int`,
      hasErrors: sql<boolean>`bool_or(${payslipWarnings.severity} = 'error')`,
    })
    .from(payslips)
    .leftJoin(employees, eq(payslips.employeeId, employees.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(jobPositions, eq(employees.jobPositionId, jobPositions.id))
    .leftJoin(contracts, eq(payslips.contractId, contracts.id))
    .leftJoin(payslipWarnings, eq(payslips.id, payslipWarnings.payslipId))
    .where(whereClause)
    .groupBy(payslips.id, employees.id, employees.workEmail, departments.id, jobPositions.id, contracts.id)
    .orderBy(desc(payslips.createdAt))
    .limit(filters?.limit || 100)
    .offset(filters?.offset || 0);

  return rawSlips.map((s) => ({
    id: s.id,
    payslipNumber: s.payslipNumber,
    payrunId: s.payrunId,
    employeeId: s.employeeId,
    employeeName: `${s.firstName || ""} ${s.lastName || ""}`.trim() || "Employee",
    employeeNumber: s.employeeNumber || "",
    workEmail: s.workEmail || null,
    departmentName: s.departmentName,
    jobTitle: s.jobTitle,
    periodStart: s.periodStart,
    periodEnd: s.periodEnd,
    workedDays: Number(s.workedDays || 0),
    workedHours: Number(s.workedHours || 0),
    basicAmount: Number(s.basicAmount || 0),
    grossAmount: Number(s.grossAmount || 0),
    deductionAmount: Number(s.deductionAmount || 0),
    netAmount: Number(s.netAmount || 0),
    status: s.status,
    warningsCount: s.warningsCount || 0,
    hasErrors: Boolean(s.hasErrors),
    contractNumber: s.contractNumber,
    contractWage: s.contractWage ? Number(s.contractWage) : null,
  }));
}

export interface SendPayslipOptions {
  recipientEmail?: string;
  attachPdf?: boolean;
  subject?: string;
  customNote?: string;
}

export async function sendSinglePayslipExecution(
  payslipId: string,
  options?: SendPayslipOptions | string
) {
  const opts: SendPayslipOptions =
    typeof options === "string" ? { recipientEmail: options } : options || {};

  const slip = await getPayslipDetail(payslipId);
  if (!slip) throw new Error("Payslip not found");

  const targetEmail = (opts.recipientEmail || slip.workEmail || "").trim();
  if (!targetEmail) {
    throw new Error(
      "Employee does not have a work email configured, and no recipient email was provided."
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(targetEmail)) {
    throw new Error(`Invalid recipient email address format: "${targetEmail}"`);
  }

  let attachments: Array<{ filename: string; content: Buffer }> | undefined = undefined;
  if (opts.attachPdf !== false) {
    try {
      const pdfBytes = await generatePayslipPdf(slip);
      attachments = [
        {
          filename: `payslip-${slip.payslipNumber}.pdf`,
          content: Buffer.from(pdfBytes),
        },
      ];
    } catch (pdfErr) {
      console.warn(`Could not generate PDF attachment for payslip ${slip.payslipNumber}:`, pdfErr);
    }
  }

  const fromAddress = getFromEmail();
  const emailSubject =
    opts.subject?.trim() ||
    `Your Payslip ${slip.payslipNumber} for Period ${slip.periodStart} to ${slip.periodEnd}`;

  const emailHtml = generatePayslipEmailHtml(slip, opts.customNote);

  const sendResult = await resend.emails.send({
    from: fromAddress,
    to: [targetEmail],
    subject: emailSubject,
    html: emailHtml,
    attachments,
  });

  if (sendResult.error) {
    console.error(`Resend send failed for ${slip.payslipNumber} to ${targetEmail}:`, sendResult.error);
    throw new Error(sendResult.error.message || "Failed to dispatch email via Resend API");
  }

  return {
    success: true,
    email: targetEmail,
    messageId: sendResult.data?.id,
    payslipNumber: slip.payslipNumber,
  };
}

export async function sendBulkPayslipsExecution(
  payslipIds: string[],
  options?: {
    overrideRecipient?: string;
    attachPdf?: boolean;
    customNote?: string;
  }
) {
  if (!payslipIds || payslipIds.length === 0) {
    throw new Error("No payslips selected for email dispatch");
  }

  let sentCount = 0;
  let failedCount = 0;
  const results: Array<{
    id: string;
    payslipNumber: string;
    email: string;
    success: boolean;
    error?: string;
  }> = [];

  for (const id of payslipIds) {
    try {
      const res = await sendSinglePayslipExecution(id, {
        recipientEmail: options?.overrideRecipient,
        attachPdf: options?.attachPdf,
        customNote: options?.customNote,
      });
      sentCount++;
      results.push({
        id,
        payslipNumber: res.payslipNumber,
        email: res.email,
        success: true,
      });
    } catch (err: any) {
      failedCount++;
      results.push({
        id,
        payslipNumber: id,
        email: options?.overrideRecipient || "Configured Email",
        success: false,
        error: err.message || "Delivery failed",
      });
    }
  }

  return {
    sentCount,
    failedCount,
    totalCount: payslipIds.length,
    results,
    summary: `${sentCount} sent successfully · ${failedCount} failed of ${payslipIds.length} requested`,
  };
}

export function generatePayslipPrintHtml(slip: PayslipDetailItem): string {
  const earnings = slip.lines.filter((l) => ["basic", "allowance", "gross"].includes(l.category));
  const deductions = slip.lines.filter((l) => ["deduction", "contribution"].includes(l.category));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payslip ${slip.payslipNumber} - ${slip.employeeName}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 32px;
      background: #f8fafc;
      font-size: 13px;
    }
    .sheet {
      background: #ffffff;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .company-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .company-sub {
      color: #64748b;
      font-size: 12px;
      margin-top: 2px;
    }
    .payslip-meta {
      text-align: right;
    }
    .payslip-number {
      font-size: 18px;
      font-weight: 700;
      color: #2563eb;
    }
    .period-badge {
      display: inline-block;
      background: #eff6ff;
      color: #1d4ed8;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 4px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px 32px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
      margin-bottom: 28px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dashed #e2e8f0;
      padding-bottom: 4px;
    }
    .info-label { color: #64748b; font-weight: 500; }
    .info-val { font-weight: 600; color: #0f172a; }
    
    .breakdown-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .breakdown-table th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 600;
      text-align: left;
      padding: 8px 12px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .breakdown-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    .breakdown-table tr:hover td {
      background: #fafafa;
    }
    .amount-col {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }
    .totals-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .net-label {
      font-size: 14px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
    }
    .net-amount {
      font-size: 28px;
      font-weight: 800;
      color: #16a34a;
    }
    .footer-signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      margin-top: 60px;
      padding-top: 20px;
    }
    .signature-line {
      border-top: 1px solid #94a3b8;
      text-align: center;
      padding-top: 8px;
      font-size: 12px;
      color: #64748b;
    }
    .no-print-bar {
      max-width: 800px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .btn {
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }
    @media print {
      body { background: white; padding: 0; }
      .sheet { box-shadow: none; border: none; padding: 0; }
      .no-print-bar { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <button class="btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="sheet">
    <div class="header">
      <div>
        <div class="company-title">PeoplePay360</div>
        <div class="company-sub">Enterprise Payroll & HR Management</div>
        <div class="company-sub">Payrun: ${slip.payrunName}</div>
      </div>
      <div class="payslip-meta">
        <div class="payslip-number">${slip.payslipNumber}</div>
        <div class="period-badge">${slip.periodStart} &mdash; ${slip.periodEnd}</div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Status: ${slip.status.toUpperCase()}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-row">
        <span class="info-label">Employee Name:</span>
        <span class="info-val">${slip.employeeName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Employee ID:</span>
        <span class="info-val">${slip.employeeNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Department:</span>
        <span class="info-val">${slip.departmentName || "N/A"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Designation:</span>
        <span class="info-val">${slip.jobTitle || "N/A"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Contract / Wage:</span>
        <span class="info-val">${slip.contractNumber} (₹${slip.contractWage.toLocaleString("en-IN")})</span>
      </div>
      <div class="info-row">
        <span class="info-label">Salary Structure:</span>
        <span class="info-val">${slip.salaryStructureName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Bank Account:</span>
        <span class="info-val">${slip.bankAccountNumber ? `${slip.bankName || "Bank"}: ${slip.bankAccountNumber}` : "Not Configured"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Attendance:</span>
        <span class="info-val">${slip.workedDays} Days (${slip.workedHours} Hours)</span>
      </div>
    </div>

    <table class="breakdown-table">
      <thead>
        <tr>
          <th style="width: 15%;">Rule Code</th>
          <th style="width: 45%;">Description</th>
          <th style="width: 15%;">Category</th>
          <th style="width: 10%; text-align: center;">Rate / Qty</th>
          <th style="width: 15%; text-align: right;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${slip.lines
          .map(
            (line) => `
          <tr>
            <td style="font-family: monospace; font-size: 11px; color: #64748b;">${line.ruleCode}</td>
            <td style="font-weight: 500;">${line.ruleName}</td>
            <td style="font-size: 11px; text-transform: capitalize; color: #64748b;">${line.category}</td>
            <td style="text-align: center; color: #64748b; font-size: 11px;">${line.rate ? `${line.rate}%` : line.quantity ? `${line.quantity}x` : "-"}</td>
            <td class="amount-col" style="color: ${["deduction", "contribution"].includes(line.category) ? "#dc2626" : "#0f172a"};">
              ${["deduction", "contribution"].includes(line.category) ? "-" : ""}₹${line.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>

    <div class="totals-card">
      <div>
        <div style="display: flex; gap: 24px; font-size: 13px;">
          <div><span style="color: #64748b;">Gross Earnings:</span> <strong>₹${slip.grossAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></div>
          <div><span style="color: #64748b;">Total Deductions:</span> <strong style="color: #dc2626;">-₹${slip.deductionAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></div>
        </div>
      </div>
      <div style="text-align: right;">
        <div class="net-label">Net Take Home Pay</div>
        <div class="net-amount">₹${slip.netAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
      </div>
    </div>

    <div class="footer-signatures">
      <div class="signature-line">Employer / Authorized Signature</div>
      <div class="signature-line">Employee Signature & Date</div>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================================
// 10. PAYROLL DASHBOARD AGGREGATIONS
// ============================================================================
export async function getPayrollDashboardMetrics(filters?: {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  employeeType?: string;
}): Promise<PayrollDashboardData> {
  const payslipConditions = [];

  if (filters?.departmentId && filters.departmentId !== "all") {
    payslipConditions.push(eq(employees.departmentId, filters.departmentId));
  }

  if (filters?.employeeType && filters.employeeType !== "all") {
    payslipConditions.push(eq(employees.employeeType, filters.employeeType as any));
  }

  if (filters?.startDate) {
    payslipConditions.push(sql`${payslips.periodStart} >= ${filters.startDate}`);
  }
  if (filters?.endDate) {
    payslipConditions.push(sql`${payslips.periodEnd} <= ${filters.endDate}`);
  }

  // 1. KPI Totals
  const [kpiRes] = await db
    .select({
      totalNetPaid: sql<number>`coalesce(sum(case when ${payslips.status} = 'paid' then ${payslips.netAmount} end), 0)::float`,
      payslipsGenerated: sql<number>`count(${payslips.id})::int`,
      averageSalary: sql<number>`coalesce(avg(${payslips.netAmount}), 0)::float`,
    })
    .from(payslips)
    .leftJoin(employees, eq(payslips.employeeId, employees.id))
    .where(payslipConditions.length > 0 ? and(...payslipConditions) : undefined);

  // Count draft payruns
  const [draftRuns] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(payruns)
    .where(or(eq(payruns.status, "draft"), eq(payruns.status, "computed")));

  // 2. Department Costs breakdown
  const deptCosts = await db
    .select({
      departmentId: departments.id,
      departmentName: departments.name,
      headcount: sql<number>`count(distinct ${employees.id})::int`,
      payslipCount: sql<number>`count(distinct ${payslips.id})::int`,
      grossTotal: sql<number>`coalesce(sum(${payslips.grossAmount}), 0)::float`,
      deductionTotal: sql<number>`coalesce(sum(${payslips.deductionAmount}), 0)::float`,
      netTotal: sql<number>`coalesce(sum(${payslips.netAmount}), 0)::float`,
    })
    .from(departments)
    .leftJoin(employees, eq(departments.id, employees.departmentId))
    .leftJoin(payslips, eq(employees.id, payslips.employeeId))
    .where(payslipConditions.length > 0 ? and(...payslipConditions) : undefined)
    .groupBy(departments.id)
    .orderBy(desc(sql`coalesce(sum(${payslips.netAmount}), 0)`));

  // 3. Monthly Trends (most recent 6 months, chronological)
  const monthlyTrendsRaw = await db
    .select({
      month: sql<string>`to_char(${payruns.periodStart}, 'Mon YYYY')`,
      sortKey: sql<string>`to_char(${payruns.periodStart}, 'YYYY-MM')`,
      gross: sql<number>`coalesce(sum(${payslips.grossAmount}), 0)::float`,
      net: sql<number>`coalesce(sum(${payslips.netAmount}), 0)::float`,
      deductions: sql<number>`coalesce(sum(${payslips.deductionAmount}), 0)::float`,
      payslipCount: sql<number>`count(distinct ${payslips.id})::int`,
    })
    .from(payruns)
    .leftJoin(payslips, eq(payruns.id, payslips.payrunId))
    .groupBy(sql`to_char(${payruns.periodStart}, 'Mon YYYY')`, sql`to_char(${payruns.periodStart}, 'YYYY-MM')`)
    .orderBy(desc(sql`to_char(${payruns.periodStart}, 'YYYY-MM')`))
    .limit(6);

  const sortedTrends = [...monthlyTrendsRaw].reverse();

  // 4. Operational Alerts
  const alerts: PayrollDashboardData["operationalAlerts"] = [];

  // Alerts for pending payruns
  const pendingRuns = await db
    .select()
    .from(payruns)
    .where(or(eq(payruns.status, "draft"), eq(payruns.status, "computed")))
    .limit(3);

  for (const r of pendingRuns) {
    alerts.push({
      id: `payrun-${r.id}`,
      type: "payrun",
      title: `Payrun Awaiting Action: ${r.name}`,
      description: `Status is currently '${r.status}'. Review computation and validate before disbursement.`,
      severity: r.status === "computed" ? "warning" : "info",
      link: `/payroll/payruns/${r.id}`,
    });
  }

  // Employees missing bank account
  const [missingBankCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(employees)
    .where(and(eq(employees.status, "active"), isNull(employees.bankAccountNumber)));

  if (missingBankCount && missingBankCount.count > 0) {
    alerts.push({
      id: "missing-bank",
      type: "bank",
      title: `${missingBankCount.count} Active Employee(s) Missing Bank Details`,
      description: "Direct bank transfer will fail for employees without configured account numbers.",
      severity: "warning",
      link: "/employees",
    });
  }

  // 5. Attendance & Leave stats
  const [attRes] = await db
    .select({
      totalChecks: sql<number>`count(*)::int`,
      presentChecks: sql<number>`count(case when ${attendance.status} = 'present' or ${attendance.status} = 'overtime' then 1 end)::int`,
      lateChecks: sql<number>`count(case when ${attendance.status} = 'late' then 1 end)::int`,
      absentChecks: sql<number>`count(case when ${attendance.status} = 'absent' then 1 end)::int`,
      overtimeMins: sql<number>`coalesce(sum(${attendance.overtimeMinutes}), 0)::int`,
    })
    .from(attendance);

  const [leaveRes] = await db
    .select({
      approvedDays: sql<number>`coalesce(sum(case when ${timeOffRequests.status} = 'approved' then ${timeOffRequests.duration} end), 0)::float`,
      pendingCount: sql<number>`count(case when ${timeOffRequests.status} = 'pending' then 1 end)::int`,
    })
    .from(timeOffRequests);

  const totalChecks = attRes?.totalChecks || 0;
  const presentChecks = attRes?.presentChecks || 0;
  const lateChecks = attRes?.lateChecks || 0;
  const absentChecks = attRes?.absentChecks || 0;
  const coverageRate = totalChecks > 0 ? Math.min(100, Math.round((presentChecks / totalChecks) * 100)) : 100;

  return {
    kpis: {
      totalNetPaid: Math.round((kpiRes?.totalNetPaid || 0) * 100) / 100,
      payslipsGenerated: kpiRes?.payslipsGenerated || 0,
      averageSalary: Math.round((kpiRes?.averageSalary || 0) * 100) / 100,
      approvedTimeOffDays: leaveRes?.approvedDays || 0,
      attendanceHealthRate: coverageRate,
      draftPayrunsCount: draftRuns?.count || 0,
    },
    departmentCosts: deptCosts.map((d) => ({
      departmentId: d.departmentId,
      departmentName: d.departmentName,
      headcount: d.headcount || 0,
      payslipCount: d.payslipCount || 0,
      grossTotal: Math.round((d.grossTotal || 0) * 100) / 100,
      deductionTotal: Math.round((d.deductionTotal || 0) * 100) / 100,
      netTotal: Math.round((d.netTotal || 0) * 100) / 100,
    })),
    monthlyTrends: sortedTrends.map((m) => ({
      month: m.month,
      gross: Math.round(m.gross * 100) / 100,
      net: Math.round(m.net * 100) / 100,
      deductions: Math.round(m.deductions * 100) / 100,
      payslipCount: m.payslipCount,
    })),
    operationalAlerts: alerts,
    attendanceOverview: {
      presentCount: presentChecks,
      lateCount: lateChecks,
      absentCount: absentChecks,
      overtimeHours: Math.round(((attRes?.overtimeMins || 0) / 60) * 10) / 10,
      coverageRate,
    },
    timeOffOverview: {
      approvedDays: leaveRes?.approvedDays || 0,
      pendingRequestsCount: leaveRes?.pendingCount || 0,
      paidLeaveDays: leaveRes?.approvedDays || 0,
      unpaidLeaveDays: 0,
    },
  };
}
