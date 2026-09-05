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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  PlusIcon,
  SearchIcon,
  PencilIcon,
  Trash2Icon,
  UsersIcon,
  UserCheckIcon,
  Building2Icon,
  BriefcaseBusinessIcon,
  LayoutGridIcon,
  ListIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  XIcon,
  LockIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { toast } from "sonner";

type EmployeeItem = {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  workEmail: string | null;
  phone: string | null;
  departmentId: string | null;
  departmentName: string | null;
  departmentCode: string | null;
  jobPositionId: string | null;
  jobTitle: string | null;
  jobCode: string | null;
  managerId: string | null;
  managerName: string | null;
  employeeType: "full_time" | "part_time" | "contract" | "intern";
  status: "draft" | "active" | "inactive" | "terminated";
  joiningDate: string | null;
  bankAccountNumber: string | null;
  bankName: string | null;
  createdAt: string;
  avatar: string | null;
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

const statusColors: Record<string, string> = {
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  draft: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  inactive: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400",
  terminated: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

const typeLabels: Record<string, string> = {
  full_time: "Full-Time",
  part_time: "Part-Time",
  contract: "Contract",
  intern: "Internship",
};

export default function EmployeesPage() {
  const { can, role } = useCan();
  const [employeesList, setEmployeesList] = React.useState<EmployeeItem[]>([]);
  const [departmentsList, setDepartmentsList] = React.useState<DepartmentOption[]>([]);
  const [jobPositionsList, setJobPositionsList] = React.useState<JobPositionOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<"table" | "grid">("table");

  // Filters
  const [searchTerm, setSearchTerm] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<EmployeeItem | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    workEmail: "",
    phone: "",
    departmentId: "",
    jobPositionId: "",
    employeeType: "full_time" as EmployeeItem["employeeType"],
    status: "active" as EmployeeItem["status"],
    joiningDate: new Date().toISOString().split("T")[0],
    bankAccountNumber: "",
    bankName: "",
  });

  const canCreate = can("employee", "create");
  const canUpdate = can("employee", "update");
  const canDelete = can("employee", "delete");

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const [empRes, deptRes, jobRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/departments"),
        fetch("/api/job-positions"),
      ]);

      const [empData, deptData, jobData] = await Promise.all([
        empRes.json(),
        deptRes.json(),
        jobRes.json(),
      ]);

      if (empData.data) setEmployeesList(empData.data);
      if (deptData.data) setDepartmentsList(deptData.data);
      if (jobData.data) setJobPositionsList(jobData.data);
    } catch (err) {
      console.error("Failed to load employee directory data:", err);
      toast.error("Failed to load employees from database");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = () => {
    if (!canCreate) {
      toast.error("Permission denied", {
        description: "You do not have privileges to add new employees.",
      });
      return;
    }
    setEditingEmployee(null);
    setFormData({
      firstName: "",
      lastName: "",
      workEmail: "",
      phone: "",
      departmentId: departmentsList[0]?.id || "",
      jobPositionId: jobPositionsList[0]?.id || "",
      employeeType: "full_time",
      status: "active",
      joiningDate: new Date().toISOString().split("T")[0],
      bankAccountNumber: "",
      bankName: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (emp: EmployeeItem) => {
    if (!canUpdate) {
      toast.error("Permission denied", {
        description: "You do not have privileges to edit employee records.",
      });
      return;
    }
    setEditingEmployee(emp);
    setFormData({
      firstName: emp.firstName,
      lastName: emp.lastName,
      workEmail: emp.workEmail || "",
      phone: emp.phone || "",
      departmentId: emp.departmentId || "",
      jobPositionId: emp.jobPositionId || "",
      employeeType: emp.employeeType,
      status: emp.status,
      joiningDate: emp.joiningDate || new Date().toISOString().split("T")[0],
      bankAccountNumber: emp.bankAccountNumber || "",
      bankName: emp.bankName || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (emp: EmployeeItem) => {
    if (!canDelete) {
      toast.error("Permission denied", {
        description: "You do not have privileges to delete employee records.",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${emp.fullName} (${emp.employeeNumber})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/employees?id=${emp.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete employee");

      toast.success("Employee record deleted", {
        description: `${emp.fullName} has been removed from the directory.`,
      });
      setEmployeesList((prev) => prev.filter((item) => item.id !== emp.id));
    } catch (err: any) {
      toast.error("Action failed", { description: err.message });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingEmployee) {
        const res = await fetch("/api/employees", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingEmployee.id, ...formData }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update employee");

        toast.success("Employee updated successfully");
      } else {
        const res = await fetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create employee");

        toast.success("Employee created successfully");
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
  const filteredEmployees = employeesList.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.workEmail && emp.workEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      emp.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = departmentFilter === "all" || emp.departmentId === departmentFilter;
    const matchesStatus = statusFilter === "all" || emp.status === statusFilter;
    const matchesType = typeFilter === "all" || emp.employeeType === typeFilter;

    return matchesSearch && matchesDept && matchesStatus && matchesType;
  });

  // Metrics
  const totalCount = employeesList.length;
  const activeCount = employeesList.filter((e) => e.status === "active").length;
  const fullTimeCount = employeesList.filter((e) => e.employeeType === "full_time").length;
  const departmentsCount = new Set(employeesList.map((e) => e.departmentId).filter(Boolean)).size;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Employees Directory</h1>
            <Badge variant="outline" className="font-mono text-xs">
              {totalCount} Total
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your organization&apos;s personnel, departmental assignments, and employment records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon-xs"
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <ListIcon className="size-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon-xs"
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              <LayoutGridIcon className="size-4" />
            </Button>
          </div>

          {/* Add Employee Button */}
          <Button
            onClick={openCreateModal}
            disabled={!canCreate}
            className={!canCreate ? "opacity-60 cursor-not-allowed" : ""}
            title={canCreate ? "Add new employee" : "Requires HR Manager or Admin privileges"}
          >
            {canCreate ? (
              <PlusIcon className="mr-1.5 size-4" />
            ) : (
              <LockIcon className="mr-1.5 size-4" />
            )}
            New Employee
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">Total Headcount</CardDescription>
            <UsersIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">Across all business units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">Active Staff</CardDescription>
            <UserCheckIcon className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {activeCount}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0}% active rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">Active Departments</CardDescription>
            <Building2Icon className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departmentsCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">Operational divisions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">Full-Time Ratio</CardDescription>
            <BriefcaseBusinessIcon className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fullTimeCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {totalCount > 0 ? Math.round((fullTimeCount / totalCount) * 100) : 0}% permanent staff
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-4">
            {/* Search */}
            <div className="relative md:col-span-1">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Departments</option>
                {departmentsList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>

            {/* Employment Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Employment Types</option>
                <option value="full_time">Full-Time</option>
                <option value="part_time">Part-Time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content View */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Loading employee records from Neon DB...</span>
          </div>
        </Card>
      ) : filteredEmployees.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <UsersIcon className="mx-auto size-8 text-muted-foreground" />
          <h3 className="mt-3 text-base font-semibold">No employees found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No employee records match your selected search and filtering criteria.
          </p>
        </Card>
      ) : viewMode === "table" ? (
        /* Table View */
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">ID</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-mono text-xs font-medium text-primary">
                      {emp.employeeNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarImage src={emp.avatar || undefined} />
                          <AvatarFallback className="text-xs">
                            {emp.firstName.charAt(0)}
                            {emp.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium leading-none">{emp.fullName}</span>
                          <span className="mt-1 text-xs text-muted-foreground">
                            {emp.workEmail || "—"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {emp.departmentName ? (
                        <Badge variant="outline" className="text-[10px]">
                          {emp.departmentName}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {emp.jobTitle || "—"}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {typeLabels[emp.employeeType] || emp.employeeType}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`capitalize text-[10px] ${statusColors[emp.status] || ""}`}
                      >
                        {emp.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {emp.joiningDate || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => openEditModal(emp)}
                          disabled={!canUpdate}
                          title={canUpdate ? "Edit Employee" : "Requires HR Manager or Admin"}
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
                          onClick={() => handleDelete(emp)}
                          disabled={!canDelete}
                          title={canDelete ? "Delete Employee" : "Requires HR Manager or Admin"}
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
      ) : (
        /* Grid Card View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((emp) => (
            <Card key={emp.id} className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-start justify-between pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarImage src={emp.avatar || undefined} />
                    <AvatarFallback>
                      {emp.firstName.charAt(0)}
                      {emp.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{emp.fullName}</CardTitle>
                    <CardDescription className="text-xs font-mono text-primary">
                      {emp.employeeNumber}
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`capitalize text-[10px] ${statusColors[emp.status] || ""}`}
                >
                  {emp.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="space-y-1 rounded-md bg-muted/40 p-2.5 text-xs">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <BriefcaseBusinessIcon className="size-3.5 text-muted-foreground" />
                    <span>{emp.jobTitle || "No Position Assigned"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2Icon className="size-3.5" />
                    <span>{emp.departmentName || "No Department"}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {emp.workEmail && (
                    <div className="flex items-center gap-2">
                      <MailIcon className="size-3.5" />
                      <span className="truncate">{emp.workEmail}</span>
                    </div>
                  )}
                  {emp.phone && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="size-3.5" />
                      <span>{emp.phone}</span>
                    </div>
                  )}
                  {emp.joiningDate && (
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="size-3.5" />
                      <span>Joined {emp.joiningDate}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {typeLabels[emp.employeeType]}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => openEditModal(emp)}
                      disabled={!canUpdate}
                    >
                      <PencilIcon className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(emp)}
                      disabled={!canDelete}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Employee Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingEmployee ? `Edit Employee: ${editingEmployee.fullName}` : "Add New Employee"}
              </h2>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsModalOpen(false)}
              >
                <XIcon className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="e.g. Alex"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="e.g. Morgan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="workEmail">Work Email</Label>
                  <Input
                    id="workEmail"
                    type="email"
                    value={formData.workEmail}
                    onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                    placeholder="alex@peoplepay360.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="employeeType">Employment Type</Label>
                  <select
                    id="employeeType"
                    value={formData.employeeType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        employeeType: e.target.value as EmployeeItem["employeeType"],
                      })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="full_time">Full-Time</option>
                    <option value="part_time">Part-Time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as EmployeeItem["status"],
                      })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="inactive">Inactive</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="joiningDate">Joining Date</Label>
                  <Input
                    id="joiningDate"
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="e.g. HDFC Bank"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                  <Input
                    id="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    placeholder="e.g. 50100234567890"
                  />
                </div>
              </div>

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
                    : editingEmployee
                    ? "Update Employee"
                    : "Create Employee"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

