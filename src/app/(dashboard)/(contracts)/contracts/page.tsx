"use client";

export const dynamic = "force-dynamic";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useCan } from "@/hooks/use-permissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PlusIcon,
  SearchIcon,
  PencilIcon,
  Trash2Icon,
  FileTextIcon,
  CheckCircle2Icon,
  DollarSignIcon,
  AlertCircleIcon,
  LockIcon,
  InfoIcon,
  Building2Icon,
  BriefcaseBusinessIcon,
  ClockIcon,
  HistoryIcon,
  LayersIcon,
  ListIcon,
  FilterIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  type ContractItem,
  type EmployeeOption,
  type DepartmentOption,
  type JobPositionOption,
  type WorkingScheduleOption,
  type SalaryStructureOption,
  getContractTimelineTag,
} from "@/features/contracts/types";
import { ContractGroupsView } from "@/features/contracts/components/contract-groups-view";
import { ContractFormDialog } from "@/features/contracts/components/contract-form-dialog";
import { ContractHistoryDialog } from "@/features/contracts/components/contract-history-dialog";
import { ContractDeleteDialog } from "@/features/contracts/components/contract-delete-dialog";

const statusColors: Record<string, string> = {
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold",
  draft: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  expired: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  terminated: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400",
  cancelled: "border-gray-500/30 bg-gray-500/10 text-gray-500 dark:text-gray-400",
};

const statusLabels: Record<string, string> = {
  active: "Running",
  draft: "Draft",
  expired: "Expired",
  terminated: "Terminated",
  cancelled: "Cancelled",
};

function ContractContent() {
  const { can } = useCan();
  const searchParams = useSearchParams();
  const initialEmployeeId = searchParams.get("employeeId");

  const [contractsList, setContractsList] = React.useState<ContractItem[]>([]);
  const [employeesList, setEmployeesList] = React.useState<EmployeeOption[]>([]);
  const [departmentsList, setDepartmentsList] = React.useState<DepartmentOption[]>([]);
  const [jobPositionsList, setJobPositionsList] = React.useState<JobPositionOption[]>([]);
  const [schedulesList, setSchedulesList] = React.useState<WorkingScheduleOption[]>([]);
  const [salaryStructuresList, setSalaryStructuresList] = React.useState<SalaryStructureOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // View Mode: 'table' or 'groups'
  const [viewMode, setViewMode] = React.useState<"table" | "groups">("table");

  // Filters
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = React.useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = React.useState<string | null>(initialEmployeeId);
  const [startDateFrom, setStartDateFrom] = React.useState<string>("");
  const [startDateTo, setStartDateTo] = React.useState<string>("");

  // Dialog States
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingContract, setEditingContract] = React.useState<ContractItem | null>(null);
  const [preselectedEmpId, setPreselectedEmpId] = React.useState<string | null>(null);

  const [historyEmployee, setHistoryEmployee] = React.useState<EmployeeOption | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);

  const [deletingContract, setDeletingContract] = React.useState<ContractItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const canCreate = can("contract", "create");
  const canUpdate = can("contract", "update");
  const canDelete = can("contract", "delete");

  const today = new Date().toISOString().split("T")[0];

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (employeeFilter) queryParams.set("employeeId", employeeFilter);
      if (departmentFilter && departmentFilter !== "all") queryParams.set("departmentId", departmentFilter);
      if (statusFilter && statusFilter !== "all") queryParams.set("status", statusFilter);
      if (startDateFrom) queryParams.set("startDateFrom", startDateFrom);
      if (startDateTo) queryParams.set("startDateTo", startDateTo);

      const contractUrl = queryParams.toString() ? `/api/contracts?${queryParams.toString()}` : "/api/contracts";

      const [contractsRes, empRes, deptRes, jobRes, schedRes, structRes] = await Promise.all([
        fetch(contractUrl),
        fetch("/api/employees"),
        fetch("/api/departments"),
        fetch("/api/job-positions"),
        fetch("/api/working-schedules"),
        fetch("/api/payroll/structures"),
      ]);

      const [contractsData, empData, deptData, jobData, schedData, structData] = await Promise.all([
        contractsRes.json(),
        empRes.json(),
        deptRes.json(),
        jobRes.json(),
        schedRes.json(),
        structRes.json(),
      ]);

      if (contractsData.data) setContractsList(contractsData.data);
      if (empData.data) setEmployeesList(empData.data);
      if (deptData.data) setDepartmentsList(deptData.data);
      if (jobData.data) setJobPositionsList(jobData.data);
      if (schedData.data) setSchedulesList(schedData.data);
      if (structData.data) setSalaryStructuresList(structData.data);
    } catch (err) {
      console.error("Failed to load contract directory data:", err);
      toast.error("Failed to load contracts from database");
    } finally {
      setIsLoading(false);
    }
  }, [employeeFilter, departmentFilter, statusFilter, startDateFrom, startDateTo]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = (empId?: string) => {
    if (!canCreate) {
      toast.error("Permission denied", {
        description: "You do not have privileges to create new contracts.",
      });
      return;
    }
    setEditingContract(null);
    setPreselectedEmpId(empId || employeeFilter || null);
    setIsFormOpen(true);
  };

  const openEditModal = (contract: ContractItem) => {
    if (!canUpdate) {
      toast.error("Permission denied", {
        description: "You do not have privileges to edit contract details.",
      });
      return;
    }
    setEditingContract(contract);
    setIsFormOpen(true);
  };

  const openDeleteModal = (contract: ContractItem) => {
    if (!canDelete) {
      toast.error("Permission denied", {
        description: "You do not have privileges to delete contract records.",
      });
      return;
    }
    setDeletingContract(contract);
    setIsDeleteOpen(true);
  };

  const openHistoryModalForContract = (contract: ContractItem) => {
    const emp =
      employeesList.find((e) => e.id === contract.employeeId) ||
      ({
        id: contract.employeeId,
        fullName: contract.employeeName || "Unknown Employee",
        employeeNumber: contract.employeeNumber || "EMP-0000",
        departmentId: contract.departmentId,
        jobPositionId: contract.jobPositionId,
      } as EmployeeOption);
    setHistoryEmployee(emp);
    setIsHistoryOpen(true);
  };

  const openHistoryModalForEmployee = (emp: EmployeeOption) => {
    setHistoryEmployee(emp);
    setIsHistoryOpen(true);
  };

  // Client-side search filtering
  const filteredContracts = React.useMemo(() => {
    return contractsList.filter((c) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.contractNumber.toLowerCase().includes(q) ||
        (c.employeeName && c.employeeName.toLowerCase().includes(q)) ||
        (c.employeeNumber && c.employeeNumber.toLowerCase().includes(q)) ||
        (c.departmentName && c.departmentName.toLowerCase().includes(q)) ||
        (c.jobTitle && c.jobTitle.toLowerCase().includes(q));

      return matchesSearch;
    });
  }, [contractsList, searchTerm]);

  // Key Metrics
  const totalCount = contractsList.length;
  const activeCount = contractsList.filter(
    (c) => getContractTimelineTag(c, today) === "active"
  ).length;
  const upcomingCount = contractsList.filter(
    (c) => getContractTimelineTag(c, today) === "upcoming"
  ).length;
  const expiredCount = contractsList.filter(
    (c) => getContractTimelineTag(c, today) === "expired" || c.status === "terminated"
  ).length;
  const totalWageBudget = contractsList
    .filter((c) => getContractTimelineTag(c, today) === "active")
    .reduce((sum, c) => sum + (Number(c.wage) || 0), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Ongoing";
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

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Contract Management</h1>
            <Badge variant="outline" className="font-mono text-xs">
              {totalCount} Total
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage employee employment contracts, wage agreements, historical progression, and payroll applicability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8 text-xs gap-1.5 px-3"
            >
              <ListIcon className="size-3.5" />
              Table View
            </Button>
            <Button
              variant={viewMode === "groups" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("groups")}
              className="h-8 text-xs gap-1.5 px-3"
            >
              <LayersIcon className="size-3.5" />
              Contract Groups
            </Button>
          </div>

          <Button
            onClick={() => openCreateModal()}
            disabled={!canCreate}
            className={!canCreate ? "opacity-60 cursor-not-allowed" : ""}
            title={canCreate ? "Create new contract" : "Requires HR Manager or Admin privileges"}
          >
            {canCreate ? (
              <PlusIcon className="mr-1.5 size-4" />
            ) : (
              <LockIcon className="mr-1.5 size-4" />
            )}
            New Contract
          </Button>
        </div>
      </div>

      {/* Employee Filter Banner (when navigated from employee directory) */}
      {employeeFilter && (
        <div className="flex items-center justify-between rounded-lg bg-blue-500/10 border border-blue-500/30 px-4 py-2.5 text-xs text-blue-700 dark:text-blue-300">
          <div className="flex items-center gap-2">
            <InfoIcon className="size-4 shrink-0 text-blue-600" />
            <span>
              Filtering contracts for selected employee{" "}
              <strong className="underline">
                {employeesList.find((e) => e.id === employeeFilter)?.fullName || employeeFilter}
              </strong>
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEmployeeFilter(null)}
            className="h-7 text-xs gap-1"
          >
            <XIcon className="size-3" />
            Clear Filter
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">Total Contracts</CardDescription>
            <FileTextIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">Historical records on file</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">Running (Active)</CardDescription>
            <CheckCircle2Icon className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {activeCount}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {upcomingCount > 0 ? `+${upcomingCount} upcoming scheduled` : "Applicable for current payruns"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">Monthly Active Wage</CardDescription>
            <DollarSignIcon className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(totalWageBudget)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Monthly payroll commitment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">Expired / Terminated</CardDescription>
            <AlertCircleIcon className="size-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {expiredCount}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Archived employment history</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by contract #, employee name, job title, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Departments</option>
                {departmentsList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active (Running)</option>
                <option value="draft">Draft</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Secondary Date Range Filter */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t text-xs">
            <span className="text-muted-foreground flex items-center gap-1 font-medium">
              <FilterIcon className="size-3" />
              Start Date Range:
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDateFrom}
                onChange={(e) => setStartDateFrom(e.target.value)}
                placeholder="From date"
                className="h-7 w-36 text-xs"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={startDateTo}
                onChange={(e) => setStartDateTo(e.target.value)}
                placeholder="To date"
                className="h-7 w-36 text-xs"
              />
              {(startDateFrom || startDateTo || departmentFilter !== "all" || statusFilter !== "all" || searchTerm) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStartDateFrom("");
                    setStartDateTo("");
                    setDepartmentFilter("all");
                    setStatusFilter("all");
                    setSearchTerm("");
                  }}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                >
                  Reset Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main View Area */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Loading contracts from database...</span>
          </div>
        </Card>
      ) : viewMode === "groups" ? (
        <ContractGroupsView
          contracts={filteredContracts}
          employeesList={employeesList}
          onOpenCreateModal={openCreateModal}
          onOpenEditModal={openEditModal}
          onOpenDeleteModal={openDeleteModal}
          onOpenHistoryModal={openHistoryModalForEmployee}
          canCreate={canCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />
      ) : filteredContracts.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <FileTextIcon className="mx-auto size-8 text-muted-foreground" />
          <h3 className="mt-3 text-base font-semibold">No contracts found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No contracts match your current search or filter criteria.
          </p>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36">Contract #</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Job Position</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Wage / Month</TableHead>
                  <TableHead>Salary Structure</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applicable</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => {
                  const tag = getContractTimelineTag(contract, today);
                  const isCurrentActive = tag === "active";

                  return (
                    <TableRow
                      key={contract.id}
                      className={isCurrentActive ? "bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06]" : ""}
                    >
                      {/* Contract # */}
                      <TableCell className="font-mono text-xs font-bold text-primary">
                        {contract.contractNumber}
                      </TableCell>

                      {/* Employee */}
                      <TableCell>
                        <div
                          className="flex flex-col cursor-pointer group"
                          onClick={() => openHistoryModalForContract(contract)}
                          title="Click to view full employment contract history"
                        >
                          <span className="font-medium text-sm group-hover:underline text-foreground">
                            {contract.employeeName || "Unassigned"}
                          </span>
                          {contract.employeeNumber && (
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {contract.employeeNumber}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Department */}
                      <TableCell className="text-xs">
                        <span className="font-medium text-muted-foreground">
                          {contract.departmentName || "—"}
                        </span>
                      </TableCell>

                      {/* Job Title */}
                      <TableCell className="text-xs">
                        <span className="text-foreground font-medium">
                          {contract.jobTitle || "—"}
                        </span>
                      </TableCell>

                      {/* Period */}
                      <TableCell className="text-xs whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {formatDate(contract.startDate)}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            to {formatDate(contract.endDate)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Wage / Month */}
                      <TableCell className="text-xs font-bold whitespace-nowrap">
                        {formatCurrency(Number(contract.wage) || 0)}
                      </TableCell>

                      {/* Salary Structure */}
                      <TableCell className="text-xs">
                        <span className="truncate max-w-[150px] block text-muted-foreground" title={contract.salaryStructureName || "Standard"}>
                          {contract.salaryStructureName || "Standard Structure"}
                        </span>
                      </TableCell>

                      {/* Lifecycle Status */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[11px] px-2 py-0.5 capitalize ${
                            statusColors[contract.status] || ""
                          }`}
                        >
                          {statusLabels[contract.status] || contract.status}
                        </Badge>
                      </TableCell>

                      {/* Currently Applicable Indicator */}
                      <TableCell>
                        {isCurrentActive ? (
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] px-2 py-0.5 gap-1 font-semibold whitespace-nowrap shadow-xs">
                            <span className="size-1.5 rounded-full bg-white animate-pulse" />
                            CURRENT ACTIVE
                          </Badge>
                        ) : tag === "upcoming" ? (
                          <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] whitespace-nowrap">
                            Upcoming
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Historical</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => openHistoryModalForContract(contract)}
                            title="View Employee Contract Timeline"
                            className="size-7"
                          >
                            <HistoryIcon className="size-3.5 text-muted-foreground hover:text-foreground" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => openEditModal(contract)}
                            disabled={!canUpdate}
                            title={canUpdate ? "Edit Contract Terms" : "Requires HR Manager privileges"}
                            className="size-7"
                          >
                            <PencilIcon className="size-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => openDeleteModal(contract)}
                            disabled={!canDelete}
                            title={canDelete ? "Delete Contract" : "Requires HR Manager privileges"}
                            className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Useful Note Banner at Bottom */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-800 dark:text-amber-300">
        <InfoIcon className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <div>
          <span className="font-semibold">Contract Lifecycle & Payroll Policy:</span> An employee can have multiple historical and sequential contracts. For each payrun period, the payroll engine validates that exactly one contract covers the payroll period, ensuring historical contracts are never overwritten.
        </div>
      </div>

      {/* Modals & Dialogs */}
      <ContractFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingContract={editingContract}
        employeesList={employeesList}
        departmentsList={departmentsList}
        jobPositionsList={jobPositionsList}
        schedulesList={schedulesList}
        salaryStructuresList={salaryStructuresList}
        allContracts={contractsList}
        preselectedEmployeeId={preselectedEmpId}
        onSuccess={fetchData}
      />

      <ContractHistoryDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        employee={historyEmployee}
        contracts={contractsList}
        onEditContract={openEditModal}
        onAddContract={(empId) => openCreateModal(empId)}
        canEdit={canUpdate}
      />

      <ContractDeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        contract={deletingContract}
        onSuccess={fetchData}
      />
    </div>
  );
}

export default function ContractPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading contract management...</div>}>
      <ContractContent />
    </React.Suspense>
  );
}
