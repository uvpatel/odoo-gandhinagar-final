"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type PayrunDetail, type PayrunStatus } from "../../types";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronRightIcon,
  PlayIcon,
  CheckCircle2Icon,
  SendIcon,
  Trash2Icon,
  RefreshCwIcon,
  AlertTriangleIcon,
  XCircleIcon,
  FileTextIcon,
  DollarSignIcon,
  ArrowRightIcon,
  SearchIcon,
  UsersIcon,
  Loader2Icon,
  ReceiptIcon,
  BanknoteIcon,
} from "lucide-react";
import { cn } from "cn";
import { toast } from "sonner";

interface PayrunDetailViewProps {
  payrunId: string;
}

export function PayrunDetailView({ payrunId }: PayrunDetailViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  // Fetch payrun detail
  const { data, isLoading, error } = useQuery<{ data: PayrunDetail }>({
    queryKey: ["payrun-detail", payrunId],
    queryFn: async () => {
      const res = await fetch(`/api/payroll/payruns/${payrunId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load payrun");
      }
      return res.json();
    },
  });

  const payrun = data?.data;

  // 1. Compute Mutation
  const computeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/payroll/payruns/${payrunId}/compute`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Computation failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Payroll computed successfully!");
      queryClient.invalidateQueries({ queryKey: ["payrun-detail", payrunId] });
      queryClient.invalidateQueries({ queryKey: ["payruns"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Computation failed");
    },
  });

  // 2. Validate Mutation
  const validateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/payroll/payruns/${payrunId}/validate`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Validation failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Payrun validated successfully! Ready for disbursement.");
      queryClient.invalidateQueries({ queryKey: ["payrun-detail", payrunId] });
      queryClient.invalidateQueries({ queryKey: ["payruns"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Validation failed");
    },
  });

  // 3. Mark Paid Mutation
  const markPaidMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/payroll/payruns/${payrunId}/mark-paid`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to mark as paid");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Payrun marked as paid! All payslips finalized.");
      setMarkPaidDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["payrun-detail", payrunId] });
      queryClient.invalidateQueries({ queryKey: ["payruns"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to mark as paid");
    },
  });

  // 4. Send Payslips Bulk Mutation
  const sendPayslipsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/payroll/payruns/${payrunId}/send`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Bulk delivery failed");
      }
      return res.json();
    },
    onSuccess: (result) => {
      toast.success(`Payslips dispatched: ${result.data?.summary || "Completed"}`);
      setSendDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["payrun-detail", payrunId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send payslips");
    },
  });

  // 5. Delete Draft Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/payroll/payruns/${payrunId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete payrun");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Draft payrun deleted");
      queryClient.invalidateQueries({ queryKey: ["payruns"] });
      router.push("/payroll/payruns");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete payrun");
    },
  });

  // Filter payslips
  const filteredPayslips = useMemo(() => {
    if (!payrun?.payslips) return [];
    if (!search.trim()) return payrun.payslips;
    const term = search.toLowerCase();
    return payrun.payslips.filter(
      (s) =>
        s.employeeName.toLowerCase().includes(term) ||
        s.employeeNumber.toLowerCase().includes(term) ||
        s.payslipNumber.toLowerCase().includes(term) ||
        (s.departmentName && s.departmentName.toLowerCase().includes(term))
    );
  }, [payrun?.payslips, search]);

  if (isLoading) {
    return (
      <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
        <Loader2Icon className="size-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading payrun details and computation lines...</p>
      </div>
    );
  }

  if (error || !payrun) {
    return (
      <div className="p-8 text-center">
        <Card className="max-w-md mx-auto border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Payrun Not Found</CardTitle>
            <CardDescription>
              {(error as any)?.message || "The requested payrun could not be loaded."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/payroll/payruns"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Back to Payruns
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: PayrunStatus) => {
    switch (status) {
      case "draft":
        return (
          <Badge variant="outline" className="gap-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-500">
            <ReceiptIcon className="size-3" />
            <span>Draft</span>
          </Badge>
        );
      case "computed":
        return (
          <Badge variant="outline" className="gap-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-500">
            <RefreshCwIcon className="size-3" />
            <span>Computed</span>
          </Badge>
        );
      case "validated":
        return (
          <Badge variant="outline" className="gap-1 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-500">
            <CheckCircle2Icon className="size-3" />
            <span>Validated</span>
          </Badge>
        );
      case "paid":
        return (
          <Badge variant="outline" className="gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-500">
            <CheckCircle2Icon className="size-3" />
            <span>Paid</span>
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isBusy =
    computeMutation.isPending ||
    validateMutation.isPending ||
    markPaidMutation.isPending ||
    sendPayslipsMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumbs & Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/payroll" className="hover:text-foreground">
              Payroll
            </Link>
            <ChevronRightIcon className="size-3" />
            <Link href="/payroll/payruns" className="hover:text-foreground">
              Payruns
            </Link>
            <ChevronRightIcon className="size-3" />
            <span className="text-foreground font-medium">{payrun.name}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{payrun.name}</h1>
            {getStatusBadge(payrun.status)}
          </div>

          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
            <span>Period: <strong>{payrun.periodStart}</strong> &rarr; <strong>{payrun.periodEnd}</strong></span>
            <span>&bull;</span>
            <span>Structure: <strong>{payrun.salaryStructureName}</strong></span>
            <span>&bull;</span>
            <span>Created by: {payrun.creatorName}</span>
          </div>
        </div>

        {/* Workflow Actions Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Compute / Recompute Button */}
          {(payrun.status === "draft" || payrun.status === "computed") && (
            <Button
              variant={payrun.status === "draft" ? "default" : "outline"}
              size="sm"
              onClick={() => computeMutation.mutate()}
              disabled={isBusy}
              className="gap-1.5"
            >
              {computeMutation.isPending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : payrun.status === "draft" ? (
                <PlayIcon className="size-3.5" />
              ) : (
                <RefreshCwIcon className="size-3.5" />
              )}
              <span>{payrun.status === "draft" ? "Compute Payroll" : "Re-compute"}</span>
            </Button>
          )}

          {/* 2. Validate Button */}
          {payrun.status === "computed" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => validateMutation.mutate()}
              disabled={isBusy || payrun.blockingErrorsCount > 0}
              className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {validateMutation.isPending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2Icon className="size-3.5" />
              )}
              <span>Validate Payrun</span>
            </Button>
          )}

          {/* 3. Mark as Paid Button */}
          {payrun.status === "validated" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setMarkPaidDialogOpen(true)}
              disabled={isBusy}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <BanknoteIcon className="size-3.5" />
              <span>Mark as Paid</span>
            </Button>
          )}

          {/* 4. Bulk Send Payslips */}
          {(payrun.status === "validated" || payrun.status === "paid") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSendDialogOpen(true)}
              disabled={isBusy}
              className="gap-1.5"
            >
              <SendIcon className="size-3.5 text-primary" />
              <span>Send Payslips</span>
            </Button>
          )}

          {/* 5. Delete Draft */}
          {payrun.status === "draft" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isBusy}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Blocking Error Alert */}
      {payrun.blockingErrorsCount > 0 && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive flex items-start gap-3">
          <XCircleIcon className="size-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-semibold">
              {payrun.blockingErrorsCount} Blocking Validation Issue{payrun.blockingErrorsCount > 1 ? "s" : ""}
            </h4>
            <p className="text-xs mt-0.5 opacity-90">
              This payrun cannot be validated or disbursed until engine errors (e.g. missing contracts or calculation exceptions) are resolved. Check the &ldquo;Validation Issues&rdquo; tab below.
            </p>
          </div>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Gross Earnings Total
            </CardTitle>
            <DollarSignIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              ₹{payrun.grossTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across {payrun.payslipCount} employees</p>
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
              -₹{payrun.deductionTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">PF, PT, TDS & statutory</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Net Payable Total
            </CardTitle>
            <BanknoteIcon className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              ₹{payrun.netTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Take-home disbursement</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Warnings & Errors
            </CardTitle>
            <AlertTriangleIcon className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payrun.blockingErrorsCount > 0 ? (
                <span className="text-destructive font-bold">{payrun.blockingErrorsCount} Errors</span>
              ) : payrun.warningsCount > 0 ? (
                <span className="text-amber-600 dark:text-amber-400">{payrun.warningsCount} Warnings</span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-lg font-semibold">
                  <CheckCircle2Icon className="size-5" />
                  Clean
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {payrun.allWarnings.length} total notifications
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs View */}
      <Tabs defaultValue="payslips" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="payslips" className="gap-2 text-xs">
              <UsersIcon className="size-3.5" />
              <span>Payslips ({payrun.payslips.length})</span>
            </TabsTrigger>
            <TabsTrigger value="warnings" className="gap-2 text-xs">
              <AlertTriangleIcon className="size-3.5" />
              <span>Issues & Warnings ({payrun.allWarnings.length})</span>
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search employee or slip..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        {/* Tab 1: Payslips Summary */}
        <TabsContent value="payslips" className="m-0">
          <Card className="shadow-xs">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payslip Ref</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department / Role</TableHead>
                      <TableHead className="text-right">Contract Wage</TableHead>
                      <TableHead className="text-center">Days / Hrs</TableHead>
                      <TableHead className="text-right">Gross</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">Net Pay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayslips.map((slip) => (
                      <TableRow key={slip.id} className="hover:bg-muted/30">
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
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {slip.employeeNumber}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs">
                          <div className="flex flex-col">
                            <span>{slip.departmentName || "General"}</span>
                            <span className="text-[11px] text-muted-foreground">{slip.jobTitle || ""}</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-right font-mono text-xs">
                          {slip.contractWage ? `₹${slip.contractWage.toLocaleString("en-IN")}` : "—"}
                        </TableCell>

                        <TableCell className="text-center text-xs text-muted-foreground">
                          {slip.workedDays}d ({slip.workedHours}h)
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
                          {slip.hasErrors ? (
                            <Badge variant="destructive" className="text-[10px] gap-1">
                              <XCircleIcon className="size-2.5" />
                              <span>Error</span>
                            </Badge>
                          ) : slip.warningsCount > 0 ? (
                            <Badge variant="outline" className="text-[10px] gap-1 border-amber-500 text-amber-600">
                              <AlertTriangleIcon className="size-2.5" />
                              <span>{slip.warningsCount}</span>
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500 text-emerald-600">
                              <CheckCircle2Icon className="size-2.5" />
                              <span>OK</span>
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <Link
                            href={`/payroll/payslips/${slip.id}`}
                            className={cn(buttonVariants({ variant: "ghost", size: "xs" }), "gap-1 text-primary")}
                          >
                            <span>View</span>
                            <ArrowRightIcon className="size-3" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Issues & Warnings */}
        <TabsContent value="warnings" className="m-0">
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Engine Warnings & Validation Log</CardTitle>
              <CardDescription className="text-xs">
                Detailed calculation audit messages and exceptions encountered during rule evaluation.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {payrun.allWarnings.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <CheckCircle2Icon className="size-8 text-emerald-500" />
                  <p className="text-sm font-medium">Zero calculation issues detected</p>
                  <p className="text-xs">All active employees have valid contracts, attendance, and wage baselines.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Severity</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payrun.allWarnings.map((w) => (
                        <TableRow key={w.id} className="hover:bg-muted/30">
                          <TableCell>
                            {w.severity === "error" ? (
                              <Badge variant="destructive" className="text-[11px] gap-1">
                                <XCircleIcon className="size-3" />
                                <span>Blocking Error</span>
                              </Badge>
                            ) : w.severity === "warning" ? (
                              <Badge variant="outline" className="text-[11px] gap-1 border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/30">
                                <AlertTriangleIcon className="size-3" />
                                <span>Warning</span>
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[11px]">
                                Info
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col text-xs">
                              <span className="font-medium text-foreground">{w.employeeName}</span>
                              <span className="font-mono text-muted-foreground">{w.employeeNumber}</span>
                            </div>
                          </TableCell>

                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {w.code}
                          </TableCell>

                          <TableCell className="text-xs font-medium text-foreground">
                            {w.message}
                          </TableCell>

                          <TableCell className="text-right">
                            <Link
                              href={`/payroll/payslips/${w.payslipId}`}
                              className={cn(buttonVariants({ variant: "ghost", size: "xs" }), "gap-1 text-primary")}
                            >
                              <span>Inspect Slip</span>
                              <ArrowRightIcon className="size-3" />
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mark Paid Confirmation Dialog */}
      <Dialog open={markPaidDialogOpen} onOpenChange={setMarkPaidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payrun Disbursement</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark <strong>{payrun.name}</strong> as Paid? This will finalize all {payrun.payslipCount} payslips and lock records against further re-computation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setMarkPaidDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => markPaidMutation.mutate()}
              disabled={markPaidMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {markPaidMutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
              <span>Confirm & Mark as Paid</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Payslips Confirmation Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Payslips to All Employees</DialogTitle>
            <DialogDescription>
              This will dispatch email notifications with itemized payslip breakdowns to all {payrun.payslipCount} eligible employee addresses using Resend.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => sendPayslipsMutation.mutate()}
              disabled={sendPayslipsMutation.isPending}
              className="gap-2"
            >
              {sendPayslipsMutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
              <span>Send {payrun.payslipCount} Payslips</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Draft Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Draft Payrun</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this draft payrun? All associated draft payslips and lines will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="gap-2"
            >
              {deleteMutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
              <span>Delete Payrun</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
