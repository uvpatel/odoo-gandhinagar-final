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
  ClockIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  XCircleIcon,
  FileSpreadsheetIcon,
} from "lucide-react";
import { cn } from "cn";

interface AttendanceSummary {
  totalRecords: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  overtimeCount: number;
  totalWorkedMinutes: number;
  totalOvertimeMinutes: number;
}

interface AttendanceRecord {
  id: string;
  attendanceDate: string;
  employeeName: string;
  employeeNumber: string;
  departmentName: string;
  checkIn: string | null;
  checkOut: string | null;
  workedMinutes: number;
  overtimeMinutes: number;
  status: string;
  isManuallyEdited: boolean;
  notes: string | null;
}

export default function AttendanceReportsPage() {
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

  // Fetch attendance report data
  const { data, isLoading } = useQuery<{
    summary: AttendanceSummary;
    records: AttendanceRecord[];
  }>({
    queryKey: ["reports-attendance", departmentId, status, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (departmentId !== "all") params.set("departmentId", departmentId);
      if (status !== "all") params.set("status", status);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/reports/attendance?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch attendance report");
      return res.json();
    },
  });

  const summary = data?.summary || {
    totalRecords: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    overtimeCount: 0,
    totalWorkedMinutes: 0,
    totalOvertimeMinutes: 0,
  };

  const records = data?.records || [];

  const filteredRecords = records.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.employeeName.toLowerCase().includes(q) ||
      r.employeeNumber.toLowerCase().includes(q) ||
      r.departmentName.toLowerCase().includes(q)
    );
  });

  const handleExportCsv = () => {
    if (filteredRecords.length === 0) return;

    const headers = [
      "Date",
      "Employee Name",
      "Employee ID",
      "Department",
      "Check-In",
      "Check-Out",
      "Worked Hours",
      "Overtime Hours",
      "Status",
      "Manual Adjustment",
      "Notes",
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.attendanceDate}"`,
      `"${r.employeeName}"`,
      `"${r.employeeNumber}"`,
      `"${r.departmentName}"`,
      `"${r.checkIn ? new Date(r.checkIn).toLocaleTimeString("en-IN") : "-"}"`,
      `"${r.checkOut ? new Date(r.checkOut).toLocaleTimeString("en-IN") : "-"}"`,
      (r.workedMinutes / 60).toFixed(2),
      (r.overtimeMinutes / 60).toFixed(2),
      `"${r.status}"`,
      r.isManuallyEdited ? "Yes" : "No",
      `"${(r.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `attendance-audit-report-${new Date().toISOString().slice(0, 10)}.csv`);
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
            <h1 className="text-2xl font-bold tracking-tight">Attendance & Punctuality Audit</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Daily clock-in logs, worked minutes, overtime calculations, and tardiness records.
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
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Logs</CardTitle>
            <ClockIcon className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{summary.totalRecords}</div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Present Days</CardTitle>
            <CheckCircle2Icon className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {summary.presentCount}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Late Arrivals</CardTitle>
            <AlertTriangleIcon className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {summary.lateCount}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Hours Worked</CardTitle>
            <ClockIcon className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {(summary.totalWorkedMinutes / 60).toFixed(0)} <span className="text-xs font-normal text-muted-foreground">hrs</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Overtime Accrued</CardTitle>
            <ClockIcon className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
              {(summary.totalOvertimeMinutes / 60).toFixed(1)} <span className="text-xs font-normal text-muted-foreground">hrs</span>
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
                placeholder="Search employee, dept..."
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
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="overtime">Overtime</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
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
            <CardTitle className="text-base font-semibold">Daily Attendance Logs</CardTitle>
            <CardDescription className="text-xs">
              Showing {filteredRecords.length} of {records.length} logged entries
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Loader2Icon className="size-6 animate-spin text-primary" />
              <p className="text-xs">Generating attendance audit report...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              No attendance records matching the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead>Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Check-In</TableHead>
                    <TableHead>Check-Out</TableHead>
                    <TableHead className="text-right">Worked</TableHead>
                    <TableHead className="text-right">Overtime</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Manual Edit</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((r) => (
                    <TableRow key={r.id} className="text-xs">
                      <TableCell className="font-mono font-medium">{r.attendanceDate}</TableCell>
                      <TableCell>
                        <div className="font-medium">{r.employeeName}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{r.employeeNumber}</div>
                      </TableCell>
                      <TableCell>{r.departmentName}</TableCell>
                      <TableCell className="font-mono text-[11px]">
                        {r.checkIn ? new Date(r.checkIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "-"}
                      </TableCell>
                      <TableCell className="font-mono text-[11px]">
                        {r.checkOut ? new Date(r.checkOut).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {(r.workedMinutes / 60).toFixed(1)} hrs
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-purple-600 dark:text-purple-400">
                        {r.overtimeMinutes > 0 ? `+${(r.overtimeMinutes / 60).toFixed(1)} hrs` : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] capitalize",
                            r.status === "present" && "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
                            r.status === "late" && "text-amber-600 bg-amber-500/10 border-amber-500/20",
                            r.status === "absent" && "text-rose-600 bg-rose-500/10 border-rose-500/20",
                            r.status === "overtime" && "text-purple-600 bg-purple-500/10 border-purple-500/20",
                            r.status === "incomplete" && "text-slate-600 bg-slate-500/10 border-slate-500/20"
                          )}
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {r.isManuallyEdited ? (
                          <Badge variant="outline" className="text-[10px] text-blue-600 bg-blue-500/10 border-blue-500/20">
                            Edited
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-[150px]">
                        {r.notes || "-"}
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

