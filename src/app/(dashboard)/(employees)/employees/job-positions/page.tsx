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
  BriefcaseBusinessIcon,
  PlusIcon,
  SearchIcon,
  PencilIcon,
  Trash2Icon,
  UsersIcon,
  CheckCircle2Icon,
  XIcon,
  LockIcon,
} from "lucide-react";
import { toast } from "sonner";

type JobPositionItem = {
  id: string;
  title: string;
  code: string;
  description: string | null;
  isActive: boolean;
  employeeCount: number;
  createdAt: string;
};

export default function JobPositionsPage() {
  const { can, role } = useCan();
  const [jobPositions, setJobPositions] = React.useState<JobPositionItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingJob, setEditingJob] = React.useState<JobPositionItem | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    title: "",
    code: "",
    description: "",
    isActive: true,
  });

  const canCreate = can("jobPosition", "create");
  const canUpdate = can("jobPosition", "update");
  const canDelete = can("jobPosition", "delete");

  const fetchJobPositions = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/job-positions");
      const data = await res.json();
      if (data.data) setJobPositions(data.data);
    } catch (err) {
      console.error("Failed to load job positions:", err);
      toast.error("Failed to load job positions from database");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchJobPositions();
  }, [fetchJobPositions]);

  const openCreateModal = () => {
    if (!canCreate) {
      toast.error("Permission denied", {
        description: "You do not have privileges to create new job positions.",
      });
      return;
    }
    setEditingJob(null);
    setFormData({
      title: "",
      code: "",
      description: "",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (job: JobPositionItem) => {
    if (!canUpdate) {
      toast.error("Permission denied", {
        description: "You do not have privileges to edit job positions.",
      });
      return;
    }
    setEditingJob(job);
    setFormData({
      title: job.title,
      code: job.code,
      description: job.description || "",
      isActive: job.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (job: JobPositionItem) => {
    if (!canDelete) {
      toast.error("Permission denied", {
        description: "You do not have privileges to delete job positions.",
      });
      return;
    }

    if (job.employeeCount > 0) {
      toast.error("Cannot delete job position", {
        description: `This position is currently held by ${job.employeeCount} employee(s). Please reassign them first.`,
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete job position "${job.title}" (${job.code})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/job-positions?id=${job.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete job position");

      toast.success("Job position deleted successfully");
      setJobPositions((prev) => prev.filter((j) => j.id !== job.id));
    } catch (err: any) {
      toast.error("Delete failed", { description: err.message });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingJob) {
        const res = await fetch("/api/job-positions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingJob.id, ...formData }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update job position");

        toast.success("Job position updated successfully");
      } else {
        const res = await fetch("/api/job-positions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create job position");

        toast.success("Job position created successfully");
      }
      setIsModalOpen(false);
      fetchJobPositions();
    } catch (err: any) {
      toast.error("Action failed", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredJobs = jobPositions.filter((j) =>
    j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (j.description && j.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalHeadcount = jobPositions.reduce((acc, curr) => acc + (curr.employeeCount || 0), 0);
  const activeJobsCount = jobPositions.filter((j) => j.isActive).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Job Positions</h1>
            <Badge variant="outline" className="font-mono text-xs">
              {jobPositions.length} Titles
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Define organizational roles, position requirements, and track staff allocations.
          </p>
        </div>

        <div>
          <Button
            onClick={openCreateModal}
            disabled={!canCreate}
            className={!canCreate ? "opacity-60 cursor-not-allowed" : ""}
            title={canCreate ? "Add Job Position" : "Requires HR Manager or Admin privileges"}
          >
            {canCreate ? (
              <PlusIcon className="mr-1.5 size-4" />
            ) : (
              <LockIcon className="mr-1.5 size-4" />
            )}
            New Job Position
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">Total Job Roles</CardDescription>
            <BriefcaseBusinessIcon className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobPositions.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">Standardized designations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">Active Designations</CardDescription>
            <CheckCircle2Icon className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {activeJobsCount}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Available for hiring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">Assigned Personnel</CardDescription>
            <UsersIcon className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHeadcount}</div>
            <p className="mt-1 text-xs text-muted-foreground">Staff placed in designated roles</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search job positions by title, code (e.g. ENG, SALES, DEV)..."
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
                <TableHead>Job Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Staff Assigned</TableHead>
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
                      Loading job positions from Neon D
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No job positions found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <span className="font-mono font-semibold text-primary">{job.code}</span>
                    </TableCell>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                      {job.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1 font-mono text-xs">
                        <UsersIcon className="size-3" />
                        {job.employeeCount} {job.employeeCount === 1 ? "staff" : "staff"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {job.isActive ? (
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
                          onClick={() => openEditModal(job)}
                          disabled={!canUpdate}
                          title={canUpdate ? "Edit Position" : "Requires HR Manager or Admin"}
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
                          onClick={() => handleDelete(job)}
                          disabled={!canDelete || job.employeeCount > 0}
                          title={
                            job.employeeCount > 0
                              ? "Cannot delete: employees assigned"
                              : canDelete
                              ? "Delete Position"
                              : "Requires HR Manager or Admin"
                          }
                          className={
                            canDelete && job.employeeCount === 0
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
                {editingJob ? `Edit Job Position: ${editingJob.title}` : "Create New Job Position"}
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
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Lead Software Engineer"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="jobCode">Job Code</Label>
                <Input
                  id="jobCode"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. LEAD_SWE"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="jobDescription">Description</Label>
                <Input
                  id="jobDescription"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Responsibilities and requirements..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="jobActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="jobActive" className="cursor-pointer">
                  Job Position is active
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
                    : editingJob
                    ? "Update Position"
                    : "Create Position"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

