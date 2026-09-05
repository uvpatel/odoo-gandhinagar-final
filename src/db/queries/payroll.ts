import { db } from "../index";
import {
  salaryStructures,
  salaryRules,
  payruns,
  payslips,
  payslipLines,
  payslipWarnings,
  type NewPayrun,
  type NewPayslip,
  type NewPayslipLine,
  type NewPayslipWarning,
} from "../schema";
import { eq } from "drizzle-orm";

export async function getSalaryStructures() {
  return await db.query.salaryStructures.findMany({
    where: {
      isActive: true,
    },
    with: {
      rules: {
        with: {
          rule: true,
        },
        orderBy: { sequence: "asc" },
      },
    },
  });
}

export async function getSalaryStructureById(id: string) {
  return await db.query.salaryStructures.findFirst({
    where: { id },
    with: {
      rules: {
        where: { isActive: true },
        with: {
          rule: true,
        },
        orderBy: { sequence: "asc" },
      },
    },
  });
}

export async function getSalaryRules() {
  return await db.query.salaryRules.findMany({
    where: {
      isActive: true,
    },
    orderBy: { sequence: "asc" },
  });
}

export async function getPayruns() {
  return await db.query.payruns.findMany({
    with: {
      salaryStructure: true,
      creator: true,
      payslips: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPayrunById(id: string) {
  return await db.query.payruns.findFirst({
    where: { id },
    with: {
      salaryStructure: {
        with: {
          rules: {
            with: {
              rule: true,
            },
            orderBy: { sequence: "asc" },
          },
        },
      },
      creator: true,
      payslips: {
        with: {
          employee: {
            with: {
              department: true,
              jobPosition: true,
            },
          },
          contract: true,
          lines: {
            orderBy: { sequence: "asc" },
          },
          warnings: true,
        },
      },
    },
  });
}

export async function getPayslipById(id: string) {
  return await db.query.payslips.findFirst({
    where: { id },
    with: {
      employee: {
        with: {
          department: true,
          jobPosition: true,
          workingSchedule: true,
        },
      },
      contract: true,
      payrun: true,
      salaryStructure: true,
      lines: {
        orderBy: { sequence: "asc" },
      },
      warnings: true,
    },
  });
}

export async function createPayrun(data: NewPayrun) {
  const [created] = await db.insert(payruns).values(data).returning();
  return created;
}

export async function updatePayrun(id: string, data: Partial<NewPayrun>) {
  const [updated] = await db
    .update(payruns)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(payruns.id, id))
    .returning();
  return updated;
}

export async function createPayslip(data: NewPayslip) {
  const [created] = await db.insert(payslips).values(data).returning();
  return created;
}

export async function updatePayslip(id: string, data: Partial<NewPayslip>) {
  const [updated] = await db
    .update(payslips)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(payslips.id, id))
    .returning();
  return updated;
}

export async function deletePayslipLinesAndWarnings(payslipId: string) {
  await db.delete(payslipLines).where(eq(payslipLines.payslipId, payslipId));
  await db.delete(payslipWarnings).where(eq(payslipWarnings.payslipId, payslipId));
}

export async function createPayslipLines(lines: NewPayslipLine[]) {
  if (lines.length === 0) return [];
  return await db.insert(payslipLines).values(lines).returning();
}

export async function createPayslipWarnings(warnings: NewPayslipWarning[]) {
  if (warnings.length === 0) return [];
  return await db.insert(payslipWarnings).values(warnings).returning();
}
