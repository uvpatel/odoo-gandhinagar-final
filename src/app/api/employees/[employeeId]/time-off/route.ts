import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { timeOffRequests, timeOffAllocations, timeOffTypes } from "@/db/schema";
import { requirePermission, AuthorizationError, getAuthSession, getCurrentEmployee } from "@/lib/auth/authorization";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const session = await getAuthSession(request.headers);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { employeeId } = await params;
    const userRole = (session.user as { role?: string })?.role;
    const currentEmp = await getCurrentEmployee(session.user.id);

    // IDOR protection: standard employee can only view their own time-off records
    if (
      userRole === "employee" ||
      !["admin", "hr_manager", "payroll_manager", "payroll_user"].includes(userRole || "")
    ) {
      if (!currentEmp || currentEmp.id !== employeeId) {
        return NextResponse.json(
          { error: "Forbidden: You cannot view other employees' time off" },
          { status: 403 }
        );
      }
    } else {
      await requirePermission("timeOffRequest", "read", request.headers);
    }

    const requests = await db
      .select({
        id: timeOffRequests.id,
        employeeId: timeOffRequests.employeeId,
        timeOffTypeId: timeOffRequests.timeOffTypeId,
        typeName: timeOffTypes.name,
        typeCode: timeOffTypes.code,
        startDate: timeOffRequests.startDate,
        endDate: timeOffRequests.endDate,
        duration: timeOffRequests.duration,
        status: timeOffRequests.status,
        reason: timeOffRequests.reason,
        refusalReason: timeOffRequests.refusalReason,
        createdAt: timeOffRequests.createdAt,
      })
      .from(timeOffRequests)
      .leftJoin(timeOffTypes, eq(timeOffRequests.timeOffTypeId, timeOffTypes.id))
      .where(eq(timeOffRequests.employeeId, employeeId))
      .orderBy(desc(timeOffRequests.startDate));

    const allocations = await db
      .select({
        id: timeOffAllocations.id,
        employeeId: timeOffAllocations.employeeId,
        timeOffTypeId: timeOffAllocations.timeOffTypeId,
        typeName: timeOffTypes.name,
        typeCode: timeOffTypes.code,
        allocatedAmount: timeOffAllocations.allocatedAmount,
        validFrom: timeOffAllocations.validFrom,
        validTo: timeOffAllocations.validTo,
        status: timeOffAllocations.status,
        createdAt: timeOffAllocations.createdAt,
      })
      .from(timeOffAllocations)
      .leftJoin(timeOffTypes, eq(timeOffAllocations.timeOffTypeId, timeOffTypes.id))
      .where(eq(timeOffAllocations.employeeId, employeeId))
      .orderBy(desc(timeOffAllocations.validFrom));

    return NextResponse.json({
      data: {
        requests,
        allocations,
      },
    });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to fetch employee time off" },
      { status: errorStatus }
    );
  }
}

