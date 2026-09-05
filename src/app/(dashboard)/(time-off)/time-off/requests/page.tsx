"use client";

export const dynamic = "force-dynamic";

import * as React from "react";
import Link from "next/link";
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
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckIcon,
  XIcon,
  ClockIcon,
  CheckCircle2Icon,
  XCircleIcon,
  BanIcon,
  SearchIcon,
  PlusIcon,
  InfoIcon,
  PencilIcon,
  Trash2Icon,
  CalendarIcon,
  UserCheckIcon,
  FileTextIcon,
  LayersIcon,
} from "lucide-react";
import { toast } from "sonner";

type TimeOffRequestItem = {
  id: string;
  employeeId: string;
  employeeName: string;
  timeOffTypeId: string;
  timeOffTypeName: string;
  startDate: string;
  endDate: string;
  duration: string;
  reason: string | null;
  status: "draft" | "pending" | "approved" | "refused" | "cancelled";
  refusalReason?: string | null;
  createdAt: string;
};

type TimeOffTypeOption = {
  id: string;
  name: string;
  requiresAllocation: boolean;
};

type EmployeeOption = {
  id: string;
  fullName: string;
  employeeNumber: string;
};

const statusColors: Record<string, string> = {
  approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold",
  refused: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold",
  cancelled: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400",
  draft: "border-gray-500/30 bg-gray-500/10 text-gray-500 dark:text-gray-400",
};

const statusLabels: Record<string, string> = {
  approved: "Approved",
  pending: "To Approve",
  refused: "Refused",
  cancelled: "Cancelled",
  draft: "Draft",
};

function TimeOffRequestsContent() {
  const { can, role } = useCan();
  const [requests, setRequests] = React.useState<TimeOffRequestItem[]>([]);
  const [typesList, setTypesList] = React.useState<TimeOffTypeOption[]>([]);
  const [employeesList, setEmployeesList] = React.useState<EmployeeOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Filters
  const searchParams = useSearchParams();
  const [employeeFilter, setEmployeeFilter] = React.useState<string | null>(searchParams.get("employeeId"));
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [isMyTeamOnly, setIsMyTeamOnly] = React.useState(false);
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  // Form View / Modal State
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedRequest, setSelectedRequest] = React.useState<TimeOffRequestItem | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form Input State
  const [formData, setFormData] = React.useState({
    employeeId: "",
    timeOffTypeId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    duration: "1",
    reason: "",
  });

  const canApprove = can("timeOffRequest", "approve");
  const canRefuse = can("timeOffRequest", "refuse");
  const canCreate = can("timeOffRequest", "create") || can("timeOffRequest", "create-self");

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const [reqRes, typesRes, empRes] = await Promise.all([
        fetch("/api/time-off/requests"),
        fetch("/api/time-off/types"),
        fetch("/api/employees"),
      ]);

      const [reqData, typesData, empData] = await Promise.all([
        reqRes.json(),
        typesRes.json(),
        empRes.json(),
      ]);

      if (reqData.data) setRequests(reqData.data);
      if (typesData.data) setTypesList(typesData.data);
      if (empData.data) setEmployeesList(empData.data);
    } catch (err) {
      console.error("Failed to load time-off data:", err);
      toast.error("Failed to fetch leave requests");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate duration between start and end date
  const handleDateChange = (start: string, end: string) => {
    if (!start || !end) return;
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diffTime = Math.max(0, d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    setFormData((prev) => ({
      ...prev,
      startDate: start,
      endDate: end,
      duration: String(diffDays),
    }));
  };

  const handleApprove = async (id: string, employeeName: string) => {
    if (!canApprove) {
      toast.error("Permission denied", {
        description: "Only HR Managers and Admins can approve leave requests.",
      });
      return;
    }

    setProcessingId(id);
    try {
      const res = await fetch(`/api/time-off/requests/${id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve request");

      toast.success("Request approved", {
        description: `Leave request for ${employeeName} has been approved.`,
      });
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r))
      );
      if (selectedRequest?.id === id) {
        setSelectedRequest((prev) => (prev ? { ...prev, status: "approved" } : null));
      }
    } catch (err: any) {
      toast.error("Approval failed", { description: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRefuse = async (id: string, employeeName: string) => {
    if (!canRefuse) {
      toast.error("Permission denied", {
        description: "Only HR Managers and Admins can refuse leave requests.",
      });
      return;
    }

    const reason = prompt(
      `Enter refusal reason for ${employeeName}'s request (optional):`,
      "Department coverage or scheduling conflict"
    );
    if (reason === null) return;

    setProcessingId(id);
    try {
      const res = await fetch(`/api/time-off/requests/${id}/refuse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to refuse request");

      toast.info("Request refused", {
        description: `Leave request for ${employeeName} was marked as refused.`,
      });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "refused", refusalReason: reason } : r
        )
      );
      if (selectedRequest?.id === id) {
        setSelectedRequest((prev) =>
          prev ? { ...prev, status: "refused", refusalReason: reason } : null
        );
      }
    } catch (err: any) {
      toast.error("Refusal action failed", { description: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  const openCreateModal = () => {
    setSelectedRequest(null);
    const todayStr = new Date().toISOString().split("T")[0];
    setFormData({
      employeeId: employeesList[0]?.id || "",
      timeOffTypeId: typesList[0]?.id || "",
      startDate: todayStr,
      endDate: todayStr,
      duration: "1",
      reason: "",
    });
    setIsFormOpen(true);
  };

  const openFormView = (req: TimeOffRequestItem) => {
    setSelectedRequest(req);
    setFormData({
      employeeId: req.employeeId,
      timeOffTypeId: req.timeOffTypeId,
      startDate: req.startDate,
      endDate: req.endDate,
      duration: req.duration,
      reason: req.reason || "",
    });
    setIsFormOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/time-off/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request");

      toast.success("Time-off request submitted successfully");
      setIsFormOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Submission failed", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.timeOffTypeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesEmployee = !employeeFilter || r.employeeId === employeeFilter;
    return matchesSearch && matchesStatus && matchesEmployee;
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Time Off Sub-Navigation Header (From Wireframe) */}
      <div className="flex items-center gap-2 border-b pb-3">
        <Link href="/time-off">
          <Button variant="ghost" size="sm" className="text-xs">
            Dashboard
          </Button>
        </Link>
        <Link href="/time-off/requests">
          <Button variant="secondary" size="sm" className="text-xs font-semibold">
            Time offs
          </Button>
        </Link>
        <Link href="/time-off/types">
          <Button variant="ghost" size="sm" className="text-xs">
            Time off Types
          </Button>
        </Link>
        <Link href="/time-off/allocations">
          <Button variant="ghost" size="sm" className="text-xs">
            Allocations
          </Button>
        </Link>
      </div>

      {employeeFilter && (
        <div className="flex items-center justify-between rounded-lg bg-blue-500/10 border border-blue-500/30 px-4 py-2.5 text-xs text-blue-700 dark:text-blue-300">
          <span>Filtering leave requests for selected employee</span>
          <Button variant="ghost" size="sm" onClick={() => setEmployeeFilter(null)} className="h-7 text-xs">
            Clear Filter
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Time Off Requests</h1>
            <Badge variant="outline" className="font-mono text-xs">
              {requests.length} Total
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            List view opened from Time Off → Requests.
          </p>
        </div>

        <Button onClick={openCreateModal} disabled={!canCreate}>
          <PlusIcon className="mr-1.5 size-4" />
          New Request
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search requests by employee, type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div>
              <Button
                variant={isMyTeamOnly ? "default" : "outline"}
                onClick={() => setIsMyTeamOnly(!isMyTeamOnly)}
                className="w-full text-xs"
              >
                {isMyTeamOnly ? "Showing: My Team" : "Filter: My Team"}
              </Button>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Requests</option>
                <option value="pending">To Approve</option>
                <option value="approved">Approved</option>
                <option value="refused">Refused</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Requests Table */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Loading time-off requests...</span>
          </div>
        </Card>
      ) : filteredRequests.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <CalendarIcon className="mx-auto size-8 text-muted-foreground" />
          <h3 className="mt-3 text-base font-semibold">No time-off requests found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No requests match your current search and filter selections.
          </p>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => (
                  <TableRow
                    key={req.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => openFormView(req)}
                  >
                    <TableCell className="font-medium text-sm">
                      {req.employeeName}
                    </TableCell>
                    <TableCell className="text-xs">
                      {req.timeOffTypeName}
                    </TableCell>
                    <TableCell className="text-xs font-medium">{req.startDate}</TableCell>
                    <TableCell className="text-xs font-medium">{req.endDate}</TableCell>
                    <TableCell className="text-xs font-mono font-semibold">
                      {req.duration} Days
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[11px] px-2.5 py-0.5 capitalize ${
                          statusColors[req.status] || ""
                        }`}
                      >
                        {statusLabels[req.status] || req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {req.status === "pending" && canApprove && (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleApprove(req.id, req.employeeName)}
                            disabled={processingId === req.id}
                            className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                          >
                            Approve
                          </Button>
                        )}
                        {req.status === "pending" && canRefuse && (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleRefuse(req.id, req.employeeName)}
                            disabled={processingId === req.id}
                            className="border-rose-500/30 text-rose-600 hover:bg-rose-500/10"
                          >
                            Refuse
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-xs" onClick={() => openFormView(req)}>
                          <PencilIcon className="size-3.5" />
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
      <div className="flex items-start gap-3 rounded-lg border border-purple-500/20 bg-purple-500/5 p-4 text-xs text-purple-800 dark:text-purple-300">
        <InfoIcon className="size-4 shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
        <div>
          <span className="font-semibold">Useful note:</span> Request status should show the approval lifecycle clearly.
        </div>
      </div>

      {/* Form View / Detail Modal (From Wireframe) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-2xl animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h2 className="text-lg font-bold">Time Off Request</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Form view of one request</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedRequest && selectedRequest.status === "pending" && canApprove && (
                  <Button
                    size="sm"
                    onClick={() => handleApprove(selectedRequest.id, selectedRequest.employeeName)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Approve
                  </Button>
                )}
                {selectedRequest && selectedRequest.status === "pending" && canRefuse && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRefuse(selectedRequest.id, selectedRequest.employeeName)}
                    className="border-rose-500/30 text-rose-600 hover:bg-rose-500/10"
                  >
                    Refuse
                  </Button>
                )}
                <Button variant="ghost" size="icon-xs" onClick={() => setIsFormOpen(false)}>
                  <XIcon className="size-4" />
                </Button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Employee */}
                <div className="space-y-1.5">
                  <Label htmlFor="employeeId">Employee</Label>
                  <select
                    id="employeeId"
                    required
                    disabled={Boolean(selectedRequest)}
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

                {/* Duration */}
                <div className="space-y-1.5">
                  <Label htmlFor="duration">Duration (Days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    step="0.5"
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Time Off Type */}
                <div className="space-y-1.5">
                  <Label htmlFor="timeOffTypeId">Time Off Type</Label>
                  <select
                    id="timeOffTypeId"
                    required
                    disabled={Boolean(selectedRequest)}
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

                {/* Status Display */}
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <div className="h-9 w-full rounded-md border border-input bg-muted px-3 text-sm font-semibold flex items-center capitalize">
                    {selectedRequest ? statusLabels[selectedRequest.status] : "Pending Approval"}
                  </div>
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
                    disabled={Boolean(selectedRequest)}
                    value={formData.startDate}
                    onChange={(e) => handleDateChange(e.target.value, formData.endDate)}
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    required
                    disabled={Boolean(selectedRequest)}
                    value={formData.endDate}
                    onChange={(e) => handleDateChange(formData.startDate, e.target.value)}
                  />
                </div>
              </div>

              {/* Allocation Used Reference */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Allocation Used</Label>
                  <div className="h-9 w-full rounded-md border border-input bg-muted px-3 text-sm flex items-center text-muted-foreground">
                    {typesList.find((t) => t.id === formData.timeOffTypeId)?.name || "Paid Time Off"} 2026
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Approver</Label>
                  <div className="h-9 w-full rounded-md border border-input bg-muted px-3 text-sm flex items-center text-muted-foreground">
                    {selectedRequest ? "Authorized HR / Manager" : "Pending Assignment"}
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <Label htmlFor="reason">Reason / Justification</Label>
                <textarea
                  id="reason"
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="e.g. Family vacation, personal appointment, medical leave"
                />
              </div>

              {/* Useful Note Banner in Form */}
              <div className="flex items-start gap-2.5 rounded-md bg-purple-500/5 border border-purple-500/20 p-3 text-xs text-purple-800 dark:text-purple-300">
                <InfoIcon className="size-4 shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
                <div>
                  <span className="font-semibold">Useful note:</span> If the selected type requires allocation, the request should clearly show which balance was consumed.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Close
                </Button>
                {!selectedRequest && (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TimeOffRequestsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading leave requests...</div>}>
      <TimeOffRequestsContent />
    </React.Suspense>
  );
}


