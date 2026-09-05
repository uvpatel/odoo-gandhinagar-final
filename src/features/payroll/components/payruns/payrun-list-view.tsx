"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { type PayrunListItem, type PayrunStatus } from "../../types";
import { Input } from "@/components/ui/input";
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
  PlusIcon,
  SearchIcon,
  LayersIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  ReceiptIcon,
  DollarSignIcon,
  UsersIcon,
  Loader2Icon,
} from "lucide-react";
import { cn } from "cn";

export function PayrunListView() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading, error } = useQuery<{ data: PayrunListItem[] }>({
    queryKey: ["payruns", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/payroll/payruns?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load payruns");
      }
      return res.json();
    },
  });

  const payruns = data?.data || [];

  // Filter by search query
  const filteredPayruns = useMemo(() => {
    if (!search.trim()) return payruns;
    const term = search.toLowerCase();
    return payruns.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.salaryStructureName.toLowerCase().includes(term) ||
        p.periodStart.includes(term) ||
        p.periodEnd.includes(term)
    );
  }, [payruns, search]);

  // High-level KPI aggregations
  const stats = useMemo(() => {
    const totalRuns = payruns.length;
    const drafts = payruns.filter((p) => p.status === "draft" || p.status === "computed").length;
    const completed = payruns.filter((p) => p.status === "validated" || p.status === "paid").length;
    const totalNet = payruns.reduce((acc, curr) => acc + (curr.netTotal || 0), 0);

    return { totalRuns, drafts, completed, totalNet };
  }, [payruns]);

  const getStatusBadge = (status: PayrunStatus) => {
    switch (status) {
      case "draft":
        return (
          <Badge variant="outline" className="gap-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-500 text-xs">
            <ClockIcon className="size-3" />
            <span>Draft</span>
          </Badge>
        );
      case "computed":
        return (
          <Badge variant="outline" className="gap-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-500 text-xs">
            <LayersIcon className="size-3" />
            <span>Computed</span>
          </Badge>
        );
      case "validated":
        return (
          <Badge variant="outline" className="gap-1 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-500 text-xs">
            <CheckCircle2Icon className="size-3" />
            <span>Validated</span>
          </Badge>
        );
      case "paid":
        return (
          <Badge variant="outline" className="gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-500 text-xs">
            <CheckCircle2Icon className="size-3" />
            <span>Paid</span>
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payruns</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage company payroll runs, process salary calculations, and disburse payslips.
          </p>
        </div>

        <Link
          href="/payroll/payruns/new"
          className={cn(buttonVariants({ variant: "default", size: "default" }), "gap-1.5 self-start sm:self-auto shadow-sm")}
        >
          <PlusIcon className="size-4" />
          <span>New Payrun</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Payruns
            </CardTitle>
            <ReceiptIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRuns}</div>
            <p className="text-xs text-muted-foreground mt-1">All cycles recorded</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              In Progress
            </CardTitle>
            <ClockIcon className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.drafts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Draft or computed state</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Completed Cycles
            </CardTitle>
            <CheckCircle2Icon className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.completed}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Validated or finalized</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Net Disbursed
            </CardTitle>
            <DollarSignIcon className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary font-mono">
              ₹{stats.totalNet.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across completed payruns</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Payruns Table Card */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold">Payrun History</CardTitle>
              <CardDescription className="text-xs">
                Review existing payruns or select one to continue salary processing.
              </CardDescription>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search payrun..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs w-48 sm:w-64"
                />
              </div>

              <Select
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val ?? "all")}
              >
                <SelectTrigger className="h-8 text-xs w-36">
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
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2Icon className="size-6 animate-spin text-primary" />
              <p className="text-sm">Loading payruns from database...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-destructive">
              <p className="text-sm font-semibold">Failed to load payruns</p>
              <p className="text-xs mt-1">{(error as any).message}</p>
            </div>
          ) : filteredPayruns.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="p-3 rounded-full bg-muted text-muted-foreground">
                <ReceiptIcon className="size-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold">No payruns found</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {search ? "No payruns match your search query." : "Get started by generating your first payrun cycle."}
                </p>
              </div>
              {!search && (
                <Link
                  href="/payroll/payruns/new"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 mt-2")}
                >
                  <PlusIcon className="size-3.5" />
                  <span>Create Payrun</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payrun Name</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Structure</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Slips</TableHead>
                    <TableHead className="text-right">Gross Total</TableHead>
                    <TableHead className="text-right">Deductions</TableHead>
                    <TableHead className="text-right">Net Total</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayruns.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex flex-col">
                          <Link
                            href={`/payroll/payruns/${p.id}`}
                            className="font-medium text-foreground hover:text-primary transition-colors text-sm flex items-center gap-1.5"
                          >
                            <span>{p.name}</span>
                          </Link>
                          <span className="text-[11px] text-muted-foreground">
                            Created by {p.creatorName}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="size-3 text-muted-foreground" />
                          <span>{p.periodStart} &rarr; {p.periodEnd}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs font-medium">
                        {p.salaryStructureName}
                      </TableCell>

                      <TableCell>
                        {getStatusBadge(p.status)}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-mono text-xs gap-1">
                          <UsersIcon className="size-2.5 text-muted-foreground" />
                          <span>{p.payslipCount}</span>
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right font-mono text-xs">
                        ₹{p.grossTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>

                      <TableCell className="text-right font-mono text-xs text-destructive">
                        -₹{p.deductionTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>

                      <TableCell className="text-right font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        ₹{p.netTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>

                      <TableCell>
                        {p.blockingErrorsCount > 0 ? (
                          <Badge variant="destructive" className="gap-1 text-[11px]">
                            <AlertTriangleIcon className="size-2.5" />
                            <span>{p.blockingErrorsCount} Error{p.blockingErrorsCount > 1 ? "s" : ""}</span>
                          </Badge>
                        ) : p.warningsCount > 0 ? (
                          <Badge variant="outline" className="gap-1 text-[11px] border-amber-500 text-amber-600 dark:text-amber-400">
                            <AlertTriangleIcon className="size-2.5" />
                            <span>{p.warningsCount} Warning{p.warningsCount > 1 ? "s" : ""}</span>
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Link
                          href={`/payroll/payruns/${p.id}`}
                          className={cn(buttonVariants({ variant: "ghost", size: "xs" }), "gap-1 text-primary")}
                        >
                          <span>Process</span>
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
    </div>
  );
}
