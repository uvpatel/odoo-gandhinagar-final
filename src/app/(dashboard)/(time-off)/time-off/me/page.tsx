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
  CalendarDaysIcon,
  PlusIcon,
  ClockIcon,
  CheckCircle2Icon,
  XCircleIcon,
  BanIcon,
  XIcon,
  UserCheckIcon,
} from "lucide-react";
import { toast } from "sonner";

type TimeOffRequestItem = {
  id: string;
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

type TimeOffTypeItem = {
  id: string;
  name: string;
  code: string;
};

export default function MyTimeOffPage() {
  const { can, role, isEmployee } = useCan();
  const [requests, setRequests] = React.useState<TimeOffRequestItem[]>([]);
  const [types, setTypes] = React.useState<TimeOffTypeItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const canCreateSelf = can("timeOffRequest", "create-self");
  const canCancelSelf = can("timeOffRequest", "cancel-self");

  const [formData, setFormData] = React.useState({
    timeOffTypeId: "",
    startDate: "",
    endDate: "",
    duration: "1",
    reason: "",
  });

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const [reqRes, typesRes] = await Promise.all([
        fetch("/api/time-off/requests?self=true"),
        fetch("/api/time-off/types"),
      ]);
      const reqData = await reqRes.json();
      const typesData = await typesRes.json();

      if (reqData.data) setRequests(reqData.data);
      if (typesData.data) {
        setTypes(typesData.data);
        if (typesData.data.length > 0 && !formData.timeOffTypeId) {
          setFormData((prev) => ({ ...prev, timeOffTypeId: typesData.data[0].id }));
        }
      }
    } catch (err) {
      console.error("Failed to load time off data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [formData.timeOffTypeId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancelRequest = async (id: string) => {
    if (!canCancelSelf) {
      toast.error("Permission denied", {
        description: "You do not have permission to cancel this request.",
      });
      return;
    }

    if (!confirm("Are you sure you want to cancel this pending time-off request?")) {
      return;
    }

    try {
      const res = await fetch(`/api/time-off/requests?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel request");

      toast.success("Request cancelled");
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r))
      );
    } catch (err: any) {
      toast.error("Cancellation failed", { description: err.message });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateSelf) {
      toast.error("Permission denied", {
        description: "You are not authorized to submit time-off requests.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/time-off/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request");

      toast.success("Request submitted successfully", {
        description: "Your leave request has been sent for manager review.",
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Submission failed", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Summary counts
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">My Time Off</h1>
            <Badge
              variant="outline"
              className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 gap-1"
            >
              <UserCheckIcon className="size-3" />
              Employee Self-Service
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your personal leave requests, view approval status, and submit time off.
          </p>
        </div>

        <div>
          <Button
            onClick={() => setIsModalOpen(true)}
            disabled={!canCreateSelf}
            className="gap-2"
          >
            <PlusIcon className="size-4" />
            Request Time Off
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Requests</CardDescription>
            <CardTitle className="text-2xl text-amber-600 dark:text-amber-400">
              {pendingCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Awaiting manager approval
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved Leaves</CardDescription>
            <CardTitle className="text-2xl text-emerald-600 dark:text-emerald-400">
              {approvedCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Confirmed time off
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total History</CardDescription>
            <CardTitle className="text-2xl text-foreground">
              {requests.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            All submitted applications
          </CardContent>
        </Card>
      </div>

      {/* Requests History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leave Applications</CardTitle>
          <CardDescription>
            Track the status of your past and active leave submissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading your leave records...
                    </div>
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    You have not submitted any time-off requests yet.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.timeOffTypeName}</TableCell>
                    <TableCell>{req.startDate}</TableCell>
                    <TableCell>{req.endDate}</TableCell>
                    <TableCell>{req.duration} Days</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground text-xs">
                      {req.reason || "—"}
                    </TableCell>
                    <TableCell>
                      {req.status === "approved" && (
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 gap-1 text-[10px]">
                          <CheckCircle2Icon className="size-3" /> Approved
                        </Badge>
                      )}
                      {req.status === "pending" && (
                        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 gap-1 text-[10px]">
                          <ClockIcon className="size-3" /> Pending Review
                        </Badge>
                      )}
                      {req.status === "refused" && (
                        <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-600 gap-1 text-[10px]">
                          <XCircleIcon className="size-3" /> Refused
                        </Badge>
                      )}
                      {req.status === "cancelled" && (
                        <Badge variant="secondary" className="gap-1 text-[10px]">
                          <BanIcon className="size-3" /> Cancelled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {req.status === "pending" ? (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleCancelRequest(req.id)}
                          disabled={!canCancelSelf}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive text-xs"
                        >
                          Cancel
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b">
              <h2 className="text-lg font-semibold">Request Time Off</h2>
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
                <Label htmlFor="timeOffTypeId">Leave Type</Label>
                <select
                  id="timeOffTypeId"
                  required
                  value={formData.timeOffTypeId}
                  onChange={(e) => setFormData({ ...formData, timeOffTypeId: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div className="space-y-1.5">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="duration">Duration (Days)</Label>
                <Input
                  id="duration"
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reason">Reason / Notes (Optional)</Label>
                <Input
                  id="reason"
                  placeholder="e.g. Doctor's appointment, family event..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
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
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

