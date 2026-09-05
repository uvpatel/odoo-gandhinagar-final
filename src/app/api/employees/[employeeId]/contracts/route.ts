import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { contracts, departments, jobPositions, workingSchedules, salaryStructures } from "@/db/schema";
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

    // IDOR protection: standard employee can only view their own contracts
    if (
      userRole === "employee" ||
      !["admin", "hr_manager", "payroll_manager", "payroll_user"].includes(userRole || "")
    ) {
      if (!currentEmp || currentEmp.id !== employeeId) {
        return NextResponse.json(
          { error: "Forbidden: You cannot view other employees' contracts" },
          { status: 403 }
        );
      }
    } else {
      await requirePermission("contract", "read", request.headers);
    }

    const data = await db
      .select({
        id: contracts.id,
        contractNumber: contracts.contractNumber,
        employeeId: contracts.employeeId,
        startDate: contracts.startDate,
        endDate: contracts.endDate,
        wage: contracts.wage,
        currency: contracts.currency,
        status: contracts.status,
        departmentId: contracts.departmentId,
        departmentName: departments.name,
        jobPositionId: contracts.jobPositionId,
        jobTitle: jobPositions.title,
        workingScheduleId: contracts.workingScheduleId,
        workingScheduleName: workingSchedules.name,
        salaryStructureId: contracts.salaryStructureId,
        salaryStructureName: salaryStructures.name,
        createdAt: contracts.createdAt,
      })
      .from(contracts)
      .leftJoin(departments, eq(contracts.departmentId, departments.id))
      .leftJoin(jobPositions, eq(contracts.jobPositionId, jobPositions.id))
      .leftJoin(workingSchedules, eq(contracts.workingScheduleId, workingSchedules.id))
      .leftJoin(salaryStructures, eq(contracts.salaryStructureId, salaryStructures.id))
      .where(eq(contracts.employeeId, employeeId))
      .orderBy(desc(contracts.startDate));

    return NextResponse.json({ data });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to fetch employee contracts" },
      { status: errorStatus }
    );
  }
}

