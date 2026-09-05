import React from "react";
import { getAuthSession, getCurrentEmployee } from "@/lib/auth/authorization";
import { db } from "@/db/index";
import { payslips, payruns } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileTextIcon, DownloadIcon, CheckCircle2Icon, ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function MyPayslipsPage() {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/signin");
  }

  const employee = await getCurrentEmployee(session.user.id);
  if (!employee) {
    return (
      <div className="p-6">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Employee Record Not Found</CardTitle>
            <CardDescription>
              Your user account ({session.user.email}) is not currently linked to an active employee profile.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Fetch employee's personal payslips with payrun details
  const myPayslips = await db
    .select({
      id: payslips.id,
      payslipNumber: payslips.payslipNumber,
      periodStart: payslips.periodStart,
      periodEnd: payslips.periodEnd,
      workedDays: payslips.workedDays,
      workedHours: payslips.workedHours,
      grossAmount: payslips.grossAmount,
      deductionAmount: payslips.deductionAmount,
      netAmount: payslips.netAmount,
      status: payslips.status,
      payrunName: payruns.name,
    })
    .from(payslips)
    .innerJoin(payruns, eq(payslips.payrunId, payruns.id))
    .where(eq(payslips.employeeId, employee.id))
    .orderBy(desc(payslips.periodStart));

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">My Payslips</h1>
        <p className="text-muted-foreground">
          View and download your monthly salary statements, allowances, and statutory deductions.
        </p>
      </div>

      {myPayslips.length === 0 ? (
        <Card className="border-dashed p-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <FileTextIcon className="size-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No payslips issued yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Your payslips will appear here once monthly payruns are computed and validated.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myPayslips.map((slip) => (
            <Card key={slip.id} className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold">
                    {slip.payrunName}
                  </CardTitle>
                  <CardDescription>
                    {slip.periodStart} to {slip.periodEnd}
                  </CardDescription>
                </div>
                <Badge
                  variant={slip.status === "paid" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {slip.status === "paid" ? (
                    <CheckCircle2Icon className="mr-1 size-3 text-emerald-400" />
                  ) : (
                    <ClockIcon className="mr-1 size-3" />
                  )}
                  {slip.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-muted-foreground">Slip Number</span>
                    <span className="font-mono font-medium">{slip.payslipNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-muted-foreground">Gross Earnings</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      ₹{Number(slip.grossAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-muted-foreground">Total Deductions</span>
                    <span className="font-medium text-destructive">
                      -₹{Number(slip.deductionAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="border-t border-border/50 my-1 pt-2 flex justify-between text-sm font-semibold">
                    <span>Net Take-Home</span>
                    <span className="text-primary">
                      ₹{Number(slip.netAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Worked: {slip.workedDays} Days ({slip.workedHours} Hours)
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  <DownloadIcon className="mr-2 size-4" />
                  Download Statement
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
