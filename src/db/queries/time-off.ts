import { type Database } from "@/db";
import { db } from "../index";
import {
  timeOffTypes,
  timeOffAllocations,
  timeOffRequests,
  type NewTimeOffType,
  type NewTimeOffAllocation,
  type NewTimeOffRequest,
} from "../schema";
import { eq } from "drizzle-orm";

export async function getTimeOffTypes() {
  return await db.query.timeOffTypes.findMany({
    where: {
      isActive: true,
    },
  });
}

export async function getAllocationsByEmployee(employeeId: string) {
  return await db.query.timeOffAllocations.findMany({
    where: {
      employeeId,
      status: "approved",
    },
    with: {
      timeOffType: true,
    },
  });
}

export async function getTimeOffRequests() {
  return await db.query.timeOffRequests.findMany({
    with: {
      employee: true,
      timeOffType: true,
      approver: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRequestsByEmployee(employeeId: string) {
  return await db.query.timeOffRequests.findMany({
    where: {
      employeeId,
    },
    with: {
      timeOffType: true,
      approver: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getApprovedLeaveForPeriod(
  employeeId: string,
  periodStart: string,
  periodEnd: string
, database: Database = db) {
  return await database.query.timeOffRequests.findMany({
    where: {
      employeeId,
      status: "approved",
      startDate: { lte: periodEnd },
      endDate: { gte: periodStart },
    },
    with: {
      timeOffType: true,
    },
  });
}

export async function createTimeOffRequest(data: NewTimeOffRequest) {
  const [created] = await db.insert(timeOffRequests).values(data).returning();
  return created;
}

export async function approveTimeOffRequest(
  requestId: string,
  approvedBy: string
) {
  const [updated] = await db
    .update(timeOffRequests)
    .set({
      status: "approved",
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(timeOffRequests.id, requestId))
    .returning();
  return updated;
}

export async function refuseTimeOffRequest(
  requestId: string,
  approvedBy: string,
  refusalReason: string
) {
  const [updated] = await db
    .update(timeOffRequests)
    .set({
      status: "refused",
      approvedBy,
      approvedAt: new Date(),
      refusalReason,
      updatedAt: new Date(),
    })
    .where(eq(timeOffRequests.id, requestId))
    .returning();
  return updated;
}

export async function createAllocation(data: NewTimeOffAllocation) {
  const [created] = await db
    .insert(timeOffAllocations)
    .values(data)
    .returning();
  return created;
}
