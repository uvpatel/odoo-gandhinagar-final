"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DownloadIcon,
  ArrowLeftIcon,
  SearchIcon,
  Loader2Icon,
  Building2Icon,
  UsersIcon,
  DollarSignIcon,
  BriefcaseIcon,
  TrendingUpIcon,
} from "lucide-react";
import { cn } from "cn";

interface DepartmentSummary {
  totalDepartments: number;
  totalHeadcount: number;
  totalActiveContracts: number;
  totalMonthlyPayroll: number;
  avgCompanyWage: number;
}

interface DepartmentRecord {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  employeeCount: number;
  activeContractsCount: number;
  totalMonthlyCost: number;
  avgWage: number;
}

export default function DepartmentReportsPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data, isLoading } = useQuery<{
    summary: DepartmentSummary;
    records: DepartmentRecord[];
  }>({
    queryKey: ["reports-departments-detail"],
    queryFn: async () => {
      const res = await fetch("/api/reports/departments");
      if (!res.ok) throw new Error("Failed to fetch department report");
      return res.json();
    },
  });

  const summary = data?.summary || {
    totalDepartments: 0,
    totalHeadcount: 0,
    totalActiveContracts: 0,
    totalMonthlyPayroll: 0,
    avgCompanyWage: 0,
  };

  const records = data?.records || [];

  const filteredRecords = records.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.code && r.code.toLowerCase().includes(q))
    );
  });

  const handleExportCsv = () => {
    if (filteredRecords.length === 0) return;

    const headers = [
      "Department Name",
      "Department Code",
      "Active Status",
      "Assigned Headcount",
      "Active Contracts",
      "Monthly Payroll Run-Rate",
      "Average Wage / Staff",
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.name}"`,
      `"${r.code || ""}"`,
      r.isActive ? "Active" : "Inactive",
      r.employeeCount,
      r.activeContractsCount,
      Number(r.totalMonthlyCost || 0).toFixed(2),
      Number(r.avgWage || 0).toFixed(2),
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `departments-summary-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/reports"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 px-2 gap-1 text-xs text-muted-foreground")}
          >
            <ArrowLeftIcon className="size-3.5" />
            <span>Reports Hub</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Department Run-Rate & Headcount</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Organizational hierarchy, staff distribution, active contracts, and committed payroll run-rate.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportCsv}
            disabled={filteredRecords.length === 0}
            variant="default"
            size="sm"
            className="gap-2 text-xs shadow-xs"
          >
            <DownloadIcon className="size-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Departments</CardTitle>
            <Building2Icon className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{summary.totalDepartments}</div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Headcount</CardTitle>
            <UsersIcon className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{summary.totalHeadcount}</div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active Contracts</CardTitle>
            <BriefcaseIcon className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {summary.totalActiveContracts}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Monthly Run-Rate</CardTitle>
            <DollarSignIcon className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">
              ₹{summary.totalMonthlyPayroll.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Average Wage</CardTitle>
            <TrendingUpIcon className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">
              ₹{summary.avgCompanyWage.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls Bar */}
      <Card className="shadow-xs">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search department by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Report Records Table */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Department Breakdown</CardTitle>
            <CardDescription className="text-xs">
              Showing {filteredRecords.length} of {records.length} operational departments
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Loader2Icon className="size-6 animate-spin text-primary" />
              <p className="text-xs">Generating department report...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              No department records matching the current search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead>Department</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Staff Headcount</TableHead>
                    <TableHead className="text-right">Active Contracts</TableHead>
                    <TableHead className="text-right">Monthly Run-Rate</TableHead>
                    <TableHead className="text-right">Avg Employee Wage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((r) => (
                    <TableRow key={r.id} className="text-xs">
                      <TableCell className="font-medium flex items-center gap-2">
                        <Building2Icon className="size-3.5 text-muted-foreground" />
                        <span>{r.name}</span>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">{r.code || "-"}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            r.isActive
                              ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
                              : "text-slate-600 bg-slate-500/10 border-slate-500/20"
                          )}
                        >
                          {r.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">{r.employeeCount}</TableCell>
                      <TableCell className="text-right font-mono">{r.activeContractsCount}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        ₹{Number(r.totalMonthlyCost || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        ₹{Number(r.avgWage || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

