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
  ShieldCheckIcon,
  LockIcon,
  SearchIcon,
  FilterIcon,
  UserIcon,
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

export default function TimeOffRequestsPage() {
  const { can, role } = useCan();
  const [requests, setRequests] = React.useState<TimeOffRequestItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("pending");
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const canApprove = can("timeOffRequest", "approve");
  const canRefuse = can("timeOffRequest", "refuse");

  const fetchRequests = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/time-off/requests");
      const data = await res.json();
      if (data.data) {
        setRequests(data.data);
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

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
      "Scheduling conflict or department coverage requirements"
    );
    if (reason === null) return; // User cancelled

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
    } catch (err: any) {
      toast.error("Refusal action failed", { description: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.timeOffTypeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Time Off Requests</h1>
            {canApprove ? (
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1"
              >
                <ShieldCheckIcon className="size-3" />
                Approver Privileges ({role.replace("_", " ")})
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1"
              >
                <LockIcon className="size-3" />
                Reviewer / Read-Only ({role.replace("_", " ")})
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Review, approve, or refuse company-wide leave requests across all departments.
          </p>
        </div>
      </div>

      {/* Access info banner if user cannot approve */}
      {!canApprove && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <LockIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p>
            You are viewing requests in <strong>audit mode</strong>. Approval and refusal actions are
            strictly reserved for <strong>HR Managers</strong> and <strong>Admins</strong>.
          </p>
        </div>
      )}

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by employee name or leave type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="pending">Pending ({pendingCount})</option>
                <option value="approved">Approved</option>
                <option value="refused">Refused</option>
                <option value="cancelled">Cancelled</option>
                <option value="all">All Requests</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Reason / Notes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Approval Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading requests...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No requests found matching current filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium">
                        <div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          {req.employeeName.charAt(0)}
                        </div>
                        <span>{req.employeeName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{req.timeOffTypeName}</TableCell>
                    <TableCell className="text-xs">
                      {req.startDate} to {req.endDate}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{req.duration} Days</TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
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
                          <ClockIcon className="size-3" /> Pending
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
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve Button */}
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleApprove(req.id, req.employeeName)}
                            disabled={!canApprove || processingId === req.id}
                            title={
                              canApprove
                                ? "Approve request"
                                : "Requires HR Manager or Admin privileges"
                            }
                            className={
                              canApprove
                                ? "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
                                : "opacity-40 cursor-not-allowed"
                            }
                          >
                            <CheckIcon className="mr-1 size-3" />
                            Approve
                          </Button>

                          {/* Refuse Button */}
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleRefuse(req.id, req.employeeName)}
                            disabled={!canRefuse || processingId === req.id}
                            title={
                              canRefuse
                                ? "Refuse request"
                                : "Requires HR Manager or Admin privileges"
                            }
                            className={
                              canRefuse
                                ? "border-rose-500/30 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                                : "opacity-40 cursor-not-allowed"
                            }
                          >
                            <XIcon className="mr-1 size-3" />
                            Refuse
                          </Button>
                        </div>
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
    </div>
  );
}

