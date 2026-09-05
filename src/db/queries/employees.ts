import { db } from "../index";
import { employees, employeeHistory, type NewEmployee, type NewEmployeeHistory } from "../schema";
import { eq } from "drizzle-orm";

export async function getEmployees() {
  return await db.query.employees.findMany({
    with: {
      department: true,
      jobPosition: true,
      workingSchedule: true,
      manager: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getEmployeeById(id: string) {
  return await db.query.employees.findFirst({
    where: { id },
    with: {
      department: true,
      jobPosition: true,
      workingSchedule: true,
      manager: true,
      contracts: true,
      history: {
        orderBy: { effectiveDate: "desc" },
      },
    },
  });
}

export async function getEmployeeByUserId(userId: string) {
  return await db.query.employees.findFirst({
    where: { userId },
    with: {
      department: true,
      jobPosition: true,
      workingSchedule: true,
      manager: true,
    },
  });
}

export async function createEmployee(data: NewEmployee) {
  const [created] = await db.insert(employees).values(data).returning();
  return created;
}

export async function updateEmployee(id: string, data: Partial<NewEmployee>) {
  const [updated] = await db
    .update(employees)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(employees.id, id))
    .returning();
  return updated;
}

export async function logEmployeeHistory(data: NewEmployeeHistory) {
  const [created] = await db.insert(employeeHistory).values(data).returning();
  return created;
}
