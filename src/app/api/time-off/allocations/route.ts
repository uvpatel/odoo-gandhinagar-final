import { z } from "zod";
import { dateSchema } from "@/server/domain/hr";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { timeOffAllocations, timeOffTypes, employees, timeOffRequests } from "@/db/schema";
import { requirePermission, getAuthSession, getCurrentEmployee, AuthorizationError } from "@/lib/auth/authorization";
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
        allocationId: timeOffRequests.allocationId,
        durationSum: sql<number>`COALESCE(SUM(${timeOffRequests.duration}::numeric), 0)`,
      })
      .from(timeOffRequests)
      .where(eq(timeOffRequests.status, "approved"))
      .groupBy(timeOffRequests.allocationId);

    const takenMap = new Map<string, number>();
    approvedRequests.forEach((req) => {
      takenMap.set(req.allocationId || "", Number(req.durationSum) || 0);
    });

    const today = new Date().toISOString().slice(0, 10);
    const dataWithTaken = allocations.map((alloc) => {
      const taken = takenMap.get(alloc.id) || 0;
      const allocated = Number(alloc.allocatedAmount) || 0;
      const isExpired = alloc.validTo ? alloc.validTo < today : false;
      const isActiveWindow = alloc.validFrom <= today && (!alloc.validTo || alloc.validTo >= today);
      const remaining = alloc.status === "approved" && !isExpired ? Math.max(0, allocated - taken) : 0;

      return {
        ...alloc,
        allocated,
        taken,
        remaining,
        isExpired,
        isActiveWindow,
      };
    });

    return NextResponse.json({ data: dataWithTaken });
  } catch (error: any) {
    const status = error instanceof z.ZodError ? 400 : error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to fetch allocations" },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("timeOffAllocation", "create", request.headers);
    const body = z.object({ id: z.string().uuid().optional(), employeeId: z.string().uuid().optional(), timeOffTypeId: z.string().uuid().optional(), allocatedAmount: z.coerce.number().positive().optional(), validFrom: dateSchema.optional(), validTo: z.union([dateSchema, z.literal(""), z.null()]).optional(), status: z.enum(["draft", "pending", "approved", "refused", "expired"]).optional() }).parse(await request.json());
    if (body.validFrom && body.validTo && body.validTo < body.validFrom) throw new AuthorizationError("Invalid allocation validity period", 400);

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
        status: body.status || "draft",
        approvedBy: body.status === "approved" ? session.user.id : null,
        approvedAt: body.status === "approved" ? new Date() : null,
      })
      .returning();

    return NextResponse.json({ data: newAlloc }, { status: 201 });
  } catch (error: any) {
    const status = error instanceof z.ZodError ? 400 : error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to create allocation" },
      { status }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requirePermission("timeOffAllocation", "update", request.headers);
    const body = z.object({ id: z.string().uuid().optional(), employeeId: z.string().uuid().optional(), timeOffTypeId: z.string().uuid().optional(), allocatedAmount: z.coerce.number().positive().optional(), validFrom: dateSchema.optional(), validTo: z.union([dateSchema, z.literal(""), z.null()]).optional(), status: z.enum(["draft", "pending", "approved", "refused", "expired"]).optional() }).parse(await request.json());
    if (body.validFrom && body.validTo && body.validTo < body.validFrom) throw new AuthorizationError("Invalid allocation validity period", 400);

    if (!body.id) {
      return NextResponse.json({ error: "Allocation ID is required" }, { status: 400 });
    }

    return db.transaction(async (db) => {
      await db.execute(sql`select pg_advisory_xact_lock(360002)`);
      const [existing] = await db.select().from(timeOffAllocations).where(eq(timeOffAllocations.id, body.id!)).for("update");
      if (!existing) throw new AuthorizationError("Allocation not found", 404);
      if (existing.status === "approved") throw new AuthorizationError("Approved allocations are immutable; create a new allocation", 409);
    const [updated] = await db
      .update(timeOffAllocations)
      .set({
        approvedBy: body.status === "approved" ? session.user.id : undefined,
        approvedAt: body.status === "approved" ? new Date() : undefined,
        allocatedAmount: body.allocatedAmount !== undefined ? String(body.allocatedAmount) : undefined,
        status: body.status !== undefined ? body.status : undefined,
        validFrom: body.validFrom !== undefined ? body.validFrom : undefined,
        validTo: body.validTo !== undefined ? body.validTo : undefined,
      })
      .where(eq(timeOffAllocations.id, body.id!))
      .returning();

    return NextResponse.json({ data: updated });
    });
  } catch (error: any) {
    const status = error instanceof z.ZodError ? 400 : error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to update allocation" },
      { status }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission("timeOffAllocation", "delete", request.headers);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Allocation ID is required" }, { status: 400 });
    }

    await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(360002)`);
      const [existing] = await tx.select().from(timeOffAllocations).where(eq(timeOffAllocations.id, id)).for("update");
      if (existing?.status === "approved") throw new AuthorizationError("Approved allocations cannot be deleted", 409);
      await tx.delete(timeOffAllocations).where(eq(timeOffAllocations.id, id));
    });
    return NextResponse.json({ message: "Allocation deleted successfully" });
  } catch (error: any) {
    const status = error instanceof z.ZodError ? 400 : error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to delete allocation" },
      { status }
    );
  }
}

