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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DownloadIcon,
  ArrowLeftIcon,
  SearchIcon,
  Loader2Icon,
  DollarSignIcon,
  UsersIcon,
  ReceiptIcon,
  FileSpreadsheetIcon,
  FilterIcon,
  FileDownIcon,
} from "lucide-react";
import { cn } from "cn";

interface PayrollSummary {
  totalPayslips: number;
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  totalEmployerCost: number;
}

interface PayrollRecord {
  id: string;
  payslipNumber: string;
  employeeName: string;
  employeeNumber: string;
  workEmail: string | null;
  departmentName: string;
  payrunName: string;
  periodStart: string;
  periodEnd: string;
  basicWage: string;
  grossSalary: string;
  totalDeductions: string;
  netSalary: string;
  employerCost: string;
  status: string;
  paidAt: string | null;
}

export default function PayrollReportsPage() {
  const [departmentId, setDepartmentId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  // Fetch report data
  const { data, isLoading, refetch } = useQuery<{
    summary: PayrollSummary;
    records: PayrollRecord[];
  }>({
    queryKey: ["reports-payroll", departmentId, status, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (departmentId !== "all") params.set("departmentId", departmentId);
      if (status !== "all") params.set("status", status);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/reports/payroll?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch payroll report");
      return res.json();
    },
  });

  const summary = data?.summary || {
    totalPayslips: 0,
    totalGross: 0,
    totalNet: 0,
    totalDeductions: 0,
    totalEmployerCost: 0,
  };

  const records = data?.records || [];

  const filteredRecords = records.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.employeeName.toLowerCase().includes(q) ||
      r.employeeNumber.toLowerCase().includes(q) ||
      r.payslipNumber.toLowerCase().includes(q) ||
      r.departmentName.toLowerCase().includes(q)
    );
  });

  const handleExportCsv = () => {
    if (filteredRecords.length === 0) return;

    const headers = [
      "Payslip Number",
      "Employee Name",
      "Employee ID",
      "Department",
      "Payrun Batch",
      "Period Start",
      "Period End",
      "Basic Wage",
      "Gross Salary",
      "Total Deductions",
      "Net Salary",
      "Employer Cost",
      "Status",
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.payslipNumber}"`,
      `"${r.employeeName}"`,
      `"${r.employeeNumber}"`,
      `"${r.departmentName}"`,
      `"${r.payrunName}"`,
      `"${r.periodStart}"`,
      `"${r.periodEnd}"`,
      Number(r.basicWage || 0).toFixed(2),
      Number(r.grossSalary || 0).toFixed(2),
      Number(r.totalDeductions || 0).toFixed(2),
      Number(r.netSalary || 0).toFixed(2),
      Number(r.employerCost || 0).toFixed(2),
      `"${r.status}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `payroll-ledger-report-${new Date().toISOString().slice(0, 10)}.csv`);
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
            <h1 className="text-2xl font-bold tracking-tight">Payroll & Compensation Audit</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Itemized salary disbursements, statutory withholdings, and employer liabilities.
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
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Payslips</CardTitle>
            <ReceiptIcon className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{summary.totalPayslips}</div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Gross Wages</CardTitle>
            <DollarSignIcon className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">
              ₹{summary.totalGross.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Deductions</CardTitle>
            <DollarSignIcon className="size-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
              ₹{summary.totalDeductions.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Net Disbursed</CardTitle>
            <DollarSignIcon className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              ₹{summary.totalNet.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Employer Cost</CardTitle>
            <DollarSignIcon className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">
              ₹{summary.totalEmployerCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls Bar */}
      <Card className="shadow-xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search employee, slip #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>

            <Select value={departmentId} onValueChange={(val) => setDepartmentId(val ?? "all")}>
              <SelectTrigger className="text-xs h-9">
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

            <Select value={status} onValueChange={(val) => setStatus(val ?? "all")}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="validated">Validated</SelectItem>
                <SelectItem value="computed">Computed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="From Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs h-9"
            />

            <Input
              type="date"
              placeholder="To Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs h-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Report Records Table */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Ledger Records</CardTitle>
            <CardDescription className="text-xs">
              Showing {filteredRecords.length} of {records.length} itemized payslips
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Loader2Icon className="size-6 animate-spin text-primary" />
              <p className="text-xs">Generating payroll report...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              No payslip records matching the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead>Payslip #</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Payrun Batch</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Basic</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Deductions</TableHead>
                    <TableHead className="text-right">Net Pay</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((r) => (
                    <TableRow key={r.id} className="text-xs">
                      <TableCell className="font-mono font-medium">{r.payslipNumber}</TableCell>
                      <TableCell>
                        <div className="font-medium">{r.employeeName}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{r.employeeNumber}</div>
                      </TableCell>
                      <TableCell>{r.departmentName}</TableCell>
                      <TableCell className="truncate max-w-[140px]">{r.payrunName}</TableCell>
                      <TableCell className="font-mono text-[11px]">
                        {r.periodStart} ~ {r.periodEnd}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ₹{Number(r.basicWage || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ₹{Number(r.grossSalary || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-right font-mono text-rose-600 dark:text-rose-400">
                        ₹{Number(r.totalDeductions || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        ₹{Number(r.netSalary || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] capitalize",
                            r.status === "paid" && "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
                            r.status === "validated" && "text-blue-600 bg-blue-500/10 border-blue-500/20",
                            r.status === "computed" && "text-amber-600 bg-amber-500/10 border-amber-500/20",
                            r.status === "draft" && "text-slate-600 bg-slate-500/10 border-slate-500/20"
                          )}
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <a
                          href={`/api/payroll/payslips/${r.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 px-2 text-xs gap-1")}
                        >
                          <FileDownIcon className="size-3.5 text-primary" />
                        </a>
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

