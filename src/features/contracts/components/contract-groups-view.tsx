"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileTextIcon,
  CheckCircle2Icon,
  ClockIcon,
  CalendarIcon,
  PencilIcon,
  Trash2Icon,
  PlusIcon,
  HistoryIcon,
  DollarSignIcon,
  BriefcaseIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  AlertCircleIcon,
} from "lucide-react";
import {
  type ContractItem,
  type EmployeeOption,
  getContractTimelineTag,
} from "../types";

interface ContractGroupsViewProps {
  contracts: ContractItem[];
  employeesList: EmployeeOption[];
  onOpenCreateModal: (employeeId?: string) => void;
  onOpenEditModal: (contract: ContractItem) => void;
  onOpenDeleteModal: (contract: ContractItem) => void;
  onOpenHistoryModal: (employee: EmployeeOption) => void;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export function ContractGroupsView({
  contracts,
  employeesList,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenDeleteModal,
  onOpenHistoryModal,
  canCreate,
  canUpdate,
  canDelete,
}: ContractGroupsViewProps) {
  const [collapsedEmployees, setCollapsedEmployees] = React.useState<Record<string, boolean>>({});

  const toggleCollapse = (empId: string) => {
    setCollapsedEmployees((prev) => ({
      ...prev,
      [empId]: !prev[empId],
    }));
  };

  const today = new Date().toISOString().split("T")[0];

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Indefinite";
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

  // Group contracts by employeeId
  const grouped = React.useMemo(() => {
    const map = new Map<string, { employee: EmployeeOption; contracts: ContractItem[] }>();

    // First, map contracts to employees
    for (const contract of contracts) {
      const empId = contract.employeeId;
      if (!map.has(empId)) {
        const empOpt =
          employeesList.find((e) => e.id === empId) ||
          ({
            id: empId,
            fullName: contract.employeeName || "Unassigned Employee",
            employeeNumber: contract.employeeNumber || "EMP-0000",
            departmentId: contract.departmentId,
            jobPositionId: contract.jobPositionId,
          } as EmployeeOption);
        map.set(empId, { employee: empOpt, contracts: [] });
      }
      map.get(empId)!.contracts.push(contract);
    }

    // Sort contracts within each group chronologically
    for (const group of map.values()) {
      group.contracts.sort((a, b) => a.startDate.localeCompare(b.startDate));
    }

    // Return as array sorted by employee name
    return Array.from(map.values()).sort((a, b) =>
      a.employee.fullName.localeCompare(b.employee.fullName)
    );
  }, [contracts, employeesList]);

  if (grouped.length === 0) {
    return (
      <Card className="border-dashed p-12 text-center">
        <FileTextIcon className="mx-auto size-8 text-muted-foreground" />
        <h3 className="mt-3 text-base font-semibold">No contract groups found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          No employee contracts match your search and filter criteria.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map(({ employee, contracts: empContracts }) => {
        const isCollapsed = collapsedEmployees[employee.id];
        const activeContract = empContracts.find(
          (c) => getContractTimelineTag(c, today) === "active"
        );
        const upcomingContracts = empContracts.filter(
          (c) => getContractTimelineTag(c, today) === "upcoming"
        );
        const expiredContracts = empContracts.filter(
          (c) => getContractTimelineTag(c, today) === "expired"
        );

        return (
          <Card
            key={employee.id}
            className={`border transition-all duration-200 overflow-hidden ${
              activeContract ? "border-emerald-500/20 shadow-sm" : ""
            }`}
          >
            {/* Employee Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/30 p-4 border-b">
              <div
                className="flex items-center gap-3 cursor-pointer select-none"
                onClick={() => toggleCollapse(employee.id)}
              >
                <button
                  type="button"
                  className="size-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
                >
                  {isCollapsed ? (
                    <ChevronRightIcon className="size-4" />
                  ) : (
                    <ChevronDownIcon className="size-4" />
                  )}
                </button>

                <div className="size-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                  {employee.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground hover:underline">
                      {employee.fullName}
                    </span>
                    <Badge variant="outline" className="font-mono text-[11px]">
                      {employee.employeeNumber}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {empContracts.length} contract{empContracts.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>{empContracts[0]?.departmentName || "General Dept"}</span>
                    <span>•</span>
                    <span>{empContracts[0]?.jobTitle || "Staff"}</span>
                  </div>
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {activeContract ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active: {formatCurrency(activeContract.wage)}/mo</span>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-xs">
                    No Active Contract
                  </Badge>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => onOpenHistoryModal(employee)}
                  title="View complete employment history timeline"
                >
                  <HistoryIcon className="size-3.5" />
                  History
                </Button>

                {canCreate && (
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1"
                    onClick={() => onOpenCreateModal(employee.id)}
                    title="Add new sequential contract for this employee"
                  >
                    <PlusIcon className="size-3.5" />
                    Add Contract
                  </Button>
                )}
              </div>
            </div>

            {/* Tree / Timeline Hierarchy */}
            {!isCollapsed && (
              <CardContent className="p-4 sm:p-5">
                <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/70">
                  {empContracts.map((c, index) => {
                    const tag = getContractTimelineTag(c, today);
                    const isActive = tag === "active";
                    const isUpcoming = tag === "upcoming";
                    const isExpired = tag === "expired";
                    const isLast = index === empContracts.length - 1;

                    return (
                      <div key={c.id} className="relative group">
                        {/* Tree Branch Connector */}
                        <div
                          className={`absolute -left-6 top-3 size-5 rounded-full border-2 bg-background flex items-center justify-center transition-all ${
                            isActive
                              ? "border-emerald-500 text-emerald-600 ring-2 ring-emerald-500/20"
                              : isUpcoming
                              ? "border-blue-500 text-blue-600"
                              : "border-muted-foreground/30 text-muted-foreground/50"
                          }`}
                        >
                          {isActive ? (
                            <div className="size-2 rounded-full bg-emerald-500" />
                          ) : isUpcoming ? (
                            <ClockIcon className="size-2.5" />
                          ) : (
                            <div className="size-1.5 rounded-full bg-muted-foreground/40" />
                          )}
                        </div>

                        {/* Contract Row Card */}
                        <div
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border transition-all ${
                            isActive
                              ? "border-emerald-500/40 bg-emerald-500/[0.04] shadow-sm ring-1 ring-emerald-500/10"
                              : "border-border/60 bg-muted/10 hover:bg-muted/30"
                          }`}
                        >
                          {/* Left: Info */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-bold text-foreground">
                                  {c.contractNumber}
                                </span>

                                {isActive && (
                                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] px-2 py-0.5 gap-1 font-semibold">
                                    <CheckCircle2Icon className="size-3" />
                                    Active Contract
                                  </Badge>
                                )}

                                {isUpcoming && (
                                  <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px]">
                                    Upcoming ({c.startDate})
                                  </Badge>
                                )}

                                {isExpired && (
                                  <Badge variant="outline" className="border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400 text-[10px]">
                                    Expired
                                  </Badge>
                                )}

                                {c.status === "draft" && (
                                  <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 text-[10px]">
                                    Draft
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center gap-1 font-medium">
                                  <CalendarIcon className="size-3" />
                                  {formatDate(c.startDate)} → {formatDate(c.endDate)}
                                </span>
                                <span>•</span>
                                <span className="truncate max-w-[180px]" title={c.salaryStructureName || "Structure"}>
                                  {c.salaryStructureName || "Standard Structure"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Wage & Actions */}
                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <div className="text-right">
                              <span className="font-bold text-sm text-foreground block">
                                {formatCurrency(c.wage)} / mo
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {c.jobTitle || "Staff"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => onOpenEditModal(c)}
                                disabled={!canUpdate}
                                title={canUpdate ? "Edit Contract" : "Requires Manager privileges"}
                                className="size-7"
                              >
                                <PencilIcon className="size-3.5" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => onOpenDeleteModal(c)}
                                disabled={!canDelete}
                                title={canDelete ? "Delete Contract" : "Requires Manager privileges"}
                                className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2Icon className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
