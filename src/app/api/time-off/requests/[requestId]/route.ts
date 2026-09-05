import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { timeOffRequests, timeOffTypes, employees, timeOffAllocations, users } from "@/db/schema";
import { requireAuth, requirePermission, AuthorizationError, getCurrentEmployee } from "@/lib/auth/authorization";
import { normalizeRole, hasPermission } from "@/lib/auth/permissions";
import { transitionLeave } from "@/server/services/time-off/approval";
import { calendarDays } from "@/server/domain/hr";
import { eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

const approverUsers = alias(users, "approver_users");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await requireAuth(request.headers);
    const { requestId } = await params;
    const role = normalizeRole((session.user as { role?: string })?.role);
    const currentEmp = await getCurrentEmployee(session.user.id);

    const [reqItem] = await db
      .select({
        id: timeOffRequests.id,
        employeeId: timeOffRequests.employeeId,
        employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`.as("employee_name"),
        employeeNumber: employees.employeeNumber,
        timeOffTypeId: timeOffRequests.timeOffTypeId,
        timeOffTypeName: timeOffTypes.name,
        allocationId: timeOffRequests.allocationId,
        startDate: timeOffRequests.startDate,
        endDate: timeOffRequests.endDate,
        duration: timeOffRequests.duration,
        reason: timeOffRequests.reason,
        status: timeOffRequests.status,
        approvedBy: timeOffRequests.approvedBy,
        approverName: approverUsers.name,
        approvedAt: timeOffRequests.approvedAt,
        refusalReason: timeOffRequests.refusalReason,
        createdAt: timeOffRequests.createdAt,
        updatedAt: timeOffRequests.updatedAt,
      })
      .from(timeOffRequests)
      .leftJoin(employees, eq(timeOffRequests.employeeId, employees.id))
      .leftJoin(timeOffTypes, eq(timeOffRequests.timeOffTypeId, timeOffTypes.id))
      .leftJoin(approverUsers, eq(timeOffRequests.approvedBy, approverUsers.id))
      .where(eq(timeOffRequests.id, requestId))
      .limit(1);

    if (!reqItem) {
      return NextResponse.json({ error: "Time-off request not found" }, { status: 404 });
    }

    if (role === "employee" && (!currentEmp || currentEmp.id !== reqItem.employeeId)) {
      return NextResponse.json({ error: "Forbidden: You cannot view other employees' requests" }, { status: 403 });
    }

    return NextResponse.json({ data: reqItem });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json({ error: error.message || "Failed to fetch time-off request" }, { status: errorStatus });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await requireAuth(request.headers);
    const { requestId } = await params;
    const body = await request.json();

    const [existing] = await db.select().from(timeOffRequests).where(eq(timeOffRequests.id, requestId)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Time-off request not found" }, { status: 404 });
    }

    if (existing.status !== "draft" && existing.status !== "pending") {
      return NextResponse.json({ error: `Cannot modify a request with status '${existing.status}'` }, { status: 409 });
    }

    const startDate = body.startDate || existing.startDate;
    const endDate = body.endDate || existing.endDate;
    const duration = calendarDays(startDate, endDate);

    const [updated] = await db
      .update(timeOffRequests)
      .set({
        timeOffTypeId: body.timeOffTypeId !== undefined ? body.timeOffTypeId : undefined,
        startDate,
        endDate,
        duration: String(duration),
        reason: body.reason !== undefined ? body.reason : undefined,
        updatedAt: new Date(),
      })
      .where(eq(timeOffRequests.id, requestId))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json({ error: error.message || "Failed to update time-off request" }, { status: errorStatus });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await requireAuth(request.headers);
    const { requestId } = await params;
    const role = normalizeRole((session.user as { role?: string })?.role);
    const currentEmp = await getCurrentEmployee(session.user.id);

    const [existing] = await db.select().from(timeOffRequests).where(eq(timeOffRequests.id, requestId)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Time-off request not found" }, { status: 404 });
    }

    const isSelf = currentEmp && currentEmp.id === existing.employeeId;
    if (isSelf && hasPermission(role, "timeOffRequest", "cancel-self")) {
      await transitionLeave(requestId, "cancelled", session.user.id);
      return NextResponse.json({ message: "Time-off request cancelled successfully" });
    }

    if (hasPermission(role, "timeOffRequest", "delete")) {
      await transitionLeave(requestId, "cancelled", session.user.id);
      return NextResponse.json({ message: "Time-off request cancelled successfully" });
    }

    throw new AuthorizationError("Forbidden: Cannot cancel this request", 403);
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json({ error: error.message || "Failed to cancel request" }, { status: errorStatus });
  }
}
