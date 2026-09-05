import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { timeOffAllocations, timeOffTypes, employees, timeOffRequests } from "@/db/schema";
import { requireAuth, getAuthSession, getCurrentEmployee, AuthorizationError } from "@/lib/auth/authorization";
import { eq, sql, desc, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request.headers);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");

    const userRole = (session.user as { role?: string })?.role;
    const currentEmp = await getCurrentEmployee(session.user.id);

    const conditions = [];
    if (userRole === "employee" || (!["admin", "hr_manager", "payroll_manager", "payroll_user"].includes(userRole || ""))) {
      if (currentEmp) {
        conditions.push(eq(timeOffAllocations.employeeId, currentEmp.id));
      } else {
        return NextResponse.json({ data: [] });
      }
    } else if (employeeId && employeeId !== "all") {
      conditions.push(eq(timeOffAllocations.employeeId, employeeId));
    }

    const allocations = await db
      .select({
        id: timeOffAllocations.id,
        employeeId: timeOffAllocations.employeeId,
        employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`.as("employee_name"),
        timeOffTypeId: timeOffAllocations.timeOffTypeId,
        timeOffTypeName: timeOffTypes.name,
        allocatedAmount: timeOffAllocations.allocatedAmount,
        validFrom: timeOffAllocations.validFrom,
        validTo: timeOffAllocations.validTo,
        status: timeOffAllocations.status,
        approvedBy: timeOffAllocations.approvedBy,
        createdAt: timeOffAllocations.createdAt,
      })
      .from(timeOffAllocations)
      .leftJoin(employees, eq(timeOffAllocations.employeeId, employees.id))
      .leftJoin(timeOffTypes, eq(timeOffAllocations.timeOffTypeId, timeOffTypes.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(timeOffAllocations.createdAt));

    // Calculate taken days for each allocation from approved requests
    const approvedRequests = await db
      .select({
        employeeId: timeOffRequests.employeeId,
        timeOffTypeId: timeOffRequests.timeOffTypeId,
        durationSum: sql<number>`COALESCE(SUM(${timeOffRequests.duration}::numeric), 0)`,
      })
      .from(timeOffRequests)
      .where(eq(timeOffRequests.status, "approved"))
      .groupBy(timeOffRequests.employeeId, timeOffRequests.timeOffTypeId);

    const takenMap = new Map<string, number>();
    approvedRequests.forEach((req) => {
      takenMap.set(`${req.employeeId}_${req.timeOffTypeId}`, Number(req.durationSum) || 0);
    });

    const dataWithTaken = allocations.map((alloc) => {
      const taken = takenMap.get(`${alloc.employeeId}_${alloc.timeOffTypeId}`) || 0;
      const allocated = Number(alloc.allocatedAmount) || 0;
      const remaining = Math.max(0, allocated - taken);

      return {
        ...alloc,
        allocated: allocated,
        taken: taken,
        remaining: remaining,
      };
    });

    return NextResponse.json({ data: dataWithTaken });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to fetch allocations" },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request.headers);
    const body = await request.json();

    if (!body.employeeId || !body.timeOffTypeId || !body.allocatedAmount) {
      return NextResponse.json(
        { error: "Employee, time off type, and allocated amount are required" },
        { status: 400 }
      );
    }

    const [newAlloc] = await db
      .insert(timeOffAllocations)
      .values({
        employeeId: body.employeeId,
        timeOffTypeId: body.timeOffTypeId,
        allocatedAmount: String(body.allocatedAmount),
        validFrom: body.validFrom || new Date().toISOString().split("T")[0],
        validTo: body.validTo || null,
        status: body.status || "approved",
        approvedBy: session.user.id,
        approvedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ data: newAlloc }, { status: 201 });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to create allocation" },
      { status }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuth(request.headers);
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "Allocation ID is required" }, { status: 400 });
    }

    const [updated] = await db
      .update(timeOffAllocations)
      .set({
        allocatedAmount: body.allocatedAmount !== undefined ? String(body.allocatedAmount) : undefined,
        status: body.status !== undefined ? body.status : undefined,
        validFrom: body.validFrom !== undefined ? body.validFrom : undefined,
        validTo: body.validTo !== undefined ? body.validTo : undefined,
      })
      .where(eq(timeOffAllocations.id, body.id))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to update allocation" },
      { status }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAuth(request.headers);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Allocation ID is required" }, { status: 400 });
    }

    await db.delete(timeOffAllocations).where(eq(timeOffAllocations.id, id));
    return NextResponse.json({ message: "Allocation deleted successfully" });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to delete allocation" },
      { status }
    );
  }
}

