"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type PayslipDetailItem, type PayslipStatus } from "../../types";
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
  ChevronRightIcon,
  PrinterIcon,
  SendIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  ClockIcon,
  AlertTriangleIcon,
  CreditCardIcon,
  BriefcaseIcon,
  CalendarIcon,
  Building2Icon,
  MailIcon,
  PhoneIcon,
  Loader2Icon,
  ReceiptIcon,
  ShieldAlertIcon,
} from "lucide-react";
import { cn } from "cn";
import { toast } from "sonner";

interface PayslipDetailViewProps {
  payslipId: string;
}

export function PayslipDetailView({ payslipId }: PayslipDetailViewProps) {
  const { data, isLoading, error, refetch } = useQuery<{ data: PayslipDetailItem }>({
    queryKey: ["payslip-detail", payslipId],
    queryFn: async () => {
      const res = await fetch(`/api/payroll/payslips/${payslipId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load payslip");
      }
      return res.json();
    },
  });

  const slip = data?.data;

  // Single Payslip Email Send Mutation
  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/payroll/payslips/${payslipId}/send`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send email");
      }
      return res.json();
    },
    onSuccess: (res) => {
      toast.success(res.message || "Payslip dispatched to employee email");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send payslip email");
    },
  });

  if (isLoading) {
    return (
      <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
        <Loader2Icon className="size-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading itemized payslip breakdown...</p>
      </div>
    );
  }

  if (error || !slip) {
    return (
      <div className="p-8 text-center">
        <Card className="max-w-md mx-auto border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Payslip Not Found</CardTitle>
            <CardDescription>
              {(error as any)?.message || "The requested payslip could not be loaded."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/payroll/payslips"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Back to Payslips
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: PayslipStatus) => {
    switch (status) {
      case "draft":
        return (
          <Badge variant="outline" className="gap-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-500">
            <ClockIcon className="size-3" />
            <span>Draft</span>
          </Badge>
        );
      case "computed":
        return (
          <Badge variant="outline" className="gap-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-500">
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

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "basic":
        return <Badge variant="outline" className="text-[10px] bg-slate-50 dark:bg-slate-900 border-slate-300">Basic</Badge>;
      case "allowance":
        return <Badge variant="outline" className="text-[10px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-400">Allowance</Badge>;
      case "gross":
        return <Badge variant="outline" className="text-[10px] bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-400">Gross</Badge>;
      case "deduction":
        return <Badge variant="outline" className="text-[10px] bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-400">Deduction</Badge>;
      case "contribution":
        return <Badge variant="outline" className="text-[10px] bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-400">Employer Contribution</Badge>;
      case "net":
        return <Badge variant="default" className="text-[10px] bg-emerald-600 text-white">Net Pay</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">{category}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/payroll" className="hover:text-foreground">
              Payroll
            </Link>
            <ChevronRightIcon className="size-3" />
            <Link href="/payroll/payslips" className="hover:text-foreground">
              Payslips
            </Link>
            <ChevronRightIcon className="size-3" />
            <span className="text-foreground font-medium">{slip.payslipNumber}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight font-mono">
              {slip.payslipNumber}
            </h1>
            {getStatusBadge(slip.status)}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Payrun: <Link href={`/payroll/payruns/${slip.payrunId}`} className="font-medium hover:underline text-foreground">{slip.payrunName}</Link> &bull; Period: {slip.periodStart} &rarr; {slip.periodEnd}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {slip.workEmail && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendEmailMutation.mutate()}
              disabled={sendEmailMutation.isPending}
              className="gap-1.5"
            >
              {sendEmailMutation.isPending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <SendIcon className="size-3.5 text-primary" />
              )}
              <span>Email Slip</span>
            </Button>
          )}

          <a
            href={`/api/payroll/payslips/${slip.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-1.5")}
          >
            <PrinterIcon className="size-3.5" />
            <span>Print / Save PDF</span>
          </a>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Employee & Bank Profile */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BriefcaseIcon className="size-4 text-primary" />
              <span>Employee Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Full Name:</span>
              <span className="font-semibold text-foreground">{slip.employeeName}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Employee ID:</span>
              <span className="font-mono font-medium">{slip.employeeNumber}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Department:</span>
              <span>{slip.departmentName || "General"}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Job Designation:</span>
              <span>{slip.jobTitle || "General"}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Work Email:</span>
              <span className="text-foreground">{slip.workEmail || "Not Configured"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bank Account:</span>
              <span className="font-mono">
                {slip.bankAccountNumber
                  ? `${slip.bankName || "Bank"}: ••••${slip.bankAccountNumber.slice(-4)}`
                  : "No Bank Details"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Contract & Working Time */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarIcon className="size-4 text-primary" />
              <span>Contract & Attendance Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Contract Number:</span>
              <span className="font-mono font-medium">{slip.contractNumber}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Contract Base Wage:</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                ₹{slip.contractWage.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Salary Structure:</span>
              <span className="font-medium">{slip.salaryStructureName}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Days Worked:</span>
              <span className="font-medium">{slip.workedDays} Days</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Hours Worked:</span>
              <span className="font-medium">{slip.workedHours} Hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cycle Dates:</span>
              <span>{slip.periodStart} to {slip.periodEnd}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warnings Banner if any */}
      {slip.warnings && slip.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-50 dark:bg-amber-950/20 p-4 text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2 font-semibold text-sm mb-1.5">
            <AlertTriangleIcon className="size-4 text-amber-600" />
            <span>Notices for this Payslip ({slip.warnings.length})</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs">
            {slip.warnings.map((w) => (
              <li key={w.id}>
                <strong>[{w.code}]</strong>: {w.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* The Ordered Salary Computation Table */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ReceiptIcon className="size-4 text-primary" />
            <span>Ordered Salary Computation Table</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Itemized rule-by-rule evaluation executed sequentially according to the {slip.salaryStructureName} rule tree.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Seq</TableHead>
                  <TableHead className="w-32">Rule Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-32">Category</TableHead>
                  <TableHead className="text-center w-24">Rate / Qty</TableHead>
                  <TableHead className="text-right w-36">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slip.lines.map((line) => {
                  const isDeduction = ["deduction", "contribution"].includes(line.category);
                  const isNet = line.category === "net";
                  const isGross = line.category === "gross";

                  return (
                    <TableRow
                      key={line.id}
                      className={cn(
                        "hover:bg-muted/30",
                        isNet && "bg-emerald-50/50 dark:bg-emerald-950/20 font-bold",
                        isGross && "bg-blue-50/40 dark:bg-blue-950/20 font-semibold"
                      )}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {line.sequence}
                      </TableCell>

                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        {line.ruleCode}
                      </TableCell>

                      <TableCell className="text-xs font-medium">
                        {line.ruleName}
                      </TableCell>

                      <TableCell>
                        {getCategoryBadge(line.category)}
                      </TableCell>

                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        {line.rate ? `${line.rate}%` : line.quantity ? `${line.quantity}x` : "—"}
                      </TableCell>

                      <TableCell
                        className={cn(
                          "text-right font-mono text-xs",
                          isDeduction && "text-destructive",
                          isNet && "text-base font-extrabold text-emerald-600 dark:text-emerald-400",
                          !isDeduction && !isNet && "text-foreground font-semibold"
                        )}
                      >
                        {isDeduction ? "-₹" : "₹"}
                        {line.total.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Totals Summary Footer Box */}
          <div className="p-4 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
              <div>
                <span>Basic Pay: </span>
                <strong className="text-foreground font-mono">
                  ₹{slip.basicAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <div>
                <span>Gross Earnings: </span>
                <strong className="text-foreground font-mono">
                  ₹{slip.grossAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <div>
                <span>Total Deductions: </span>
                <strong className="text-destructive font-mono">
                  -₹{slip.deductionAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs uppercase font-medium text-muted-foreground">
                Net Take-Home Salary
              </div>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                ₹{slip.netAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
