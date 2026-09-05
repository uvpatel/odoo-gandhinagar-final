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
  Building2Icon,
  PlusIcon,
  SearchIcon,
  PencilIcon,
  Trash2Icon,
  UsersIcon,
  CheckCircle2Icon,
  XIcon,
  LockIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { toast } from "sonner";

type DepartmentItem = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  employeeCount: number;
  createdAt: string;
};

export default function DepartmentsPage() {
  const { can, role } = useCan();
  const [departments, setDepartments] = React.useState<DepartmentItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingDept, setEditingDept] = React.useState<DepartmentItem | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    name: "",
    code: "",
    description: "",
    isActive: true,
  });

  const canCreate = can("department", "create");
  const canUpdate = can("department", "update");
  const canDelete = can("department", "delete");

  const fetchDepartments = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/departments");
      const data = await res.json();
      if (data.data) setDepartments(data.data);
    } catch (err) {
      console.error("Failed to load departments:", err);
      toast.error("Failed to load departments from database");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const openCreateModal = () => {
    if (!canCreate) {
      toast.error("Permission denied", {
        description: "You do not have privileges to create new departments.",
      });
      return;
    }
    setEditingDept(null);
    setFormData({
      name: "",
      code: "",
      description: "",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (dept: DepartmentItem) => {
    if (!canUpdate) {
      toast.error("Permission denied", {
        description: "You do not have privileges to edit departments.",
      });
      return;
    }
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || "",
      isActive: dept.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (dept: DepartmentItem) => {
    if (!canDelete) {
      toast.error("Permission denied", {
        description: "You do not have privileges to delete departments.",
      });
      return;
    }

    if (dept.employeeCount > 0) {
      toast.error("Cannot delete department", {
        description: `This department has ${dept.employeeCount} assigned employees. Please reassign them first.`,
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete department "${dept.name}" (${dept.code})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/departments?id=${dept.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete department");

      toast.success("Department deleted successfully");
      setDepartments((prev) => prev.filter((d) => d.id !== dept.id));
    } catch (err: any) {
      toast.error("Delete failed", { description: err.message });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingDept) {
        const res = await fetch("/api/departments", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingDept.id, ...formData }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update department");

        toast.success("Department updated successfully");
      } else {
        const res = await fetch("/api/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create department");

        toast.success("Department created successfully");
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err: any) {
      toast.error("Action failed", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalHeadcount = departments.reduce((acc, curr) => acc + (curr.employeeCount || 0), 0);
  const activeDeptsCount = departments.filter((d) => d.isActive).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
            <Badge variant="outline" className="font-mono text-xs">
              {departments.length} Units
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Structure your organization into functional divisions and oversee team headcounts.
          </p>
        </div>

        <div>
          <Button
            onClick={openCreateModal}
            disabled={!canCreate}
            className={!canCreate ? "opacity-60 cursor-not-allowed" : ""}
            title={canCreate ? "Add Department" : "Requires HR Manager or Admin privileges"}
          >
            {canCreate ? (
              <PlusIcon className="mr-1.5 size-4" />
            ) : (
              <LockIcon className="mr-1.5 size-4" />
            )}
            New Department
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">Total Departments</CardDescription>
            <Building2Icon className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">Configured in organization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">Active Divisions</CardDescription>
            <CheckCircle2Icon className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {activeDeptsCount}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Operational units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">Total Staff Assigned</CardDescription>
            <UsersIcon className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHeadcount}</div>
            <p className="mt-1 text-xs text-muted-foreground">Assigned across all departments</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search departments by name, code (e.g. HR, FIN, ENG)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Code</TableHead>
                <TableHead>Department Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Team Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading departments from Neon DB...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredDepts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No departments found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDepts.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell>
                      <span className="font-mono font-semibold text-primary">{dept.code}</span>
                    </TableCell>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                      {dept.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1 font-mono text-xs">
                        <UsersIcon className="size-3" />
                        {dept.employeeCount} {dept.employeeCount === 1 ? "member" : "members"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {dept.isActive ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[10px]"
                        >
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => openEditModal(dept)}
                          disabled={!canUpdate}
                          title={canUpdate ? "Edit Department" : "Requires HR Manager or Admin"}
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
                          onClick={() => handleDelete(dept)}
                          disabled={!canDelete || dept.employeeCount > 0}
                          title={
                            dept.employeeCount > 0
                              ? "Cannot delete: employees assigned"
                              : canDelete
                              ? "Delete Department"
                              : "Requires HR Manager or Admin"
                          }
                          className={
                            canDelete && dept.employeeCount === 0
                              ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
                              : "opacity-40 cursor-not-allowed"
                          }
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingDept ? `Edit Department: ${editingDept.name}` : "Create New Department"}
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
              <div className="space-y-1.5">
                <Label htmlFor="deptName">Department Name</Label>
                <Input
                  id="deptName"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Research & Development"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="deptCode">Department Code</Label>
                <Input
                  id="deptCode"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. RND"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="deptDescription">Description</Label>
                <Input
                  id="deptDescription"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Focus areas and departmental functions..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="deptActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="deptActive" className="cursor-pointer">
                  Department is active
                </Label>
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
                    : editingDept
                    ? "Update Department"
                    : "Create Department"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

