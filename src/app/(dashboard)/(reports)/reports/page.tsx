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
  ReceiptIcon,
  ClockIcon,
  CalendarCheckIcon,
  Building2Icon,
  ArrowRightIcon,
  DownloadIcon,
  TrendingUpIcon,
  CheckCircle2Icon,
  FileSpreadsheetIcon,
  PieChartIcon,
} from "lucide-react";
import { cn } from "cn";

export default function ReportsPage() {
  const { data: deptReport } = useQuery({
    queryKey: ["reports-departments"],
    queryFn: async () => {
      const res = await fetch("/api/reports/departments");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: payrollReport } = useQuery({
    queryKey: ["reports-payroll-summary"],
    queryFn: async () => {
      const res = await fetch("/api/reports/payroll");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: attReport } = useQuery({
    queryKey: ["reports-attendance-summary"],
    queryFn: async () => {
      const res = await fetch("/api/reports/attendance");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: leaveReport } = useQuery({
    queryKey: ["reports-timeoff-summary"],
    queryFn: async () => {
      const res = await fetch("/api/reports/time-off");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const reportModules = [
    {
      title: "Payroll & Compensation Audit",
      description: "Comprehensive payslip ledger, gross wages, statutory deductions, net disbursements, and employer costs.",
      href: "/reports/payroll",
      icon: ReceiptIcon,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      stats: [
        { label: "Total Disbursed", value: payrollReport?.summary?.totalNet ? `₹${payrollReport.summary.totalNet.toLocaleString("en-IN")}` : "₹0" },
        { label: "Gross Wages", value: payrollReport?.summary?.totalGross ? `₹${payrollReport.summary.totalGross.toLocaleString("en-IN")}` : "₹0" },
        { label: "Payslips Issued", value: payrollReport?.summary?.totalPayslips || 0 },
      ],
      features: [
        "Export full CSV ledger with one click",
        "Filter by payrun, date range, or department",
        "Audit employer liability & PF/ESIC deductions",
      ],
    },
    {
      title: "Attendance & Punctuality Audit",
      description: "Employee daily check-in times, worked hours, overtime accumulation, late flags, and attendance compliance.",
      href: "/reports/attendance",
      icon: ClockIcon,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      stats: [
        { label: "Total Logs", value: attReport?.summary?.totalRecords || 0 },
        { label: "Present Days", value: attReport?.summary?.presentCount || 0 },
        { label: "Overtime Hours", value: attReport?.summary?.totalOvertimeMinutes ? `${Math.round(attReport.summary.totalOvertimeMinutes / 60)} hrs` : "0 hrs" },
      ],
      features: [
        "Track manual timesheet adjustments",
        "Punctuality rate and tardiness breakdown",
        "Export CSV for third-party payroll or audit",
      ],
    },
    {
      title: "Time-Off & Leave Utilization",
      description: "Leave requests breakdown by type, allocation consumption, approved vs pending days, and refusal records.",
      href: "/reports/time-off",
      icon: CalendarCheckIcon,
      color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
      stats: [
        { label: "Total Requests", value: leaveReport?.summary?.totalRequests || 0 },
        { label: "Approved Days", value: `${leaveReport?.summary?.approvedDays || 0} days` },
        { label: "Pending Days", value: `${leaveReport?.summary?.pendingDays || 0} days` },
      ],
      features: [
        "Breakdown by Casual, Sick, and Earned Leave",
        "Individual employee leave balances",
        "Audit trail of approver and dates",
      ],
    },
    {
      title: "Department Run-Rate & Headcount",
      description: "Organizational structure review, department staff distribution, active contracts, and committed payroll run-rates.",
      href: "/reports/departments",
      icon: Building2Icon,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      stats: [
        { label: "Departments", value: deptReport?.summary?.totalDepartments || 0 },
        { label: "Total Headcount", value: deptReport?.summary?.totalHeadcount || 0 },
        { label: "Monthly Run-Rate", value: deptReport?.summary?.totalMonthlyPayroll ? `₹${deptReport.summary.totalMonthlyPayroll.toLocaleString("en-IN")}` : "₹0" },
      ],
      features: [
        "Average compensation per department",
        "Active vs pending contract counts",
        "Comprehensive organizational overview",
      ],
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Audit & Intelligence Reports</h1>
            <Badge variant="outline" className="text-xs font-mono bg-muted/40">
              CSV Export Ready
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Official operational reports with transactional accuracy, regulatory breakdown, and CSV data export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/analytics"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 text-xs")}
          >
            <TrendingUpIcon className="size-3.5" />
            <span>Telemetry Charts</span>
          </Link>
          <Link
            href="/payroll/payruns"
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "gap-1.5 text-xs")}
          >
            <ReceiptIcon className="size-3.5" />
            <span>Payruns Hub</span>
          </Link>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportModules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Card key={mod.href} className="shadow-xs flex flex-col justify-between hover:border-primary/50 transition-all">
              <div>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2.5 rounded-lg border", mod.color)}>
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold">{mod.title}</CardTitle>
                        <CardDescription className="text-xs mt-0.5">{mod.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Live Stats Row */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-muted/40 rounded-lg border border-border/60 text-center">
                    {mod.stats.map((st, i) => (
                      <div key={i}>
                        <div className="text-xs text-muted-foreground">{st.label}</div>
                        <div className="text-sm font-bold font-mono mt-0.5">{st.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Bullet features */}
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {mod.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2Icon className="size-3 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </div>

              <div className="p-6 pt-0">
                <Link
                  href={mod.href}
                  className={cn(buttonVariants({ variant: "default", size: "sm" }), "w-full justify-between gap-2")}
                >
                  <span>Open Report & Export Data</span>
                  <ArrowRightIcon className="size-4" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

