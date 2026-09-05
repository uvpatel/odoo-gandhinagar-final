"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { type PayslipSummaryItem, type PayslipStatus } from "../../types";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  SearchIcon,
  FileTextIcon,
  PrinterIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  DollarSignIcon,
  ReceiptIcon,
  Loader2Icon,
  UserIcon,
  MailIcon,
  SendIcon,
  XIcon,
} from "lucide-react";
import { cn } from "cn";
import { SendPayslipEmailDialog } from "./send-payslip-email-dialog";
import { BulkSendPayslipsDialog } from "./bulk-send-payslips-dialog";

export function PayslipsListView() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");

  // Selection & Emailing State
  const [selectedSlipIds, setSelectedSlipIds] = useState<Set<string>>(new Set());
  const [singleEmailSlip, setSingleEmailSlip] = useState<PayslipSummaryItem | null>(null);
  const [isSingleEmailOpen, setIsSingleEmailOpen] = useState(false);
  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);

  // Fetch departments for filtering
  const { data: deptsData } = useQuery<{ data: Array<{ id: string; name: string }> }>({
    queryKey: ["departments-list"],
    queryFn: async () => {
      const res = await fetch("/api/departments");
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });
  const departments = deptsData?.data || [];

  // Fetch payslips
  const { data, isLoading, error, refetch } = useQuery<{ data: PayslipSummaryItem[] }>({
    queryKey: ["payslips-list", statusFilter, deptFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (deptFilter !== "all") params.set("departmentId", deptFilter);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/payroll/payslips?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load payslips");
      }
      return res.json();
    },
  });

  const payslips = data?.data || [];

  const toggleSelectSlip = (id: string) => {
    setSelectedSlipIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSlipIds(new Set(payslips.map((s) => s.id)));
    } else {
      setSelectedSlipIds(new Set());
    }
  };

  const selectedPayslips = useMemo(() => {
    return payslips.filter((s) => selectedSlipIds.has(s.id));
  }, [payslips, selectedSlipIds]);

  // Aggregated KPIs
  const stats = useMemo(() => {
    const totalCount = payslips.length;
    const grossTotal = payslips.reduce((acc, s) => acc + (s.grossAmount || 0), 0);
    const deductionTotal = payslips.reduce((acc, s) => acc + (s.deductionAmount || 0), 0);
    const netTotal = payslips.reduce((acc, s) => acc + (s.netAmount || 0), 0);
    return { totalCount, grossTotal, deductionTotal, netTotal };
  }, [payslips]);

  const getStatusBadge = (status: PayslipStatus) => {
    switch (status) {
      case "draft":
        return (
          <Badge variant="outline" className="gap-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-500 text-xs">
            <ClockIcon className="size-2.5" />
            <span>Draft</span>
          </Badge>
        );
      case "computed":
        return (
          <Badge variant="outline" className="gap-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-500 text-xs">
            <span>Computed</span>
          </Badge>
        );
      case "validated":
        return (
          <Badge variant="outline" className="gap-1 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-500 text-xs">
            <CheckCircle2Icon className="size-2.5" />
            <span>Validated</span>
          </Badge>
        );
      case "paid":
        return (
          <Badge variant="outline" className="gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-500 text-xs">
            <CheckCircle2Icon className="size-2.5" />
            <span>Paid</span>
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">Payslips Directory</h1>
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium"
            >
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Resend Active</span>
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Browse, inspect itemized computation rules, and dispatch salary slips via Resend email.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedSlipIds.size > 0 && (
            <Button
              size="sm"
              onClick={() => setIsBulkEmailOpen(true)}
              className="gap-1.5 shadow-xs"
            >
              <MailIcon className="size-3.5" />
              <span>Email Selected ({selectedSlipIds.size})</span>
            </Button>
          )}

          <Link
            href="/payroll/payslips/me"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 self-start sm:self-auto")}
          >
            <UserIcon className="size-3.5" />
            <span>My Personal Payslips</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Slips
            </CardTitle>
            <FileTextIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Generated payslips</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Gross Earnings
            </CardTitle>
            <DollarSignIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              ₹{stats.grossTotal.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total before deductions</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Deductions
            </CardTitle>
            <ReceiptIcon className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-destructive">
              -₹{stats.deductionTotal.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">PF, PT, TDS taxes</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Net Payable
            </CardTitle>
            <CheckCircle2Icon className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              ₹{stats.netTotal.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Net disbursement</p>
          </CardContent>
        </Card>
      </div>

      {/* Batch Actions Bar (when items selected) */}
      {selectedSlipIds.size > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="default" className="font-mono">
              {selectedSlipIds.size} Selected
            </Badge>
            <span className="text-muted-foreground">
              of {payslips.length} payslips in directory
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedSlipIds(new Set())}
              className="h-8 text-xs gap-1"
            >
              <XIcon className="size-3.5" />
              <span>Clear</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsBulkEmailOpen(true)}
              className="h-8 text-xs gap-1.5 shadow-xs"
            >
              <MailIcon className="size-3.5" />
              <span>Send {selectedSlipIds.size} Payslips via Email</span>
            </Button>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold">Issued Payslips</CardTitle>
              <CardDescription className="text-xs">
                Select slips to email in bulk, or click the mail icon on any row to send directly.
              </CardDescription>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search employee / slip #..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs w-48 sm:w-60"
                />
              </div>

              <Select
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val ?? "all")}
              >
                <SelectTrigger className="h-8 text-xs w-32">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="computed">Computed</SelectItem>
                  <SelectItem value="validated">Validated</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={deptFilter}
                onValueChange={(val) => setDeptFilter(val ?? "all")}
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
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2Icon className="size-6 animate-spin text-primary" />
              <p className="text-sm">Fetching payslips from database...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-destructive">
              <p className="text-sm font-semibold">Failed to load payslips</p>
              <p className="text-xs mt-1">{(error as any).message}</p>
            </div>
          ) : payslips.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <FileTextIcon className="size-8 opacity-40" />
              <p className="text-sm font-medium">No payslips found</p>
              <p className="text-xs">Adjust your search filters or compute a new payrun cycle.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 pl-4">
                      <Checkbox
                        checked={payslips.length > 0 && selectedSlipIds.size === payslips.length}
                        onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                        aria-label="Select all payslips"
                      />
                    </TableHead>
                    <TableHead>Slip Ref</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department / Role</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Deductions</TableHead>
                    <TableHead className="text-right">Net Pay</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslips.map((slip) => (
                    <TableRow
                      key={slip.id}
                      className={cn("hover:bg-muted/30", selectedSlipIds.has(slip.id) && "bg-primary/5")}
                    >
                      <TableCell className="w-10 pl-4">
                        <Checkbox
                          checked={selectedSlipIds.has(slip.id)}
                          onCheckedChange={() => toggleSelectSlip(slip.id)}
                          aria-label={`Select payslip ${slip.payslipNumber}`}
                        />
                      </TableCell>

                      <TableCell>
                        <Link
                          href={`/payroll/payslips/${slip.id}`}
                          className="font-mono text-xs font-semibold text-primary hover:underline"
                        >
                          {slip.payslipNumber}
                        </Link>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground text-xs">
                            {slip.employeeName}
                          </span>
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                            <span>{slip.employeeNumber}</span>
                            {slip.workEmail ? (
                              <span
                                className="text-[10px] text-muted-foreground/80 lowercase truncate max-w-[130px]"
                                title={slip.workEmail}
                              >
                                &bull; {slip.workEmail}
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400">
                                &bull; No Email
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs">
                        <div className="flex flex-col">
                          <span>{slip.departmentName || "General"}</span>
                          <span className="text-[11px] text-muted-foreground">{slip.jobTitle || ""}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {slip.periodStart} &rarr; {slip.periodEnd}
                      </TableCell>

                      <TableCell className="text-right font-mono text-xs">
                        ₹{slip.grossAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>

                      <TableCell className="text-right font-mono text-xs text-destructive">
                        -₹{slip.deductionAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>

                      <TableCell className="text-right font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        ₹{slip.netAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>

                      <TableCell>
                        {getStatusBadge(slip.status)}
                      </TableCell>

                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => {
                              setSingleEmailSlip(slip);
                              setIsSingleEmailOpen(true);
                            }}
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                            title={slip.workEmail ? `Email payslip to ${slip.workEmail}` : "Send Payslip by Email"}
                          >
                            <MailIcon className="size-3.5" />
                          </Button>

                          <a
                            href={`/api/payroll/payslips/${slip.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(buttonVariants({ variant: "ghost", size: "icon-xs" }), "text-muted-foreground hover:text-foreground")}
                            title="Print / Save PDF"
                          >
                            <PrinterIcon className="size-3.5" />
                          </a>

                          <Link
                            href={`/payroll/payslips/${slip.id}`}
                            className={cn(buttonVariants({ variant: "ghost", size: "xs" }), "gap-1 text-primary")}
                          >
                            <span>View</span>
                            <ArrowRightIcon className="size-3" />
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Email Dialog */}
      <SendPayslipEmailDialog
        payslip={singleEmailSlip}
        open={isSingleEmailOpen}
        onOpenChange={setIsSingleEmailOpen}
        onSuccess={() => refetch()}
      />

      {/* Bulk Email Dialog */}
      <BulkSendPayslipsDialog
        selectedPayslips={selectedPayslips}
        open={isBulkEmailOpen}
        onOpenChange={setIsBulkEmailOpen}
        onSuccess={() => {
          setSelectedSlipIds(new Set());
          refetch();
        }}
      />
    </div>
  );
}
