"use client";

import React, { useState } from "react";
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
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import {
  DollarSignIcon,
  UsersIcon,
  ClockIcon,
  Building2Icon,
  ArrowLeftIcon,
  TrendingUpIcon,
  CheckCircle2Icon,
  Loader2Icon,
  RefreshCwIcon,
  BriefcaseIcon,
  PieChartIcon,
  AlertCircleIcon,
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
  monthlyPayrollTrends: Array<{
    month: string;
    gross: number;
    net: number;
    deductions: number;
    payrunCount: number;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981",
  draft: "#f59e0b",
  inactive: "#64748b",
  terminated: "#ef4444",
};

export default function AnalyticsPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery<{ data: DashboardData }>({
    queryKey: ["executive-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load analytics");
      }
      return res.json();
    },
  });

  const metrics = data?.data;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-muted-foreground gap-3">
        <Loader2Icon className="size-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Computing live organizational telemetry and distributions...</p>
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
              Unable to load Analytics
            </CardTitle>
            <CardDescription>
              {(error as any)?.message || "Failed to aggregate workforce and payroll analytics."}
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

  const { overview, todayAttendance, workforceByDepartment, workforceByStatus, monthlyPayrollTrends } = metrics;

  const totalMonthlyPayrollRunRate = workforceByDepartment.reduce(
    (acc, d) => acc + d.totalMonthlyCost,
    0
  );

  const avgSalary = overview.activeContracts > 0
    ? Math.round(totalMonthlyPayrollRunRate / overview.activeContracts)
    : 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 px-2 gap-1 text-xs text-muted-foreground")}
            >
              <ArrowLeftIcon className="size-3.5" />
              <span>Back</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Workforce & Financial Analytics</h1>
            <Badge variant="outline" className="text-xs font-mono bg-muted/40">
              Live Database
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Cross-departmental telemetry, compensation breakdown, attendance health, and operational overhead.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 text-xs"
          >
            <RefreshCwIcon className={cn("size-3.5", isFetching && "animate-spin")} />
            <span>Refresh Telemetry</span>
          </Button>
          <Link
            href="/reports"
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-1.5 text-xs")}
          >
            <PieChartIcon className="size-3.5" />
            <span>Detailed Reports</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-xs border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Committed Monthly Run-Rate</CardTitle>
            <DollarSignIcon className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              ₹{totalMonthlyPayrollRunRate.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              across {overview.activeContracts} active contracts
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Average Wage / Employee</CardTitle>
            <TrendingUpIcon className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              ₹{avgSalary.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              monthly average contracted compensation
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Attendance Compliance</CardTitle>
            <ClockIcon className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {todayAttendance.punctualityRate}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              today's on-time check-in ratio
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active Workforce Ratio</CardTitle>
            <UsersIcon className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {overview.totalEmployees > 0 ? Math.round((overview.activeEmployees / overview.totalEmployees) * 100) : 0}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {overview.activeEmployees} of {overview.totalEmployees} employees active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Payroll Cost Trajectory */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Payroll Cost History</CardTitle>
            <CardDescription className="text-xs">
              Gross compensation, net take-home, and statutory deductions (last 6 months)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyPayrollTrends.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyPayrollTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip
                      formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, ""]}
                      contentStyle={{ backgroundColor: "var(--background)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                    <Bar dataKey="gross" name="Gross Salary" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="net" name="Net Disbursed" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="deductions" name="Deductions" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-lg">
                No monthly payroll runs recorded yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Department Payroll Budget Distribution */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Department Run-Rate Allocation</CardTitle>
            <CardDescription className="text-xs">
              Committed monthly payroll spend by organizational division
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workforceByDepartment.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={workforceByDepartment}
                    margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                    <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <YAxis type="category" dataKey="departmentName" fontSize={11} tickLine={false} axisLine={false} width={80} />
                    <Tooltip
                      formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Monthly Budget"]}
                      contentStyle={{ backgroundColor: "var(--background)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Bar dataKey="totalMonthlyCost" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-lg">
                No department cost distributions found.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 3: Department Headcount */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Department Headcount</CardTitle>
            <CardDescription className="text-xs">
              Total assigned staff and active contracts per department
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workforceByDepartment.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workforceByDepartment} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="departmentName" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--background)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                    <Bar dataKey="employeeCount" name="Headcount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="activeContracts" name="Active Contracts" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-lg">
                No department staff data available.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 4: Workforce Status Distribution */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Workforce Lifecycle Distribution</CardTitle>
            <CardDescription className="text-xs">
              Personnel categorization across active, draft, inactive, and terminated statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workforceByStatus.length > 0 ? (
              <div className="h-72 flex flex-col justify-center gap-4">
                <div className="grid grid-cols-2 gap-4">
                  {workforceByStatus.map((item) => (
                    <div
                      key={item.status}
                      className="p-4 border rounded-xl flex flex-col justify-between"
                      style={{
                        borderColor: `${STATUS_COLORS[item.status] || "#64748b"}40`,
                        backgroundColor: `${STATUS_COLORS[item.status] || "#64748b"}10`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider capitalize text-muted-foreground">
                          {item.status}
                        </span>
                        <div
                          className="size-3 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[item.status] || "#64748b" }}
                        />
                      </div>
                      <div className="text-3xl font-bold font-mono mt-2">{item.count}</div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {overview.totalEmployees > 0
                          ? `${Math.round((item.count / overview.totalEmployees) * 100)}% of total`
                          : "0%"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-lg">
                No employee status distributions found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

