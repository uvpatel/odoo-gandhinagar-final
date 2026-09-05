import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { timeOffRequests, timeOffTypes, employees } from "@/db/schema";
import {
  requireAuth,
  getCurrentEmployee,
  requirePermission,
  AuthorizationError,
} from "@/lib/auth/authorization";
import { normalizeRole, hasPermission } from "@/lib/auth/permissions";
import { sql, eq, desc, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request.headers);
    const role = normalizeRole((session.user as { role?: string })?.role);
    const currentEmployee = await getCurrentEmployee(session.user.id);

    const { searchParams } = new URL(request.url);
    const isSelfOnly = searchParams.get("self") === "true" || role === "employee";

    if (isSelfOnly) {
      if (!currentEmployee) {
        return NextResponse.json({ data: [] });
      }
      if (!hasPermission(role, "timeOffRequest", "read-self")) {
        throw new AuthorizationError("Forbidden: Cannot read personal time off records", 403);
      }

      const requests = await db
        .select({
          id: timeOffRequests.id,
          employeeId: timeOffRequests.employeeId,
          employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`.as("employee_name"),
          timeOffTypeId: timeOffRequests.timeOffTypeId,
          timeOffTypeName: timeOffTypes.name,
          startDate: timeOffRequests.startDate,
          endDate: timeOffRequests.endDate,
          duration: timeOffRequests.duration,
          reason: timeOffRequests.reason,
          status: timeOffRequests.status,
          refusalReason: timeOffRequests.refusalReason,
          createdAt: timeOffRequests.createdAt,
        })
        .from(timeOffRequests)
        .innerJoin(employees, eq(timeOffRequests.employeeId, employees.id))
        .innerJoin(timeOffTypes, eq(timeOffRequests.timeOffTypeId, timeOffTypes.id))
        .where(eq(timeOffRequests.employeeId, currentEmployee.id))
        .orderBy(desc(timeOffRequests.createdAt));

      return NextResponse.json({ data: requests });
    }

    // Organization-wide list
    if (!hasPermission(role, "timeOffRequest", "read")) {
      throw new AuthorizationError("Forbidden: Cannot read organization time off records", 403);
    }

    const requests = await db
      .select({
        id: timeOffRequests.id,
        employeeId: timeOffRequests.employeeId,
        employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`.as("employee_name"),
        timeOffTypeId: timeOffRequests.timeOffTypeId,
        timeOffTypeName: timeOffTypes.name,
        startDate: timeOffRequests.startDate,
        endDate: timeOffRequests.endDate,
        duration: timeOffRequests.duration,
        reason: timeOffRequests.reason,
        status: timeOffRequests.status,
        refusalReason: timeOffRequests.refusalReason,
        createdAt: timeOffRequests.createdAt,
      })
      .from(timeOffRequests)
      .innerJoin(employees, eq(timeOffRequests.employeeId, employees.id))
      .innerJoin(timeOffTypes, eq(timeOffRequests.timeOffTypeId, timeOffTypes.id))
      .orderBy(desc(timeOffRequests.createdAt));

    return NextResponse.json({ data: requests });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to fetch time-off requests" },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request.headers);
    const role = normalizeRole((session.user as { role?: string })?.role);
    const currentEmployee = await getCurrentEmployee(session.user.id);
    const body = await request.json();

    let targetEmployeeId = body.employeeId;

    if (role === "employee" || !targetEmployeeId) {
      if (!currentEmployee) {
        return NextResponse.json(
          { error: "No employee profile linked to user account" },
          { status: 400 }
        );
      }
      if (!hasPermission(role, "timeOffRequest", "create-self")) {
        throw new AuthorizationError("Forbidden: Cannot submit time-off requests", 403);
      }
      targetEmployeeId = currentEmployee.id;
    } else {
      if (!hasPermission(role, "timeOffRequest", "create")) {
        throw new AuthorizationError("Forbidden: Cannot submit time-off requests for employees", 403);
      }
    }

    const [newRequest] = await db
      .insert(timeOffRequests)
      .values({
        employeeId: targetEmployeeId,
        timeOffTypeId: body.timeOffTypeId,
        startDate: body.startDate,
        endDate: body.endDate,
        duration: String(body.duration || 1),
        reason: body.reason || null,
        status: "pending",
      })
      .returning();

    return NextResponse.json({ data: newRequest }, { status: 201 });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to submit time-off request" },
      { status }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth(request.headers);
    const role = normalizeRole((session.user as { role?: string })?.role);
    const currentEmployee = await getCurrentEmployee(session.user.id);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing request id" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(timeOffRequests)
      .where(eq(timeOffRequests.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const isSelf = currentEmployee && currentEmployee.id === existing.employeeId;

    if (isSelf && hasPermission(role, "timeOffRequest", "cancel-self")) {
      await db
        .update(timeOffRequests)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(timeOffRequests.id, id));
      return NextResponse.json({ message: "Time-off request cancelled successfully" });
    }

    if (hasPermission(role, "timeOffRequest", "delete")) {
      await db.delete(timeOffRequests).where(eq(timeOffRequests.id, id));
      return NextResponse.json({ message: "Time-off request deleted successfully" });
    }

    throw new AuthorizationError("Forbidden: Insufficient privileges to cancel or delete request", 403);
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to cancel/delete time-off request" },
      { status }
    );
  }
}
