"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePayrunWizardStore } from "../../store/wizard-store";
import { type EligibleEmployee } from "../../types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  ArrowLeftIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  XCircleIcon,
  SearchIcon,
  UsersIcon,
  Building2Icon,
  Loader2Icon,
  CreditCardIcon,
  CoinsIcon,
} from "lucide-react";
import { toast } from "sonner";

export function StepEmployees() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    salaryStructureId,
    salaryStructureName,
    periodStart,
    periodEnd,
    runName,
    selectedEmployeeIds,
    searchTerm,
    departmentFilter,
    eligibilityFilter,
    setStep,
    toggleEmployee,
    selectAllEligible,
    deselectAll,
    setSearchTerm,
    setDepartmentFilter,
    setEligibilityFilter,
    resetWizard,
  } = usePayrunWizardStore();

  // Fetch eligible employees for this period & structure
  const {
    data: employeesData,
    isLoading: isLoadingEmployees,
    error: employeesError,
  } = useQuery<{ data: EligibleEmployee[] }>({
    queryKey: ["eligible-employees", periodStart, periodEnd, salaryStructureId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (periodStart) params.set("startDate", periodStart);
      if (periodEnd) params.set("endDate", periodEnd);
      if (salaryStructureId) params.set("structureId", salaryStructureId);
      const res = await fetch(`/api/payroll/payruns/eligible-employees?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load eligible employees");
      }
      return res.json();
    },
    enabled: Boolean(periodStart && periodEnd),
  });

  const employees = employeesData?.data || [];

  // Fetch departments for filter dropdown
  const { data: deptsData } = useQuery<{ data: Array<{ id: string; name: string }> }>({
    queryKey: ["departments-list"],
    queryFn: async () => {
      const res = await fetch("/api/departments");
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });
  const departments = deptsData?.data || [];

  // Auto-select all eligible employees once loaded if nothing is selected yet
  React.useEffect(() => {
    if (employees.length > 0 && selectedEmployeeIds.length === 0) {
      selectAllEligible(employees);
    }
  }, [employees, selectedEmployeeIds.length, selectAllEligible]);

  // Client-side filtering
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = emp.fullName.toLowerCase().includes(term);
        const matchesNumber = emp.employeeNumber.toLowerCase().includes(term);
        const matchesEmail = emp.workEmail?.toLowerCase().includes(term) ?? false;
        if (!matchesName && !matchesNumber && !matchesEmail) return false;
      }

      // Department filter
      if (departmentFilter !== "all" && emp.departmentId !== departmentFilter) {
        return false;
      }

      // Eligibility filter
      if (eligibilityFilter !== "all" && emp.eligibility !== eligibilityFilter) {
        return false;
      }

      return true;
    });
  }, [employees, searchTerm, departmentFilter, eligibilityFilter]);

  // Mutation to persist payrun
  const createPayrunMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/payroll/payruns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: runName,
          salaryStructureId,
          periodStart,
          periodEnd,
          employeeIds: selectedEmployeeIds,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create payrun");
      }
      return res.json();
    },
    onSuccess: (result) => {
      toast.success("Payrun created successfully!");
      queryClient.invalidateQueries({ queryKey: ["payruns"] });
      resetWizard();
      router.push(`/payroll/payruns/${result.data.id}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create payrun");
    },
  });

  const handleCreatePayrun = () => {
    if (selectedEmployeeIds.length === 0) {
      toast.error("Please select at least one employee to include in the payrun");
      return;
    }
    createPayrunMutation.mutate();
  };

  const eligibleCount = employees.filter(
    (e) => e.eligibility === "eligible" || e.eligibility === "warning"
  ).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Scope Summary Banner */}
      <Card className="bg-muted/40 border-border/70">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <UsersIcon className="size-5" />
            </div>
            <div>
              <div className="font-semibold text-foreground text-sm sm:text-base">
                {runName || "Payrun"}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span>Period: <strong>{periodStart}</strong> &rarr; <strong>{periodEnd}</strong></span>
                <span>&bull;</span>
                <span>Structure: <strong>{salaryStructureName}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(1)}
              className="gap-1.5"
            >
              <ArrowLeftIcon className="size-3.5" />
              <span>Edit Scope</span>
            </Button>
            <Badge variant="secondary" className="px-2.5 py-1 text-xs">
              {selectedEmployeeIds.length} of {eligibleCount} Selected
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Table Card */}
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <span>Select Eligible Employees</span>
                <span className="text-xs font-normal text-muted-foreground">
                  ({filteredEmployees.length} shown)
                </span>
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Only active employees with active contracts in this cycle can be processed into draft payslips.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectAllEligible(employees)}
                disabled={employees.length === 0}
              >
                Select All Eligible
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={deselectAll}
                disabled={selectedEmployeeIds.length === 0}
              >
                Deselect All
              </Button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            <Select
              value={departmentFilter}
              onValueChange={(val) => setDepartmentFilter(val ?? "all")}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={eligibilityFilter}
              onValueChange={(val: any) => setEligibilityFilter(val ?? "all")}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="eligible">Eligible Only</SelectItem>
                <SelectItem value="warning">Warnings Only</SelectItem>
                <SelectItem value="ineligible">Ineligible Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoadingEmployees ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2Icon className="size-6 animate-spin text-primary" />
              <p className="text-sm">Evaluating active contracts and attendance records...</p>
            </div>
          ) : employeesError ? (
            <div className="p-8 text-center text-destructive">
              <p className="text-sm font-semibold">Error evaluating employees</p>
              <p className="text-xs mt-1">{(employeesError as any).message}</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm font-medium">No matching employees found</p>
              <p className="text-xs mt-1">Try broadening your search query or department filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-border size-4 cursor-pointer accent-primary"
                        checked={
                          eligibleCount > 0 &&
                          selectedEmployeeIds.length === eligibleCount
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAllEligible(employees);
                          } else {
                            deselectAll();
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department / Role</TableHead>
                    <TableHead>Active Contract</TableHead>
                    <TableHead>Bank Account</TableHead>
                    <TableHead>Eligibility Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((emp) => {
                    const isSelected = selectedEmployeeIds.includes(emp.id);
                    const isIneligible = emp.eligibility === "ineligible";

                    return (
                      <TableRow
                        key={emp.id}
                        className={
                          isIneligible
                            ? "opacity-60 bg-muted/20"
                            : isSelected
                            ? "bg-primary/5"
                            : undefined
                        }
                      >
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            className="rounded border-border size-4 cursor-pointer accent-primary disabled:cursor-not-allowed"
                            disabled={isIneligible}
                            checked={isSelected}
                            onChange={() => toggleEmployee(emp.id)}
                          />
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground text-sm">
                              {emp.fullName}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {emp.employeeNumber} {emp.workEmail && `· ${emp.workEmail}`}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col text-xs">
                            <span className="font-medium text-foreground">
                              {emp.departmentName || "No Department"}
                            </span>
                            <span className="text-muted-foreground">
                              {emp.jobTitle || "General"}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          {emp.contract ? (
                            <div className="flex flex-col text-xs">
                              <span className="font-mono font-medium text-foreground">
                                {emp.contract.contractNumber}
                              </span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                ₹{emp.contract.wage.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-destructive font-medium">
                              No Active Contract
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          {emp.bankAccountNumber ? (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <CreditCardIcon className="size-3.5 text-emerald-500" />
                              <span className="font-mono">
                                ••••{emp.bankAccountNumber.slice(-4)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                              <AlertTriangleIcon className="size-3" />
                              Missing
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          {emp.eligibility === "eligible" ? (
                            <Badge variant="outline" className="text-xs gap-1 border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30">
                              <CheckCircle2Icon className="size-3" />
                              <span>Eligible</span>
                            </Badge>
                          ) : emp.eligibility === "warning" ? (
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className="text-xs gap-1 border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 w-fit">
                                <AlertTriangleIcon className="size-3" />
                                <span>Warning</span>
                              </Badge>
                              <span className="text-[11px] text-amber-700 dark:text-amber-300">
                                {emp.warningMessage}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <Badge variant="destructive" className="text-xs gap-1 w-fit">
                                <XCircleIcon className="size-3" />
                                <span>Ineligible</span>
                              </Badge>
                              <span className="text-[11px] text-destructive">
                                {emp.warningMessage || "Missing contract requirements"}
                              </span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Footer Actions */}
        <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20">
          <Button
            variant="outline"
            onClick={() => setStep(1)}
            className="gap-2 w-full sm:w-auto"
          >
            <ArrowLeftIcon className="size-4" />
            <span>Back to Scope</span>
          </Button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <span className="text-xs text-muted-foreground">
              {selectedEmployeeIds.length} employee{selectedEmployeeIds.length === 1 ? "" : "s"} will be initialized with draft payslips.
            </span>
            <Button
              onClick={handleCreatePayrun}
              disabled={selectedEmployeeIds.length === 0 || createPayrunMutation.isPending}
              className="gap-2 w-full sm:w-auto"
            >
              {createPayrunMutation.isPending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  <span>Generating Payrun...</span>
                </>
              ) : (
                <>
                  <CoinsIcon className="size-4" />
                  <span>Create Payrun ({selectedEmployeeIds.length})</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
