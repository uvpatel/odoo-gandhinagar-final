import { db } from "@/db";
import {
  payslips,
  payslipLines,
  payslipWarnings,
  payruns,
  type Payrun,
  type NewPayslipLine,
} from "@/db/schema";
import { resolveContractForPeriod } from "./contract-resolver";
import { executeSalaryEngine, type PayrollContext } from "./salary-engine";
import { validatePayrollEmployee } from "./payroll-validator";
import { getAttendanceByEmployeeAndPeriod } from "@/db/queries/attendance";
import { getApprovedLeaveForPeriod } from "@/db/queries/time-off";
import { getSalaryStructureById } from "@/db/queries/payroll";
import { eq } from "drizzle-orm";

export async function computePayslipForEmployee(
  payrun: Payrun,
  employeeId: string
) {
  const employee = await db.query.employees.findFirst({
    where: { id: employeeId },
  });

  if (!employee) {
    throw new Error(`Employee ${employeeId} not found`);
  }

  const periodStart = payrun.periodStart;
  const periodEnd = payrun.periodEnd;

  const contractResult = await resolveContractForPeriod(
    employeeId,
    periodStart,
    periodEnd
  );

  const contract = contractResult.contract;
  const structureId =
    contract?.salaryStructureId || payrun.salaryStructureId;

  const structure = await getSalaryStructureById(structureId);
  const rules =
    structure?.rules
      ?.map((r) => r.rule)
      .filter((r): r is NonNullable<typeof r> => Boolean(r)) || [];

  const attendances = await getAttendanceByEmployeeAndPeriod(
    employeeId,
    periodStart,
    periodEnd
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

  const approvedLeaves = await getApprovedLeaveForPeriod(
    employeeId,
    periodStart,
    periodEnd
  );

  const paidDays = approvedLeaves
    .filter((l) => l.timeOffType?.isPaid)
    .reduce((sum: number, l) => sum + Number(l.duration), 0);
  const unpaidDays = approvedLeaves
    .filter((l) => !l.timeOffType?.isPaid)
    .reduce((sum: number, l) => sum + Number(l.duration), 0);

  const context: PayrollContext = {
    employee,
    contract: contract || ({} as any),
    period: {
      start: periodStart,
      end: periodEnd,
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
  };

  const computation = contract
    ? executeSalaryEngine(rules, context)
    : null;

  const payslipNumber = `SLIP-${payrun.id.slice(0, 4)}-${employee.employeeNumber}`;

  let existingSlip = await db.query.payslips.findFirst({
    where: {
      payrunId: payrun.id,
      employeeId,
    },
  });

  let payslipId = existingSlip?.id;

  if (existingSlip) {
    await db
      .delete(payslipLines)
      .where(eq(payslipLines.payslipId, existingSlip.id));
    await db
      .delete(payslipWarnings)
      .where(eq(payslipWarnings.payslipId, existingSlip.id));

    const [updated] = await db
      .update(payslips)
      .set({
        contractId: contract?.id || existingSlip.contractId,
        salaryStructureId: structureId,
        workedDays: workedDays.toString(),
        workedHours: workedHours.toString(),
        basicAmount: (computation?.basicAmount ?? 0).toString(),
        grossAmount: (computation?.grossAmount ?? 0).toString(),
        deductionAmount: (computation?.deductionAmount ?? 0).toString(),
        netAmount: (computation?.netAmount ?? 0).toString(),
        status: "computed",
        computedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payslips.id, existingSlip.id))
      .returning();
    payslipId = updated.id;
  } else if (contract) {
    const [created] = await db
      .insert(payslips)
      .values({
        payslipNumber,
        payrunId: payrun.id,
        employeeId,
        contractId: contract.id,
        salaryStructureId: structureId,
        periodStart,
        periodEnd,
        workedDays: workedDays.toString(),
        workedHours: workedHours.toString(),
        basicAmount: (computation?.basicAmount ?? 0).toString(),
        grossAmount: (computation?.grossAmount ?? 0).toString(),
        deductionAmount: (computation?.deductionAmount ?? 0).toString(),
        netAmount: (computation?.netAmount ?? 0).toString(),
        status: "computed",
        computedAt: new Date(),
      })
      .returning();
    payslipId = created.id;
  }

  if (payslipId && computation) {
    const linesToInsert: NewPayslipLine[] = computation.lines.map((line) => ({
      payslipId,
      salaryRuleId: line.salaryRuleId,
      ruleCode: line.ruleCode,
      ruleName: line.ruleName,
      category: line.category,
      sequence: line.sequence,
      amount: line.amount.toString(),
      quantity: line.quantity.toString(),
      rate: line.rate.toString(),
      total: line.total.toString(),
    }));

    if (linesToInsert.length > 0) {
      await db.insert(payslipLines).values(linesToInsert);
    }

    const warnings = validatePayrollEmployee(
      employee,
      contract,
      computation,
      payslipId
    );

    if (warnings.length > 0) {
      await db.insert(payslipWarnings).values(warnings);
    }
  }

  return payslipId;
}

export async function computePayrunBatch(payrunId: string) {
  const payrun = await db.query.payruns.findFirst({
    where: { id: payrunId },
    with: {
      payslips: true,
    },
  });

  if (!payrun) {
    throw new Error(`Payrun ${payrunId} not found`);
  }

  for (const slip of payrun.payslips) {
    await computePayslipForEmployee(payrun, slip.employeeId);
  }

  await db
    .update(payruns)
    .set({
      status: "computed",
      computedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(payruns.id, payrunId));

  return payrunId;
}
