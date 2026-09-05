import { NextRequest, NextResponse } from "next/server";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { getEligibleEmployeesForPeriod } from "@/features/payroll/services/payroll.service";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("payrun", "create", request.headers);

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || searchParams.get("periodStart");
    const endDate = searchParams.get("endDate") || searchParams.get("periodEnd");
    const structureId =
      searchParams.get("structureId") ||
      searchParams.get("salaryStructureId") ||
      undefined;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Both startDate and endDate are required query parameters" },
        { status: 400 }
      );
    }

    const employees = await getEligibleEmployeesForPeriod(
      startDate,
      endDate,
      structureId
    );

    return NextResponse.json({ data: employees });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to fetch eligible employees" },
      { status }
    );
  }
}
