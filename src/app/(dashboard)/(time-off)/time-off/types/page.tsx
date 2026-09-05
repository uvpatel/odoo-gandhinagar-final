"use client";

import * as React from "react";
import Link from "next/link";
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
  SearchIcon,
  PlusIcon,
  InfoIcon,
  PencilIcon,
  Trash2Icon,
  CheckCircle2Icon,
  XIcon,
  LayersIcon,
} from "lucide-react";
import { toast } from "sonner";

type TimeOffTypeItem = {
  id: string;
  name: string;
  code: string;
  unit: "days" | "hours";
  requiresAllocation: boolean;
  approvalMode: "none" | "manager" | "hr" | "manager_and_hr";
  isPaid: boolean;
  isActive: boolean;
  createdAt: string;
};

export default function TimeOffTypesPage() {
  const { can } = useCan();
  const [typesList, setTypesList] = React.useState<TimeOffTypeItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingType, setEditingType] = React.useState<TimeOffTypeItem | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [formData, setFormData] = React.useState({
    name: "Paid Time Off",
    code: "PTO",
    unit: "days" as TimeOffTypeItem["unit"],
    requiresAllocation: true,
    approvalMode: "manager" as TimeOffTypeItem["approvalMode"],
    isPaid: true,
    isActive: true,
    displayColor: "Blue",
    payrollWorkEntry: "Leave Work Entry",
    configurationNotes: "Standard annual leave. Balance comes from approved allocations.",
  });

  const canManage = can("timeOffType", "create");

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/time-off/types");
      const data = await res.json();
      if (data.data) setTypesList(data.data);
    } catch (err) {
      console.error("Failed to load time-off types:", err);
      toast.error("Failed to load leave types");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = () => {
    setEditingType(null);
    setFormData({
      name: "",
      code: "",
      unit: "days",
      requiresAllocation: true,
      approvalMode: "manager",
      isPaid: true,
      isActive: true,
      displayColor: "Blue",
      payrollWorkEntry: "Leave Work Entry",
      configurationNotes: "Standard annual leave. Balance comes from approved allocations.",
    });
    setIsModalOpen(true);
  };

  const openFormModal = (item: TimeOffTypeItem) => {
    setEditingType(item);
    setFormData({
      name: item.name,
      code: item.code,
      unit: item.unit,
      requiresAllocation: item.requiresAllocation,
      approvalMode: item.approvalMode,
      isPaid: item.isPaid,
      isActive: item.isActive,
      displayColor: "Blue",
      payrollWorkEntry: "Leave Work Entry",
      configurationNotes: "Standard leave policy type configured for employee requests.",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (item: TimeOffTypeItem) => {
    if (!canManage) {
      toast.error("Permission denied", { description: "Privileges required to delete time-off types." });
      return;
    }

    if (!confirm(`Are you sure you want to delete leave type ${item.name}?`)) return;

    try {
      const res = await fetch(`/api/time-off/types?id=${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete time-off type");
      toast.success("Leave type deleted");
      setTypesList((prev) => prev.filter((t) => t.id !== item.id));
    } catch (err: any) {
      toast.error("Action failed", { description: err.message });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingType) {
        const res = await fetch("/api/time-off/types", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingType.id, ...formData }),
        });
        if (!res.ok) throw new Error("Failed to update time-off type");
        toast.success("Time-off type updated");
      } else {
        const res = await fetch("/api/time-off/types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("Failed to create time-off type");
        toast.success("Time-off type created");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Operation failed", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTypes = typesList.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b pb-3">
        <Link href="/time-off">
          <Button variant="ghost" size="sm" className="text-xs">
            Dashboard
          </Button>
        </Link>
        <Link href="/time-off/requests">
          <Button variant="ghost" size="sm" className="text-xs">
            Time offs
          </Button>
        </Link>
        <Link href="/time-off/types">
          <Button variant="secondary" size="sm" className="text-xs font-semibold">
            Time off Types
          </Button>
        </Link>
        <Link href="/time-off/allocations">
          <Button variant="ghost" size="sm" className="text-xs">
            Allocations
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Time Off Types</h1>
            <Badge variant="outline" className="font-mono text-xs">
              {typesList.length} Active Rules
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            List view opened from Time Off → Time Off Types.
          </p>
        </div>

        <Button onClick={openCreateModal} disabled={!canManage}>
          <PlusIcon className="mr-1.5 size-4" />
          New Type
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search time off types by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Types Table */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Loading leave types...</span>
          </div>
        </Card>
      ) : filteredTypes.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <LayersIcon className="mx-auto size-8 text-muted-foreground" />
          <h3 className="mt-3 text-base font-semibold">No time off types found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No policy rules configured yet.
          </p>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Allocation</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTypes.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => openFormModal(item)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{item.name}</span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {item.code}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs capitalize font-medium">{item.unit}</TableCell>
                    <TableCell className="text-xs">
                      {item.requiresAllocation ? (
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          Required
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs capitalize font-medium">
                      {item.approvalMode.replace("_", " ")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[11px] px-2.5 py-0.5 ${
                          item.isActive
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                            : "border-slate-500/30 bg-slate-500/10 text-slate-600"
                        }`}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" size="icon-xs" onClick={() => openFormModal(item)}>
                          <PencilIcon className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDelete(item)}
                          disabled={!canManage}
                          className="text-destructive hover:bg-destructive/10"
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
          <span className="font-semibold">Useful note:</span> This list defines policy rules, not employee transactions.
        </div>
      </div>

      {/* Form View / Detail Modal (From Wireframe) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h2 className="text-lg font-bold">
                  Time Off Type / {editingType ? editingType.name : formData.name || "New Type"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Form view of one time off type</p>
              </div>
              <Button variant="ghost" size="icon-xs" onClick={() => setIsModalOpen(false)}>
                <XIcon className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Type Name</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Paid Time Off"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. PTO"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="unit">Unit</Label>
                  <select
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="days">Days</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="approvalMode">Approval</Label>
                  <select
                    id="approvalMode"
                    value={formData.approvalMode}
                    onChange={(e) =>
                      setFormData({ ...formData, approvalMode: e.target.value as any })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="manager">Manager</option>
                    <option value="hr">HR</option>
                    <option value="manager_and_hr">Manager & HR</option>
                    <option value="none">No Approval Required</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="requiresAllocation">Requires Allocation</Label>
                  <select
                    id="requiresAllocation"
                    value={formData.requiresAllocation ? "true" : "false"}
                    onChange={(e) =>
                      setFormData({ ...formData, requiresAllocation: e.target.value === "true" })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="payrollWorkEntry">Payroll / Work Entry</Label>
                  <Input
                    id="payrollWorkEntry"
                    value={formData.payrollWorkEntry}
                    onChange={(e) => setFormData({ ...formData, payrollWorkEntry: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="isActive">Active</Label>
                  <select
                    id="isActive"
                    value={formData.isActive ? "true" : "false"}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.value === "true" })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="displayColor">Display Color</Label>
                  <Input
                    id="displayColor"
                    value={formData.displayColor}
                    onChange={(e) => setFormData({ ...formData, displayColor: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="configurationNotes">Configuration Notes</Label>
                <textarea
                  id="configurationNotes"
                  rows={3}
                  value={formData.configurationNotes}
                  onChange={(e) => setFormData({ ...formData, configurationNotes: e.target.value })}
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Useful Note Banner in Form */}
              <div className="flex items-start gap-2.5 rounded-md bg-blue-500/5 border border-blue-500/20 p-3 text-xs text-blue-800 dark:text-blue-300">
                <InfoIcon className="size-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <div>
                  <span className="font-semibold">Useful note:</span> Time Off Type drives approval behavior and whether a request needs an allocation.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editingType ? "Update Type" : "Create Type"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

