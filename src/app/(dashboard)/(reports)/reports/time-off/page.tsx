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
  CalendarCheckIcon,
  CheckCircle2Icon,
  ClockIcon,
  XCircleIcon,
  CalendarIcon,
} from "lucide-react";
import { cn } from "cn";

interface TimeOffSummary {
  totalRequests: number;
  totalDays: number;
  approvedDays: number;
  pendingDays: number;
  refusedDays: number;
}

interface TimeOffRecord {
  id: string;
  employeeName: string;
  employeeNumber: string;
  departmentName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  duration: string;
  reason: string | null;
  status: string;
  refusalReason: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export default function TimeOffReportsPage() {
  const [departmentId, setDepartmentId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [timeOffTypeId, setTimeOffTypeId] = useState<string>("all");
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

  // Fetch leave types list
  const { data: typesData } = useQuery<{ data: Array<{ id: string; name: string }> }>({
    queryKey: ["time-off-types-list"],
    queryFn: async () => {
      const res = await fetch("/api/time-off/types");
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });
  const leaveTypes = typesData?.data || [];

  // Fetch time-off report data
  const { data, isLoading } = useQuery<{
    summary: TimeOffSummary;
    records: TimeOffRecord[];
  }>({
    queryKey: ["reports-time-off", departmentId, status, timeOffTypeId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (departmentId !== "all") params.set("departmentId", departmentId);
      if (status !== "all") params.set("status", status);
      if (timeOffTypeId !== "all") params.set("timeOffTypeId", timeOffTypeId);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/reports/time-off?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch time-off report");
      return res.json();
    },
  });

  const summary = data?.summary || {
    totalRequests: 0,
    totalDays: 0,
    approvedDays: 0,
    pendingDays: 0,
    refusedDays: 0,
  };

  const records = data?.records || [];

  const filteredRecords = records.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.employeeName.toLowerCase().includes(q) ||
      r.employeeNumber.toLowerCase().includes(q) ||
      r.departmentName.toLowerCase().includes(q) ||
      r.leaveType.toLowerCase().includes(q)
    );
  });

  const handleExportCsv = () => {
    if (filteredRecords.length === 0) return;

    const headers = [
      "Employee Name",
      "Employee ID",
      "Department",
      "Leave Type",
      "Start Date",
      "End Date",
      "Days",
      "Status",
      "Reason",
      "Refusal Reason",
      "Approved At",
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.employeeName}"`,
      `"${r.employeeNumber}"`,
      `"${r.departmentName}"`,
      `"${r.leaveType}"`,
      `"${r.startDate}"`,
      `"${r.endDate}"`,
      Number(r.duration || 0).toFixed(1),
      `"${r.status}"`,
      `"${(r.reason || "").replace(/"/g, '""')}"`,
      `"${(r.refusalReason || "").replace(/"/g, '""')}"`,
      `"${r.approvedAt ? new Date(r.approvedAt).toLocaleDateString() : "-"}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `time-off-report-${new Date().toISOString().slice(0, 10)}.csv`);
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
            <h1 className="text-2xl font-bold tracking-tight">Time-Off & Leave Utilization</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Leave requests analysis, policy consumption, and balance consumption tracking.
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
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Requests</CardTitle>
            <CalendarCheckIcon className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{summary.totalRequests}</div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Days Requested</CardTitle>
            <CalendarIcon className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{summary.totalDays} <span className="text-xs font-normal text-muted-foreground">days</span></div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Approved Days</CardTitle>
            <CheckCircle2Icon className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {summary.approvedDays} <span className="text-xs font-normal text-muted-foreground">days</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Pending Review</CardTitle>
            <ClockIcon className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {summary.pendingDays} <span className="text-xs font-normal text-muted-foreground">days</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Refused Days</CardTitle>
            <XCircleIcon className="size-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {summary.refusedDays} <span className="text-xs font-normal text-muted-foreground">days</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls Bar */}
      <Card className="shadow-xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="relative lg:col-span-2">
              <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search employee, leave type..."
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

            <Select value={timeOffTypeId} onValueChange={(val) => setTimeOffTypeId(val ?? "all")}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="All Leave Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leave Types</SelectItem>
                {leaveTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="refused">Refused</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="From Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs h-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Report Records Table */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Time-Off Requests</CardTitle>
            <CardDescription className="text-xs">
              Showing {filteredRecords.length} of {records.length} requests
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Loader2Icon className="size-6 animate-spin text-primary" />
              <p className="text-xs">Generating time-off report...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              No leave requests matching the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Approved / Decided</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((r) => (
                    <TableRow key={r.id} className="text-xs">
                      <TableCell>
                        <div className="font-medium">{r.employeeName}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{r.employeeNumber}</div>
                      </TableCell>
                      <TableCell>{r.departmentName}</TableCell>
                      <TableCell className="font-medium">{r.leaveType}</TableCell>
                      <TableCell className="font-mono text-[11px]">{r.startDate}</TableCell>
                      <TableCell className="font-mono text-[11px]">{r.endDate}</TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {Number(r.duration).toFixed(1)} {Number(r.duration) === 1 ? "day" : "days"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] capitalize",
                            r.status === "approved" && "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
                            r.status === "pending" && "text-amber-600 bg-amber-500/10 border-amber-500/20",
                            r.status === "refused" && "text-rose-600 bg-rose-500/10 border-rose-500/20",
                            r.status === "cancelled" && "text-slate-600 bg-slate-500/10 border-slate-500/20"
                          )}
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-[160px]">
                        {r.reason || "-"}
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground">
                        {r.approvedAt ? new Date(r.approvedAt).toLocaleDateString("en-IN") : "-"}
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

