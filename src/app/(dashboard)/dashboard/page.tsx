"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  DollarSignIcon,
  UsersIcon,
  ClockIcon,
  CalendarCheckIcon,
  Building2Icon,
  PlusIcon,
  ArrowRightIcon,
  TrendingUpIcon,
  CheckCircle2Icon,
  FileTextIcon,
  Loader2Icon,
  ReceiptIcon,
  CalendarIcon,
  AlertCircleIcon,
  BriefcaseIcon,
  RefreshCwIcon,
} from "lucide-react";
import { cn } from "cn";

interface DashboardData {
  overview: {
    totalEmployees: number;
    activeEmployees: number;
    draftEmployees: number;
    activeContracts: number;
    totalDepartments: number;
    pendingLeaveRequests: number;
    pendingCorrections: number;
    draftPayruns: number;
    mtdPayrollDisbursed: number;
    totalPayrollDisbursed: number;
  };
  todayAttendance: {
    date: string;
    present: number;
    late: number;
    absent: number;
    incomplete: number;
    overtime: number;
    onLeave: number;
    punctualityRate: number;
  };
  workforceByDepartment: Array<{
    departmentId: string;
    departmentName: string;
    employeeCount: number;
    activeContracts: number;
    totalMonthlyCost: number;
  }>;
  workforceByStatus: Array<{
    status: string;
    count: number;
  }>;
  recentPayruns: Array<{
    id: string;
    name: string;
    periodStart: string;
    periodEnd: string;
    status: string;
    totalNet: number;
    payslipCount: number;
    createdAt: string;
  }>;
  pendingActions: {
    leaveRequests: Array<{
      id: string;
      employeeName: string;
      leaveType: string;
      startDate: string;
      endDate: string;
      duration: string;
      reason: string | null;
      createdAt: string;
    }>;
    attendanceCorrections: Array<{
      id: string;
      requesterName: string;
      reason: string;
      newCheckIn: string | null;
      newCheckOut: string | null;
      createdAt: string;
    }>;
  };
  monthlyPayrollTrends: Array<{
    month: string;
    gross: number;
    net: number;
    deductions: number;
    payrunCount: number;
  }>;
}

const trendChartConfig: ChartConfig = {
  gross: {
    label: "Gross Salary",
    color: "#3b82f6",
  },
  net: {
    label: "Net Pay",
    color: "#10b981",
  },
};

export default function DashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery<{ data: DashboardData }>({
    queryKey: ["executive-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load executive dashboard");
      }
      return res.json();
    },
    refetchInterval: 60000,
  });

  const metrics = data?.data;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-muted-foreground gap-3">
        <Loader2Icon className="size-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Aggregating live organizational data and analytics...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto">
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center justify-center gap-2">
              <AlertCircleIcon className="size-5" />
              Unable to load Executive Dashboard
            </CardTitle>
            <CardDescription>
              {(error as any)?.message || "An unexpected error occurred while fetching organizational metrics."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
              <RefreshCwIcon className="size-4" /> Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { overview, todayAttendance, workforceByDepartment, recentPayruns, pendingActions, monthlyPayrollTrends } = metrics;
  const totalPending = overview.pendingLeaveRequests + overview.pendingCorrections;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Executive Operations</h1>
            <Badge variant="outline" className="text-xs bg-muted/40 font-mono">
              Live DB
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time organizational telemetry, payroll disbursement health, and approval queues.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 text-xs"
          >
            <RefreshCwIcon className={cn("size-3.5", isFetching && "animate-spin")} />
            <span>Sync</span>
          </Button>

          <Link
            href="/employees"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 text-xs")}
          >
            <UsersIcon className="size-3.5" />
            <span>Employees</span>
          </Link>

          <Link
            href="/payroll/payruns/new"
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-1.5 text-xs shadow-xs")}
          >
            <PlusIcon className="size-3.5" />
            <span>New Payrun</span>
          </Link>

          <Link
            href="/dashboard/analytics"
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "gap-1.5 text-xs")}
          >
            <TrendingUpIcon className="size-3.5" />
            <span>Analytics</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="shadow-xs border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Workforce</CardTitle>
            <UsersIcon className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{overview.totalEmployees}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              <span className="font-semibold text-emerald-600">{overview.activeEmployees}</span> active, {overview.draftEmployees} draft
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active Contracts</CardTitle>
            <BriefcaseIcon className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{overview.activeContracts}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              across {overview.totalDepartments} departments
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Today's Attendance</CardTitle>
            <ClockIcon className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{todayAttendance.present} <span className="text-sm font-normal text-muted-foreground">in</span></div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <span className="font-semibold text-amber-600">{todayAttendance.late}</span> late, {todayAttendance.onLeave} on leave
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Pending Approvals</CardTitle>
            <CalendarCheckIcon className={cn("size-4", totalPending > 0 ? "text-amber-500" : "text-emerald-500")} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{totalPending}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {overview.pendingLeaveRequests} leaves, {overview.pendingCorrections} timesheets
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">MTD Net Disbursed</CardTitle>
            <DollarSignIcon className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">
              ₹{overview.mtdPayrollDisbursed.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <CheckCircle2Icon className="size-3 text-emerald-500" />
              <span>Current month paid</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Disbursed</CardTitle>
            <TrendingUpIcon className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">
              ₹{overview.totalPayrollDisbursed.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {overview.draftPayruns} payrun(s) in review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Operational Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Attendance & Pending Action Items */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Today's Attendance Realtime Bar */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Today's Attendance Snapshot</CardTitle>
                <CardDescription className="text-xs">
                  {todayAttendance.date} • Punctuality rate: {todayAttendance.punctualityRate}%
                </CardDescription>
              </div>
              <Link
                href="/attendance"
                className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
              >
                Attendance Log <ArrowRightIcon className="size-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400">
                    {todayAttendance.present}
                  </div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">
                    Present
                  </div>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="text-lg font-bold font-mono text-amber-700 dark:text-amber-400">
                    {todayAttendance.late}
                  </div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">
                    Late
                  </div>
                </div>
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                  <div className="text-lg font-bold font-mono text-rose-700 dark:text-rose-400">
                    {todayAttendance.absent}
                  </div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">
                    Absent
                  </div>
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="text-lg font-bold font-mono text-blue-700 dark:text-blue-400">
                    {todayAttendance.onLeave}
                  </div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">
                    On Leave
                  </div>
                </div>
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg col-span-2 sm:col-span-1">
                  <div className="text-lg font-bold font-mono text-purple-700 dark:text-purple-400">
                    {todayAttendance.overtime}
                  </div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">
                    Overtime
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Approval Queues */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Pending Approval Queue</CardTitle>
                <CardDescription className="text-xs">
                  Awaiting review from HR or Payroll managers
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/time-off/requests"
                  className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                >
                  All Leaves ({overview.pendingLeaveRequests})
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingActions.leaveRequests.length === 0 && pendingActions.attendanceCorrections.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2 border border-dashed rounded-lg">
                  <CheckCircle2Icon className="size-6 text-emerald-500" />
                  <span>No pending approvals! Everything is up to date.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingActions.leaveRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="size-4 text-blue-500 shrink-0" />
                        <div>
                          <div className="text-xs font-semibold">{req.employeeName}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {req.leaveType} • {req.startDate} to {req.endDate} ({req.duration} days)
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] text-amber-600 bg-amber-500/10 border-amber-500/20">
                          Pending Leave
                        </Badge>
                        <Link
                          href="/time-off/requests"
                          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 text-xs px-2")}
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  ))}

                  {pendingActions.attendanceCorrections.map((corr) => (
                    <div
                      key={corr.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ClockIcon className="size-4 text-purple-500 shrink-0" />
                        <div>
                          <div className="text-xs font-semibold">{corr.requesterName}</div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-xs">
                            Reason: {corr.reason}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] text-purple-600 bg-purple-500/10 border-purple-500/20">
                          Timesheet Correction
                        </Badge>
                        <Link
                          href="/attendance"
                          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 text-xs px-2")}
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Department Breakdown Table */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Department Breakdown</CardTitle>
                <CardDescription className="text-xs">
                  Headcount, active contracts, and committed payroll run-rate
                </CardDescription>
              </div>
              <Link
                href="/reports/departments"
                className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
              >
                Department Report <ArrowRightIcon className="size-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {workforceByDepartment.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No department records found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Headcount</TableHead>
                      <TableHead className="text-right">Active Contracts</TableHead>
                      <TableHead className="text-right">Monthly Run-Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workforceByDepartment.map((dept) => (
                      <TableRow key={dept.departmentId} className="text-xs">
                        <TableCell className="font-medium flex items-center gap-2">
                          <Building2Icon className="size-3.5 text-muted-foreground" />
                          <span>{dept.departmentName}</span>
                        </TableCell>
                        <TableCell className="text-right font-mono">{dept.employeeCount}</TableCell>
                        <TableCell className="text-right font-mono">{dept.activeContracts}</TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          ₹{dept.totalMonthlyCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Payroll Trend & Recent Payruns */}
        <div className="flex flex-col gap-6">
          {/* Payroll Trajectory Chart */}
          <Card className="shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Disbursement Trajectory</CardTitle>
              <CardDescription className="text-xs">
                Historical gross vs net pay trends (last 6 months)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyPayrollTrends.length > 0 ? (
                <ChartContainer config={trendChartConfig} className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyPayrollTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={10} />
                      <YAxis tickLine={false} axisLine={false} fontSize={10} tickFormatter={(val) => `₹${val / 1000}k`} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="gross"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="net"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-44 flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-lg">
                  No historical payslip data available yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payrun Batches */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Recent Payruns</CardTitle>
                <CardDescription className="text-xs">Batches and processing lifecycle</CardDescription>
              </div>
              <Link
                href="/payroll/payruns"
                className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
              >
                All <ArrowRightIcon className="size-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentPayruns.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-lg">
                  No payruns created yet. Click "New Payrun" above to start.
                </p>
              ) : (
                recentPayruns.map((pr) => (
                  <Link
                    key={pr.id}
                    href={`/payroll/payruns/${pr.id}`}
                    className="block p-3 border rounded-lg hover:border-primary/50 hover:bg-muted/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold truncate">{pr.name}</div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] capitalize",
                          pr.status === "paid" && "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
                          pr.status === "validated" && "text-blue-600 bg-blue-500/10 border-blue-500/20",
                          pr.status === "computed" && "text-amber-600 bg-amber-500/10 border-amber-500/20",
                          pr.status === "draft" && "text-slate-600 bg-slate-500/10 border-slate-500/20"
                        )}
                      >
                        {pr.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
                      <span>
                        {pr.periodStart} ~ {pr.periodEnd}
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        ₹{pr.totalNet.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Nav Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/reports/payroll"
              className="p-3 border rounded-lg hover:bg-muted/40 transition-colors flex flex-col justify-between gap-2"
            >
              <ReceiptIcon className="size-4 text-emerald-600" />
              <div>
                <div className="text-xs font-semibold">Payroll Reports</div>
                <div className="text-[10px] text-muted-foreground">Export CSV & Ledgers</div>
              </div>
            </Link>

            <Link
              href="/reports/attendance"
              className="p-3 border rounded-lg hover:bg-muted/40 transition-colors flex flex-col justify-between gap-2"
            >
              <ClockIcon className="size-4 text-blue-600" />
              <div>
                <div className="text-xs font-semibold">Attendance Audit</div>
                <div className="text-[10px] text-muted-foreground">Punctuality & Hours</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
