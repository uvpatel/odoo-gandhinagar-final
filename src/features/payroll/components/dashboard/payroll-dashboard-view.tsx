"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { type PayrollDashboardData } from "../../types";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
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
  AlertTriangleIcon,
  PlusIcon,
  ArrowRightIcon,
  TrendingUpIcon,
  CheckCircle2Icon,
  FileTextIcon,
  Loader2Icon,
  ReceiptIcon,
  ExternalLinkIcon,
  BriefcaseIcon,
} from "lucide-react";
import { cn } from "cn";

const deptChartConfig: ChartConfig = {
  gross: {
    label: "Gross Salary",
    color: "var(--primary)",
  },
  net: {
    label: "Net Salary",
    color: "#16a34a",
  },
};

const trendChartConfig: ChartConfig = {
  gross: {
    label: "Gross",
    color: "#3b82f6",
  },
  net: {
    label: "Net Pay",
    color: "#10b981",
  },
  deductions: {
    label: "Deductions",
    color: "#ef4444",
  },
};

export function PayrollDashboardView() {
  const [departmentId, setDepartmentId] = useState<string>("all");
  const [employeeType, setEmployeeType] = useState<string>("all");
  const [periodPreset, setPeriodPreset] = useState<string>("all");

  // Fetch departments list
  const { data: deptsData } = useQuery<{ data: Array<{ id: string; name: string }> }>({
    queryKey: ["departments-list"],
    queryFn: async () => {
      const res = await fetch("/api/departments");
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });
  const departments = deptsData?.data || [];

  // Fetch dashboard metrics
  const { data, isLoading, error } = useQuery<{ data: PayrollDashboardData }>({
    queryKey: ["payroll-dashboard-metrics", departmentId, employeeType, periodPreset],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (departmentId !== "all") params.set("departmentId", departmentId);
      if (employeeType !== "all") params.set("employeeType", employeeType);

      if (periodPreset === "this_month") {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
        params.set("startDate", firstDay);
        params.set("endDate", lastDay);
      } else if (periodPreset === "last_3_months") {
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 10);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
        params.set("startDate", threeMonthsAgo);
        params.set("endDate", lastDay);
      }

      const res = await fetch(`/api/payroll/dashboard?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load dashboard metrics");
      }
      return res.json();
    },
  });

  const metrics = data?.data;

  if (isLoading) {
    return (
      <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
        <Loader2Icon className="size-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Aggregating live payroll metrics, attendance and ledger totals...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-8 text-center">
        <Card className="max-w-md mx-auto border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Dashboard Unavailable</CardTitle>
            <CardDescription>
              {(error as any)?.message || "Failed to load payroll aggregations."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { kpis, departmentCosts, monthlyTrends, operationalAlerts, attendanceOverview, timeOffOverview } = metrics;

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll Operations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time compensation analytics, payrun workflows, and statutory compliance summary.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Select
            value={departmentId}
            onValueChange={(val) => setDepartmentId(val ?? "all")}
          >
            <SelectTrigger className="h-8 text-xs w-36">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={employeeType}
            onValueChange={(val) => setEmployeeType(val ?? "all")}
          >
            <SelectTrigger className="h-8 text-xs w-32">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="full_time">Full-Time</SelectItem>
              <SelectItem value="part_time">Part-Time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="intern">Intern</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={periodPreset}
            onValueChange={(val) => setPeriodPreset(val ?? "all")}
          >
            <SelectTrigger className="h-8 text-xs w-32">
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
            </SelectContent>
          </Select>

          <Link
            href="/payroll/payruns/new"
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-1.5 shadow-xs")}
          >
            <PlusIcon className="size-3.5" />
            <span>New Payrun</span>
          </Link>

          <Link
            href="/payroll/payruns"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <ReceiptIcon className="size-3.5" />
            <span>Payruns</span>
          </Link>

          <Link
            href="/payroll/payslips"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <FileTextIcon className="size-3.5" />
            <span>Payslips</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Net Disbursed
            </CardTitle>
            <DollarSignIcon className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">
              ₹{kpis.totalNetPaid.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <CheckCircle2Icon className="size-3 text-emerald-500" />
              <span>Paid status</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Generated Payslips
            </CardTitle>
            <FileTextIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{kpis.payslipsGenerated}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Across all payruns</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Average Net Salary
            </CardTitle>
            <TrendingUpIcon className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              ₹{kpis.averageSalary.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Per active employee</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Approved Time Off
            </CardTitle>
            <CalendarCheckIcon className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{kpis.approvedTimeOffDays} Days</div>
            <p className="text-[11px] text-muted-foreground mt-1">Paid leave utilized</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Attendance Health
            </CardTitle>
            <ClockIcon className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {kpis.attendanceHealthRate}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Punctual coverage rate</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Draft Payruns
            </CardTitle>
            <AlertTriangleIcon className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {kpis.draftPayrunsCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Pending validation</p>
          </CardContent>
        </Card>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Department Cost Distribution */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2Icon className="size-4 text-primary" />
              <span>Department Salary Costs (Gross vs Net)</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Direct compensation expense distribution by organization division.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {departmentCosts.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
                No department data available
              </div>
            ) : (
              <div className="h-64 w-full">
                <ChartContainer config={deptChartConfig} className="h-64 w-full">
                  <BarChart data={departmentCosts} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis
                      dataKey="departmentName"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={11}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                      fontSize={11}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="grossTotal" name="Gross" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="netTotal" name="Net Pay" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Monthly Trends */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUpIcon className="size-4 text-emerald-500" />
              <span>Monthly Salary Disbursement Trend</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Historic Gross, Net, and statutory deductions over the past payroll cycles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyTrends.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
                No historical trend data available
              </div>
            ) : (
              <div className="h-64 w-full">
                <ChartContainer config={trendChartConfig} className="h-64 w-full">
                  <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={11}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                      fontSize={11}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="gross"
                      name="Gross"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.15}
                    />
                    <Area
                      type="monotone"
                      dataKey="net"
                      name="Net Pay"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.25}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Operational Alerts & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Operational Alerts & Attendance Health */}
        <div className="space-y-6">
          {/* Operational Alerts */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangleIcon className="size-4 text-amber-500" />
                <span>Operational Alerts ({operationalAlerts.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {operationalAlerts.length === 0 ? (
                <p className="text-xs text-muted-foreground">Zero operational payroll warnings detected.</p>
              ) : (
                operationalAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-lg border bg-muted/30 flex flex-col gap-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{alert.title}</span>
                      <Badge
                        variant={alert.severity === "error" ? "destructive" : "outline"}
                        className={cn(
                          "text-[10px]",
                          alert.severity === "warning" && "border-amber-500 text-amber-600"
                        )}
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-[11px]">{alert.description}</p>
                    <Link
                      href={alert.link}
                      className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1 mt-1"
                    >
                      <span>Action item</span>
                      <ExternalLinkIcon className="size-2.5" />
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Attendance & Leave Quick Overview */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ClockIcon className="size-4 text-primary" />
                <span>Attendance & Leave Impact</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-muted-foreground">Present Days Tracked:</span>
                <span className="font-medium">{attendanceOverview.presentCount} records</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-muted-foreground">Late Check-ins:</span>
                <span className="font-medium text-amber-600">{attendanceOverview.lateCount} occurrences</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-muted-foreground">Overtime Accrued:</span>
                <span className="font-mono font-medium">{attendanceOverview.overtimeHours} Hours</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-muted-foreground">Paid Leave Days:</span>
                <span className="font-medium">{timeOffOverview.paidLeaveDays} Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending Leave Requests:</span>
                <span className="font-medium text-primary">{timeOffOverview.pendingRequestsCount} Pending</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Department Cost Breakdown Table */}
        <div className="lg:col-span-2">
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Department Compensation Breakdown</CardTitle>
                  <CardDescription className="text-xs">
                    Aggregated headcount, gross wages, and net payroll totals.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-center">Headcount</TableHead>
                      <TableHead className="text-center">Payslips</TableHead>
                      <TableHead className="text-right">Gross Total</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">Net Disbursement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departmentCosts.map((dept) => (
                      <TableRow key={dept.departmentId} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-xs">
                          {dept.departmentName}
                        </TableCell>
                        <TableCell className="text-center text-xs font-mono">
                          {dept.headcount}
                        </TableCell>
                        <TableCell className="text-center text-xs font-mono">
                          {dept.payslipCount}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          ₹{dept.grossTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-destructive">
                          -₹{dept.deductionTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          ₹{dept.netTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
