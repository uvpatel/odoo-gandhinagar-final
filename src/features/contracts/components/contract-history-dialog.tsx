"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileTextIcon,
  CalendarIcon,
  DollarSignIcon,
  Building2Icon,
  BriefcaseIcon,
  CheckCircle2Icon,
  ClockIcon,
  AlertCircleIcon,
  TrendingUpIcon,
  PencilIcon,
  PlusIcon,
} from "lucide-react";
import {
  type ContractItem,
  type EmployeeOption,
  getContractTimelineTag,
} from "../types";

interface ContractHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EmployeeOption | null;
  contracts: ContractItem[];
  onEditContract?: (contract: ContractItem) => void;
  onAddContract?: (employeeId: string) => void;
  canEdit?: boolean;
}

export function ContractHistoryDialog({
  open,
  onOpenChange,
  employee,
  contracts,
  onEditContract,
  onAddContract,
  canEdit = true,
}: ContractHistoryDialogProps) {
  if (!employee) return null;

  // Filter contracts for this employee and sort chronologically (oldest to newest for timeline view)
  const empContracts = contracts
    .filter((c) => c.employeeId === employee.id)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const today = new Date().toISOString().split("T")[0];

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Indefinite / Ongoing";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const activeContract = empContracts.find(
    (c) => getContractTimelineTag(c, today) === "active"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <span>{employee.fullName}</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {employee.employeeNumber}
                </Badge>
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs">
                Employment Contract History & Wage Progression
              </DialogDescription>
            </div>
            {canEdit && onAddContract && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8"
                onClick={() => {
                  onOpenChange(false);
                  onAddContract(employee.id);
                }}
              >
                <PlusIcon className="size-3.5" />
                New Contract
              </Button>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-2.5 text-xs">
            <div>
              <span className="text-muted-foreground block">Total Records:</span>
              <span className="font-bold text-foreground text-sm">
                {empContracts.length} contract{empContracts.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Current Monthly Wage:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {activeContract ? formatCurrency(activeContract.wage) : "None active"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Earliest Start:</span>
              <span className="font-semibold text-foreground">
                {empContracts.length > 0 ? formatDate(empContracts[0].startDate) : "N/A"}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Timeline Content */}
        <div className="py-4">
          {empContracts.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-lg">
              <FileTextIcon className="size-8 mx-auto text-muted-foreground mb-2" />
              <p className="font-medium text-sm">No contracts found for this employee</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create the first contract to establish salary terms and enable payroll processing.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
              {empContracts.map((contract, index) => {
                const tag = getContractTimelineTag(contract, today);
                const isActive = tag === "active";
                const isUpcoming = tag === "upcoming";
                const isExpired = tag === "expired";

                return (
                  <div key={contract.id} className="relative group">
                    {/* Timeline Node Icon */}
                    <div
                      className={`absolute -left-6 top-1.5 size-5 rounded-full border-2 bg-background flex items-center justify-center transition-all ${
                        isActive
                          ? "border-emerald-500 text-emerald-600 ring-4 ring-emerald-500/20"
                          : isUpcoming
                          ? "border-blue-500 text-blue-600 ring-2 ring-blue-500/10"
                          : "border-muted-foreground/40 text-muted-foreground"
                      }`}
                    >
                      {isActive ? (
                        <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      ) : isUpcoming ? (
                        <ClockIcon className="size-2.5" />
                      ) : (
                        <div className="size-1.5 rounded-full bg-muted-foreground/40" />
                      )}
                    </div>

                    {/* Contract Card */}
                    <div
                      className={`rounded-lg border p-4 transition-all ${
                        isActive
                          ? "border-emerald-500/50 bg-emerald-500/[0.04] shadow-sm ring-1 ring-emerald-500/20"
                          : "border-border bg-card hover:border-muted-foreground/30"
                      }`}
                    >
                      {/* Card Top Row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {contract.contractNumber}
                          </span>
                          {isActive && (
                            <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 text-[10px] px-2 py-0.5 gap-1 shadow-sm">
                              <CheckCircle2Icon className="size-3" />
                              Currently Active Contract
                            </Badge>
                          )}
                          {isUpcoming && (
                            <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px]">
                              Scheduled (Upcoming)
                            </Badge>
                          )}
                          {isExpired && (
                            <Badge variant="outline" className="border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400 text-[10px]">
                              Historical (Expired)
                            </Badge>
                          )}
                          {contract.status === "draft" && (
                            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 text-[10px]">
                              Draft
                            </Badge>
                          )}
                          {contract.status === "terminated" && (
                            <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-600 text-[10px]">
                              Terminated
                            </Badge>
                          )}
                        </div>

                        {canEdit && onEditContract && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => {
                              onOpenChange(false);
                              onEditContract(contract);
                            }}
                            className="size-7 opacity-60 hover:opacity-100"
                            title="Edit this contract"
                          >
                            <PencilIcon className="size-3.5" />
                          </Button>
                        )}
                      </div>

                      {/* Details Grid */}
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        {/* Effective Dates */}
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Period</span>
                          <span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                            <CalendarIcon className="size-3 text-muted-foreground shrink-0" />
                            {formatDate(contract.startDate)} → {formatDate(contract.endDate)}
                          </span>
                        </div>

                        {/* Wage */}
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Monthly Wage</span>
                          <span className="font-bold text-foreground text-xs flex items-center gap-1 mt-0.5">
                            <DollarSignIcon className="size-3 text-emerald-600 shrink-0" />
                            {formatCurrency(contract.wage)} / mo
                          </span>
                        </div>

                        {/* Structure */}
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Salary Structure</span>
                          <span className="font-medium text-foreground truncate block mt-0.5" title={contract.salaryStructureName || "Default"}>
                            {contract.salaryStructureName || "Standard Structure"}
                          </span>
                        </div>

                        {/* Department */}
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Department</span>
                          <span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                            <Building2Icon className="size-3 text-muted-foreground shrink-0" />
                            {contract.departmentName || "Unassigned"}
                          </span>
                        </div>

                        {/* Position */}
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Job Title</span>
                          <span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                            <BriefcaseIcon className="size-3 text-muted-foreground shrink-0" />
                            {contract.jobTitle || "Unassigned"}
                          </span>
                        </div>

                        {/* Schedule */}
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Working Schedule</span>
                          <span className="font-medium text-foreground truncate block mt-0.5">
                            {contract.workingScheduleName || "Standard 40h/wk"}
                          </span>
                        </div>
                      </div>

                      {/* Wage progression relative to previous contract */}
                      {index > 0 && (
                        <div className="mt-2.5 pt-2 border-t flex items-center gap-2 text-[11px] text-muted-foreground">
                          <TrendingUpIcon className="size-3 text-blue-500" />
                          <span>
                            Progressed from previous contract {empContracts[index - 1].contractNumber} (
                            {formatCurrency(empContracts[index - 1].wage)} → {formatCurrency(contract.wage)})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
