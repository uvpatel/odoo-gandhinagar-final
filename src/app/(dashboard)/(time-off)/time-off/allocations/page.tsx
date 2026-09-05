"use client";

export const dynamic = "force-dynamic";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCan } from "@/hooks/use-permissions";
import { TimeOffSubNav } from "@/components/time-off/time-off-subnav";
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
  SearchIcon,
  PlusIcon,
  InfoIcon,
  PencilIcon,
  Trash2Icon,
  CheckCircle2Icon,
  XCircleIcon,
  XIcon,
  CalendarIcon,
  CheckIcon,
} from "lucide-react";
import { toast } from "sonner";

type AllocationItem = {
  id: string;
  employeeId: string;
  employeeName: string;
  timeOffTypeId: string;
  timeOffTypeName: string;
  allocatedAmount: string | number;
  allocated: number;
  taken: number;
  remaining: number;
  validFrom: string;
  validTo: string | null;
  status: "draft" | "pending" | "approved" | "refused" | "expired";
  approvedBy: string | null;
  createdAt: string;
};

type EmployeeOption = {
  id: string;
  fullName: string;
  employeeNumber: string;
};

type TimeOffTypeOption = {
  id: string;
  name: string;
};

const statusColors: Record<string, string> = {
  approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold",
  draft: "border-gray-500/30 bg-gray-500/10 text-gray-500 dark:text-gray-400",
  refused: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  expired: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

const statusLabels: Record<string, string> = {
  approved: "Approved",
  pending: "To Approve",
  draft: "Draft",
  refused: "Refused",
  expired: "Expired",
};

function TimeOffAllocationsContent() {
  const { can } = useCan();
  const searchParams = useSearchParams();
  const [employeeFilter, setEmployeeFilter] = React.useState<string | null>(searchParams.get("employeeId"));
  const [allocationsList, setAllocationsList] = React.useState<AllocationItem[]>([]);
  const [employeesList, setEmployeesList] = React.useState<EmployeeOption[]>([]);
  const [typesList, setTypesList] = React.useState<TimeOffTypeOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedAlloc, setSelectedAlloc] = React.useState<AllocationItem | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [formData, setFormData] = React.useState({
    employeeId: "",
    timeOffTypeId: "",
    allocatedAmount: "20",
    validFrom: new Date().toISOString().split("T")[0],
    validTo: "",
    description: "Annual leave balance granted at start of policy year.",
    status: "approved" as AllocationItem["status"],
  });

  const canManage = can("timeOffAllocation", "create");

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const [allocRes, empRes, typesRes] = await Promise.all([
        fetch("/api/time-off/allocations"),
        fetch("/api/employees"),
        fetch("/api/time-off/types"),
      ]);

      const [allocData, empData, typesData] = await Promise.all([
        allocRes.json(),
        empRes.json(),
        typesRes.json(),
      ]);

      if (allocData.data) setAllocationsList(allocData.data);
      if (empData.data) setEmployeesList(empData.data);
      if (typesData.data) setTypesList(typesData.data);
    } catch (err) {
      console.error("Failed to fetch allocations:", err);
      toast.error("Failed to load leave allocations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = () => {
    setSelectedAlloc(null);
    setFormData({
      employeeId: employeesList[0]?.id || "",
      timeOffTypeId: typesList[0]?.id || "",
      allocatedAmount: "20",
      validFrom: new Date().toISOString().split("T")[0],
      validTo: "",
      description: "Annual leave balance granted at start of policy year.",
      status: "approved",
    });
    setIsModalOpen(true);
  };

  const openFormModal = (alloc: AllocationItem) => {
    setSelectedAlloc(alloc);
    setFormData({
      employeeId: alloc.employeeId,
      timeOffTypeId: alloc.timeOffTypeId,
      allocatedAmount: String(alloc.allocated),
      validFrom: alloc.validFrom || new Date().toISOString().split("T")[0],
      validTo: alloc.validTo || "",
      description: "Annual leave balance granted at start of policy year.",
      status: alloc.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (alloc: AllocationItem) => {
    if (!canManage) {
      toast.error("Permission denied", { description: "Privileges required to delete allocations." });
      return;
    }

    if (!confirm(`Are you sure you want to delete allocation for ${alloc.employeeName}?`)) return;

    try {
      const res = await fetch(`/api/time-off/allocations?id=${alloc.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete allocation");
      toast.success("Allocation deleted");
      setAllocationsList((prev) => prev.filter((a) => a.id !== alloc.id));
    } catch (err: any) {
      toast.error("Action failed", { description: err.message });
    }
  };

  const handleApprove = async (alloc: AllocationItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!canManage) {
      toast.error("Permission denied", { description: "Privileges required to approve allocations." });
      return;
    }

    try {
      const res = await fetch(`/api/time-off/allocations/${alloc.id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve allocation");

      toast.success("Allocation approved", {
        description: `Leave balance has been activated for ${alloc.employeeName}.`,
      });
      fetchData();
    } catch (err: any) {
      toast.error("Approval failed", { description: err.message });
    }
  };

  const handleRefuse = async (alloc: AllocationItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!canManage) {
      toast.error("Permission denied", { description: "Privileges required to refuse allocations." });
      return;
    }

    if (!confirm(`Are you sure you want to refuse allocation for ${alloc.employeeName}?`)) return;

    try {
      const res = await fetch(`/api/time-off/allocations/${alloc.id}/refuse`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to refuse allocation");

      toast.info("Allocation refused", {
        description: `Allocation for ${alloc.employeeName} was marked as refused.`,
      });
      fetchData();
    } catch (err: any) {
      toast.error("Refusal failed", { description: err.message });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (selectedAlloc) {
        const res = await fetch("/api/time-off/allocations", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selectedAlloc.id, ...formData }),
        });
        if (!res.ok) throw new Error("Failed to update allocation");
        toast.success("Allocation updated successfully");
      } else {
        const res = await fetch("/api/time-off/allocations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("Failed to create allocation");
        toast.success("Allocation created successfully");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Operation failed", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAllocations = allocationsList.filter((a) => {
    const matchesSearch =
      a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.timeOffTypeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmployee = !employeeFilter || a.employeeId === employeeFilter;
    return matchesSearch && matchesEmployee;
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Sub-Navigation Tabs */}
      <TimeOffSubNav />

      {employeeFilter && (
        <div className="flex items-center justify-between rounded-lg bg-blue-500/10 border border-blue-500/30 px-4 py-2.5 text-xs text-blue-700 dark:text-blue-300">
          <span>Filtering time off allocations for selected employee</span>
          <Button variant="ghost" size="sm" onClick={() => setEmployeeFilter(null)} className="h-7 text-xs">
            Clear Filter
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Allocations</h1>
            <Badge variant="outline" className="font-mono text-xs">
              {allocationsList.length} Total
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            List view opened from Time Off → Allocations.
          </p>
        </div>

        <Button onClick={openCreateModal} disabled={!canManage}>
          <PlusIcon className="mr-1.5 size-4" />
          New Allocation
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search allocations by employee, type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Allocations Table */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Loading allocations from database...</span>
          </div>
        </Card>
      ) : filteredAllocations.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <CalendarIcon className="mx-auto size-8 text-muted-foreground" />
          <h3 className="mt-3 text-base font-semibold">No allocations found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No employee leave balance allocations exist or match search criteria.
          </p>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Validity Window</TableHead>
                  <TableHead>Allocated</TableHead>
                  <TableHead>Taken</TableHead>
                  <TableHead>Remaining Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAllocations.map((alloc) => {
                  const isApproved = alloc.status === "approved";
                  const isPending = alloc.status === "pending" || alloc.status === "draft";
                  return (
                    <TableRow
                      key={alloc.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => openFormModal(alloc)}
                    >
                      <TableCell className="font-medium text-sm">{alloc.employeeName}</TableCell>
                      <TableCell className="text-xs font-medium">{alloc.timeOffTypeName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {alloc.validFrom} → {alloc.validTo || "Indefinite"}
                      </TableCell>
                      <TableCell className="text-xs font-mono font-semibold">
                        {alloc.allocated} days
                      </TableCell>
                      <TableCell className="text-xs font-mono text-amber-600 dark:text-amber-400">
                        {alloc.taken} days
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {!isApproved ? (
                          <span className="text-muted-foreground italic text-[11px]">
                            Pending Approval
                          </span>
                        ) : alloc.remaining === 0 ? (
                          <span className="font-semibold text-rose-600 dark:text-rose-400">
                            0 days (Exhausted)
                          </span>
                        ) : alloc.remaining <= 3 ? (
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            {alloc.remaining} days (Low)
                          </span>
                        ) : (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {alloc.remaining} days
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[11px] px-2.5 py-0.5 capitalize ${
                            statusColors[alloc.status] || ""
                          }`}
                        >
                          {statusLabels[alloc.status] || alloc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && canManage && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => handleApprove(alloc, e)}
                                className="h-7 px-2 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1"
                                title="Approve this allocation"
                              >
                                <CheckIcon className="size-3" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => handleRefuse(alloc, e)}
                                className="h-7 px-2 text-xs text-rose-600 border-rose-500/30 hover:bg-rose-500/10 gap-1"
                                title="Refuse this allocation"
                              >
                                <XIcon className="size-3" />
                                Refuse
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon-xs" onClick={() => openFormModal(alloc)}>
                            <PencilIcon className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleDelete(alloc)}
                            disabled={!canManage || isApproved}
                            title={isApproved ? "Approved allocations cannot be deleted" : "Delete allocation"}
                            className="text-destructive hover:bg-destructive/10 disabled:opacity-30"
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

      {/* Useful Note Banner at List Bottom (From Wireframe) */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-blue-800 dark:text-blue-300">
        <InfoIcon className="size-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
        <div>
          <span className="font-semibold">Useful note:</span> The list should expose the balance math at a glance — <span className="font-semibold">Allocated</span>, <span className="font-semibold">Taken</span> and <span className="font-semibold">Remaining</span>.
        </div>
      </div>

      {/* Allocation Form View / Detail Modal (From Wireframe) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-2xl animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h2 className="text-lg font-bold">
                  Allocation / {selectedAlloc ? selectedAlloc.employeeName : "New Allocation"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Form view of one allocation record</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedAlloc && selectedAlloc.status === "pending" && (
                  <>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      Approve
                    </Button>
                    <Button variant="outline" size="sm" className="border-rose-500/30 text-rose-600">
                      Refuse
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon-xs" onClick={() => setIsModalOpen(false)}>
                  <XIcon className="size-4" />
                </Button>
              </div>
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
                    disabled={Boolean(selectedAlloc)}
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
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

                {/* Taken */}
                <div className="space-y-1.5">
                  <Label>Taken</Label>
                  <div className="h-9 w-full rounded-md border border-input bg-muted px-3 text-sm font-semibold flex items-center text-amber-600">
                    {selectedAlloc ? `${selectedAlloc.taken} Days` : "0 Days"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Time Off Type */}
                <div className="space-y-1.5">
                  <Label htmlFor="timeOffTypeId">Time Off Type</Label>
                  <select
                    id="timeOffTypeId"
                    required
                    disabled={Boolean(selectedAlloc)}
                    value={formData.timeOffTypeId}
                    onChange={(e) => setFormData({ ...formData, timeOffTypeId: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select Leave Type...</option>
                    {typesList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Remaining */}
                <div className="space-y-1.5">
                  <Label>Remaining</Label>
                  <div className="h-9 w-full rounded-md border border-input bg-muted px-3 text-sm font-semibold flex items-center text-emerald-600">
                    {selectedAlloc ? `${selectedAlloc.remaining} Days` : `${formData.allocatedAmount} Days`}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Allocated */}
                <div className="space-y-1.5">
                  <Label htmlFor="allocatedAmount">Allocated (Days)</Label>
                  <Input
                    id="allocatedAmount"
                    type="number"
                    required
                    value={formData.allocatedAmount}
                    onChange={(e) => setFormData({ ...formData, allocatedAmount: e.target.value })}
                  />
                </div>

                {/* Approver */}
                <div className="space-y-1.5">
                  <Label>Approver</Label>
                  <div className="h-9 w-full rounded-md border border-input bg-muted px-3 text-sm flex items-center text-muted-foreground">
                    HR Manager / Admin
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Status */}
                <div className="space-y-1.5">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">To Approve</option>
                    <option value="draft">Draft</option>
                    <option value="refused">Refused</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="validFrom">Valid From</Label>
                  <Input
                    id="validFrom"
                    type="date"
                    required
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="validTo">Valid To (Optional Expiration)</Label>
                <Input
                  id="validTo"
                  type="date"
                  value={formData.validTo}
                  onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                  placeholder="Leave empty for indefinite validity"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Annual leave balance granted at start of policy year."
                />
              </div>

              {/* Useful Note Banner in Form */}
              <div className="flex items-start gap-2.5 rounded-md bg-emerald-500/5 border border-emerald-500/20 p-3 text-xs text-emerald-800 dark:text-emerald-300">
                <InfoIcon className="size-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <span className="font-semibold">Useful note:</span> Only <span className="font-semibold">Approved</span> allocations within their validity period create usable leave balances for employee requests.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  {selectedAlloc && (selectedAlloc.status === "pending" || selectedAlloc.status === "draft") && canManage && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={async () => {
                          await handleApprove(selectedAlloc);
                          setIsModalOpen(false);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 gap-1.5"
                      >
                        <CheckIcon className="size-3.5" />
                        Approve Allocation
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          await handleRefuse(selectedAlloc);
                          setIsModalOpen(false);
                        }}
                        className="text-rose-600 border-rose-500/30 hover:bg-rose-500/10 text-xs h-9 gap-1.5"
                      >
                        <XIcon className="size-3.5" />
                        Refuse
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? "Saving..."
                      : selectedAlloc
                      ? "Update Allocation"
                      : "Create Allocation"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TimeOffAllocationsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading allocations...</div>}>
      <TimeOffAllocationsContent />
    </React.Suspense>
  );
}

