import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, getCurrentEmployee, AuthorizationError } from "@/lib/auth/authorization";
import { normalizeRole, hasPermission } from "@/lib/auth/permissions";
import { getEmployeeTimeOffBalance } from "@/server/services/time-off";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request.headers);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = normalizeRole((session.user as { role?: string })?.role);
    const currentEmployee = await getCurrentEmployee(session.user.id);

    const { searchParams } = new URL(request.url);
    const requestedEmpId = searchParams.get("employeeId");
    const timeOffTypeId = searchParams.get("timeOffTypeId") || undefined;
    const asOfDate = searchParams.get("date") || new Date().toISOString().slice(0, 10);

    let targetEmployeeId = requestedEmpId;

    if (role === "employee" || !targetEmployeeId || targetEmployeeId === "me") {
      if (!currentEmployee) {
        return NextResponse.json({
          data: {
            employeeId: null,
            asOfDate,
            totalAllocated: 0,
            totalTaken: 0,
            totalRemaining: 0,
            leaveTypes: [],
          },
        });
      }
      targetEmployeeId = currentEmployee.id;
    } else {
      // Accessing someone else's balances requires read permission
      if (!hasPermission(role, "timeOffAllocation", "read") && !hasPermission(role, "timeOffRequest", "read")) {
        throw new AuthorizationError("Forbidden: Cannot view other employees leave balances", 403);
      }
    }

    const summary = await getEmployeeTimeOffBalance(targetEmployeeId, timeOffTypeId, asOfDate);

    return NextResponse.json({ data: summary });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to fetch time-off balances" },
      { status }
    );
  }
}
