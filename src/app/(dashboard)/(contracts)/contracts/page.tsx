"use client";

import * as React from "react";
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
import { Label } from "@/components/ui/label";
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
  XIcon,
  LockIcon,
  InfoIcon,
  Building2Icon,
  BriefcaseBusinessIcon,
  ClockIcon,
  CalculatorIcon,
} from "lucide-react";
import { toast } from "sonner";

type ContractItem = {
  id: string;
  contractNumber: string;
  employeeId: string;
  employeeName: string | null;
  employeeNumber: string | null;
  startDate: string;
  endDate: string | null;
  departmentId: string | null;
  departmentName: string | null;
  jobPositionId: string | null;
  jobTitle: string | null;
  workingScheduleId: string | null;
  workingScheduleName: string | null;
  salaryStructureId: string | null;
  salaryStructureName: string | null;
  wage: string | number;
  currency: string;
  status: "draft" | "active" | "expired" | "terminated" | "cancelled";
  createdAt: string;
};

type EmployeeOption = {
  id: string;
  fullName: string;
  employeeNumber: string;
  departmentId: string | null;
  departmentName: string | null;
  jobPositionId: string | null;
  jobTitle: string | null;
};

type DepartmentOption = {
  id: string;
  name: string;
  code: string;
};

type JobPositionOption = {
  id: string;
  title: string;
  code: string;
};

type WorkingScheduleOption = {
  id: string;
  name: string;
};

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

export default function ContractPage() {
  const { can } = useCan();
  const [contractsList, setContractsList] = React.useState<ContractItem[]>([]);
  const [employeesList, setEmployeesList] = React.useState<EmployeeOption[]>([]);
  const [departmentsList, setDepartmentsList] = React.useState<DepartmentOption[]>([]);
  const [jobPositionsList, setJobPositionsList] = React.useState<JobPositionOption[]>([]);
  const [schedulesList, setSchedulesList] = React.useState<WorkingScheduleOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  // Modal / Form View State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingContract, setEditingContract] = React.useState<ContractItem | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form Data State
  const [formData, setFormData] = React.useState({
    contractNumber: "",
    employeeId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    departmentId: "",
    jobPositionId: "",
    workingScheduleId: "",
    wage: "85000",
    currency: "INR",
    status: "active" as ContractItem["status"],
  });

  const canCreate = can("contract", "create");
  const canUpdate = can("contract", "update");
  const canDelete = can("contract", "delete");

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const [contractsRes, empRes, deptRes, jobRes, schedRes] = await Promise.all([
        fetch("/api/contracts"),
        fetch("/api/employees"),
        fetch("/api/departments"),
        fetch("/api/job-positions"),
        fetch("/api/working-schedules"),
      ]);

      const [contractsData, empData, deptData, jobData, schedData] = await Promise.all([
        contractsRes.json(),
        empRes.json(),
        deptRes.json(),
        jobRes.json(),
        schedRes.json(),
      ]);

      if (contractsData.data) setContractsList(contractsData.data);
      if (empData.data) setEmployeesList(empData.data);
      if (deptData.data) setDepartmentsList(deptData.data);
      if (jobData.data) setJobPositionsList(jobData.data);
      if (schedData.data) setSchedulesList(schedData.data);
    } catch (err) {
      console.error("Failed to load contract directory data:", err);
      toast.error("Failed to load contracts from database");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync department and job position when employee changes in form
  const handleEmployeeChange = (employeeId: string) => {
    const selectedEmp = employeesList.find((e) => e.id === employeeId);
    setFormData((prev) => ({
      ...prev,
      employeeId,
      departmentId: selectedEmp?.departmentId || prev.departmentId,
      jobPositionId: selectedEmp?.jobPositionId || prev.jobPositionId,
    }));
  };

  const openCreateModal = () => {
    if (!canCreate) {
      toast.error("Permission denied", {
        description: "You do not have privileges to create new contracts.",
      });
      return;
    }
    setEditingContract(null);

    const year = new Date().getFullYear();
    const nextNum = contractsList.length + 1;
    const autoNumber = `CON/${year}/${String(nextNum).padStart(4, "0")}`;

    const firstEmp = employeesList[0];

    setFormData({
      contractNumber: autoNumber,
      employeeId: firstEmp?.id || "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      departmentId: firstEmp?.departmentId || departmentsList[0]?.id || "",
      jobPositionId: firstEmp?.jobPositionId || jobPositionsList[0]?.id || "",
      workingScheduleId: schedulesList[0]?.id || "",
      wage: "85000",
      currency: "INR",
      status: "active",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (contract: ContractItem) => {
    if (!canUpdate) {
      toast.error("Permission denied", {
        description: "You do not have privileges to edit contract details.",
      });
      return;
    }
    setEditingContract(contract);
    setFormData({
      contractNumber: contract.contractNumber,
      employeeId: contract.employeeId,
      startDate: contract.startDate,
      endDate: contract.endDate || "",
      departmentId: contract.departmentId || "",
      jobPositionId: contract.jobPositionId || "",
      workingScheduleId: contract.workingScheduleId || "",
      wage: String(contract.wage),
      currency: contract.currency || "INR",
      status: contract.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (contract: ContractItem) => {
    if (!canDelete) {
      toast.error("Permission denied", {
        description: "You do not have privileges to delete contract records.",
      });
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete contract ${contract.contractNumber} for ${contract.employeeName || "Employee"}?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/contracts?id=${contract.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete contract");

      toast.success("Contract record deleted", {
        description: `Contract ${contract.contractNumber} has been removed.`,
      });
      setContractsList((prev) => prev.filter((item) => item.id !== contract.id));
    } catch (err: any) {
      toast.error("Action failed", { description: err.message });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingContract) {
        const res = await fetch("/api/contracts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingContract.id, ...formData }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update contract");

        toast.success("Contract updated successfully");
      } else {
        const res = await fetch("/api/contracts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create contract");

        toast.success("Contract created successfully");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Operation failed", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered list
  const filteredContracts = contractsList.filter((c) => {
    const matchesSearch =
      c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.employeeName && c.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.employeeNumber && c.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Key Metrics
  const totalCount = contractsList.length;
  const activeCount = contractsList.filter((c) => c.status === "active").length;
  const expiredCount = contractsList.filter((c) => c.status === "expired" || c.status === "terminated").length;
  const totalWageBudget = contractsList
    .filter((c) => c.status === "active")
    .reduce((sum, c) => sum + (Number(c.wage) || 0), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Contracts</h1>
            <Badge variant="outline" className="font-mono text-xs">
              {totalCount} Total
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            List view for sort, filter, and bulk management of employee contracts.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
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

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">Total Contracts</CardDescription>
            <FileTextIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">Across all staff & history</p>
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
            <p className="mt-1 text-xs text-muted-foreground">Active for current payroll</p>
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
            <p className="mt-1 text-xs text-muted-foreground">Total active payroll commit</p>
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
            <p className="mt-1 text-xs text-muted-foreground">Archived historical contracts</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-3">
            {/* Search */}
            <div className="relative md:col-span-2">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search contracts by number, employee name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="active">Running (Active)</option>
                <option value="draft">Draft</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Loading contract records from database...</span>
          </div>
        </Card>
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
                  <TableHead className="w-36">Contract</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Wage / Month</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {contract.contractNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{contract.employeeName || "Unassigned"}</span>
                        {contract.employeeNumber && (
                          <span className="text-xs font-mono text-muted-foreground">
                            {contract.employeeNumber}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {contract.startDate}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {contract.endDate || "—"}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {formatCurrency(Number(contract.wage) || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[11px] px-2.5 py-0.5 capitalize ${
                          statusColors[contract.status] || ""
                        }`}
                      >
                        {statusLabels[contract.status] || contract.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => openEditModal(contract)}
                          disabled={!canUpdate}
                          title={canUpdate ? "Edit / Form View" : "Requires HR Manager or Admin"}
                          className={!canUpdate ? "opacity-40 cursor-not-allowed" : ""}
                        >
                          {canUpdate ? (
                            <PencilIcon className="size-3.5" />
                          ) : (
                            <LockIcon className="size-3 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDelete(contract)}
                          disabled={!canDelete}
                          title={canDelete ? "Delete Contract" : "Requires HR Manager or Admin"}
                          className={
                            canDelete
                              ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
                              : "opacity-40 cursor-not-allowed"
                          }
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Useful Note Banner at List Bottom (From Wireframe) */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-800 dark:text-amber-300">
        <InfoIcon className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <div>
          <span className="font-semibold">Useful note:</span> Retain contract history but make the active <span className="font-semibold underline">Running</span> contract obvious because payroll depends on it.
        </div>
      </div>

      {/* Form View / Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-2xl animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h2 className="text-lg font-bold">
                  {editingContract
                    ? `Contract / ${editingContract.contractNumber}`
                    : `Contract / ${formData.contractNumber}`}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Form view of one contract</p>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsModalOpen(false)}
              >
                <XIcon className="size-4" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Employee */}
                <div className="space-y-1.5">
                  <Label htmlFor="employeeId">Employee</Label>
                  <select
                    id="employeeId"
                    required
                    value={formData.employeeId}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select Employee...</option>
                    {employeesList.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.employeeNumber})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <Label htmlFor="departmentId">Department</Label>
                  <select
                    id="departmentId"
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select Department...</option>
                    {departmentsList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Start Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Job Position */}
                <div className="space-y-1.5">
                  <Label htmlFor="jobPositionId">Job Position</Label>
                  <select
                    id="jobPositionId"
                    value={formData.jobPositionId}
                    onChange={(e) => setFormData({ ...formData, jobPositionId: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select Job Position...</option>
                    {jobPositionsList.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} ({j.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as ContractItem["status"],
                      })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="active">Running (Active)</option>
                    <option value="draft">Draft</option>
                    <option value="expired">Expired</option>
                    <option value="terminated">Terminated</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Wage / Month */}
                <div className="space-y-1.5">
                  <Label htmlFor="wage">Wage / Month (₹)</Label>
                  <Input
                    id="wage"
                    type="number"
                    required
                    step="100"
                    value={formData.wage}
                    onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
                    placeholder="e.g. 85000"
                  />
                </div>

                {/* Working Schedule */}
                <div className="space-y-1.5">
                  <Label htmlFor="workingScheduleId">Working Schedule</Label>
                  <select
                    id="workingScheduleId"
                    value={formData.workingScheduleId}
                    onChange={(e) => setFormData({ ...formData, workingScheduleId: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Standard 40 hours / week</option>
                    {schedulesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Salary Structure / Rules Box (From Wireframe) */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 mt-4">
                <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                  <CalculatorIcon className="size-4 text-primary" />
                  <span>Salary Structure / Rules</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">Structure Type:</span> Employee Salary.
                  This running contract is the source for payroll calculation in the active period.
                </p>
              </div>

              {/* Useful Note Banner in Form */}
              <div className="flex items-start gap-2.5 rounded-md bg-blue-500/5 border border-blue-500/20 p-3 text-xs text-blue-800 dark:text-blue-300">
                <InfoIcon className="size-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <div>
                  <span className="font-semibold">Useful note:</span> For the problem statement, one employee should not have multiple <span className="font-semibold">Running</span> contracts for the same period.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Saving..."
                    : editingContract
                    ? "Update Contract"
                    : "Create Contract"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

