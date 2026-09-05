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
  SearchIcon,
  PencilIcon,
  Trash2Icon,
  ClockIcon,
  CheckCircle2Icon,
  XIcon,
  LockIcon,
  InfoIcon,
  Building2Icon,
  UserCheckIcon,
  AlertCircleIcon,
  CalendarIcon,
  LogInIcon,
  LogOutIcon,
  PlusIcon,
} from "lucide-react";
import { toast } from "sonner";

type AttendanceItem = {
  id: string;
  employeeId: string;
  employeeName: string | null;
  employeeNumber: string | null;
  departmentName: string | null;
  attendanceDate: string;
  checkIn: string | null;
  checkOut: string | null;
  workedMinutes: number;
  overtimeMinutes: number;
  status: "present" | "late" | "absent" | "overtime" | "incomplete";
  isManuallyEdited: boolean;
  notes: string | null;
  createdAt: string;
};

type EmployeeOption = {
  id: string;
  fullName: string;
  employeeNumber: string;
};

const statusColors: Record<string, string> = {
  present: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium",
  late: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium",
  absent: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium",
  overtime: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium",
  incomplete: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium",
};

const statusLabels: Record<string, string> = {
  present: "Present",
  late: "Late",
  absent: "Absent",
  overtime: "Overtime",
  incomplete: "Incomplete",
};

export default function AttendancePage() {
  const { can, session } = useCan();
  const [attendanceList, setAttendanceList] = React.useState<AttendanceItem[]>([]);
  const [employeesList, setEmployeesList] = React.useState<EmployeeOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isTodayOnly, setIsTodayOnly] = React.useState(false);
  const [employeeFilter, setEmployeeFilter] = React.useState("all");

  // Quick Attendance Widget Popup
  const [isWidgetOpen, setIsWidgetOpen] = React.useState(false);
  const [isCheckedIn, setIsCheckedIn] = React.useState(false);
  const [activeSessionStart, setActiveSessionStart] = React.useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [isActionPending, setIsActionPending] = React.useState(false);

  // Detail / Form View Modal
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<AttendanceItem | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = React.useState(false);

  // Form State
  const [formData, setFormData] = React.useState({
    employeeId: "",
    attendanceDate: new Date().toISOString().split("T")[0],
    checkIn: "",
    checkOut: "",
    status: "present" as AttendanceItem["status"],
    notes: "",
  });

  const canCreate = can("attendance", "create");
  const canUpdate = can("attendance", "update");
  const canDelete = can("attendance", "delete");

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (isTodayOnly) queryParams.set("todayOnly", "true");
      if (employeeFilter !== "all") queryParams.set("employeeId", employeeFilter);
      if (searchTerm) queryParams.set("q", searchTerm);

      const [attRes, empRes] = await Promise.all([
        fetch(`/api/attendance?${queryParams.toString()}`),
        fetch("/api/employees"),
      ]);

      const [attData, empData] = await Promise.all([attRes.json(), empRes.json()]);

      if (attData.data) {
        setAttendanceList(attData.data);

        // Check if user has an active check-in today
        const todayStr = new Date().toISOString().split("T")[0];
        const userTodayRecord = attData.data.find(
          (a: AttendanceItem) => a.attendanceDate === todayStr && a.checkIn && !a.checkOut
        );

        if (userTodayRecord && userTodayRecord.checkIn) {
          setIsCheckedIn(true);
          setActiveSessionStart(new Date(userTodayRecord.checkIn));
        } else {
          setIsCheckedIn(false);
          setActiveSessionStart(null);
        }
      }

      if (empData.data) setEmployeesList(empData.data);
    } catch (err) {
      console.error("Failed to load attendance records:", err);
      toast.error("Failed to fetch attendance data");
    } finally {
      setIsLoading(false);
    }
  }, [isTodayOnly, employeeFilter, searchTerm]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Live timer for check-in widget
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isCheckedIn && activeSessionStart) {
      const updateTimer = () => {
        const diff = Math.max(0, Math.floor((new Date().getTime() - activeSessionStart.getTime()) / 1000));
        setElapsedSeconds(diff);
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCheckedIn, activeSessionStart]);

  const formatElapsed = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatHoursDecimal = (minutes: number) => {
    return (minutes / 60).toFixed(2);
  };

  const formatTimeStr = (isoStr: string | null) => {
    if (!isoStr) return "—";
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "—";
    }
  };

  // Quick Action Check In / Check Out
  const handleQuickAction = async () => {
    setIsActionPending(true);
    try {
      if (!isCheckedIn) {
        // Perform Check-in
        const res = await fetch("/api/attendance/check-in", { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Check-in failed");

        toast.success("Checked in successfully!", {
          description: `Timestamp: ${new Date().toLocaleTimeString()}`,
        });
        setIsCheckedIn(true);
        setActiveSessionStart(new Date());
      } else {
        // Perform Check-out
        const res = await fetch("/api/attendance/check-out", { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Check-out failed");

        toast.success("Checked out successfully!", {
          description: `Total duration recorded. Have a great day!`,
        });
        setIsCheckedIn(false);
        setActiveSessionStart(null);
      }
      fetchData();
    } catch (err: any) {
      toast.error("Action failed", { description: err.message });
    } finally {
      setIsActionPending(false);
    }
  };

  // Open Form / Detail Modal for Edit or Manual Entry
  const openEditModal = (item: AttendanceItem) => {
    if (!canUpdate) {
      toast.error("Permission denied", {
        description: "You do not have privileges to modify attendance records.",
      });
      return;
    }
    setEditingItem(item);

    const checkInLocal = item.checkIn
      ? new Date(item.checkIn).toISOString().slice(0, 16)
      : "";
    const checkOutLocal = item.checkOut
      ? new Date(item.checkOut).toISOString().slice(0, 16)
      : "";

    setFormData({
      employeeId: item.employeeId,
      attendanceDate: item.attendanceDate,
      checkIn: checkInLocal,
      checkOut: checkOutLocal,
      status: item.status,
      notes: item.notes || "System generated from check in/out or manually corrected by an authorized user.",
    });
    setIsFormOpen(true);
  };

  const openCreateModal = () => {
    if (!canCreate) {
      toast.error("Permission denied", {
        description: "You do not have privileges to manually create attendance records.",
      });
      return;
    }
    setEditingItem(null);
    const todayStr = new Date().toISOString().split("T")[0];

    setFormData({
      employeeId: employeesList[0]?.id || "",
      attendanceDate: todayStr,
      checkIn: `${todayStr}T09:00`,
      checkOut: `${todayStr}T18:00`,
      status: "present",
      notes: "Manually created by HR administrator.",
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (item: AttendanceItem) => {
    if (!canDelete) {
      toast.error("Permission denied", {
        description: "You do not have privileges to delete attendance records.",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete attendance for ${item.employeeName} on ${item.attendanceDate}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/attendance?id=${item.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete record");

      toast.success("Attendance record deleted");
      setAttendanceList((prev) => prev.filter((a) => a.id !== item.id));
    } catch (err: any) {
      toast.error("Action failed", { description: err.message });
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingForm(true);

    try {
      const payload = {
        ...formData,
        checkIn: formData.checkIn ? new Date(formData.checkIn).toISOString() : null,
        checkOut: formData.checkOut ? new Date(formData.checkOut).toISOString() : null,
      };

      if (editingItem) {
        const res = await fetch("/api/attendance", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingItem.id, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update record");

        toast.success("Attendance record updated successfully");
      } else {
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create record");

        toast.success("Attendance record created successfully");
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Operation failed", { description: err.message });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Metrics
  const totalCount = attendanceList.length;
  const presentCount = attendanceList.filter((a) => a.status === "present" || a.status === "overtime").length;
  const incompleteCount = attendanceList.filter((a) => a.checkIn && !a.checkOut).length;
  const avgWorkedMins =
    attendanceList.length > 0
      ? Math.round(
          attendanceList.reduce((acc, curr) => acc + (curr.workedMinutes || 0), 0) / attendanceList.length
        )
      : 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
            <Badge variant="outline" className="font-mono text-xs">
              {totalCount} Records
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            List view of employee attendance records, check-in/out timestamps, and worked hours.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Check In / Check Out Widget Trigger Button */}
          <Button
            variant={isCheckedIn ? "outline" : "default"}
            onClick={() => setIsWidgetOpen(true)}
            className="flex items-center gap-2 shadow-sm"
          >
            <span
              className={`size-2.5 rounded-full ${
                isCheckedIn ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            />
            {isCheckedIn ? "Checked In (Open Widget)" : "Check In / Out Widget"}
          </Button>

          {/* Add Manual Record */}
          {canCreate && (
            <Button variant="outline" onClick={openCreateModal}>
              <PlusIcon className="mr-1.5 size-4" />
              Manual Record
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">Present Today</CardDescription>
            <UserCheckIcon className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {presentCount}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Staff checked in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">Incomplete / Active</CardDescription>
            <ClockIcon className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {incompleteCount}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Awaiting check-out punch</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">Avg Daily Shift</CardDescription>
            <CalendarIcon className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatHoursDecimal(avgWorkedMins)} hrs
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Average worked duration</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">Total Entries</CardDescription>
            <CheckCircle2Icon className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">Logged attendance sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search attendance by employee name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Today Filter Button */}
            <div>
              <Button
                type="button"
                variant={isTodayOnly ? "default" : "outline"}
                onClick={() => setIsTodayOnly(!isTodayOnly)}
                className="w-full text-xs"
              >
                <CalendarIcon className="mr-1.5 size-3.5" />
                {isTodayOnly ? "Showing Today Only" : "Filter: Today"}
              </Button>
            </div>

            {/* Employee Filter */}
            <div>
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">Employee: All</option>
                {employeesList.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Attendance Table */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Loading attendance logs from database...</span>
          </div>
        </Card>
      ) : attendanceList.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <ClockIcon className="mx-auto size-8 text-muted-foreground" />
          <h3 className="mt-3 text-base font-semibold">No attendance records found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No check-in or check-out records match your current filter selections.
          </p>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Worked Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{item.employeeName || "Unknown Employee"}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {item.employeeNumber && <span>{item.employeeNumber}</span>}
                          {item.departmentName && (
                            <Badge variant="outline" className="text-[10px] py-0">
                              {item.departmentName}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {item.attendanceDate}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {formatTimeStr(item.checkIn)}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-medium text-blue-600 dark:text-blue-400">
                      {formatTimeStr(item.checkOut)}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {formatHoursDecimal(item.workedMinutes)} hrs
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[11px] px-2.5 py-0.5 capitalize ${
                          statusColors[item.status] || ""
                        }`}
                      >
                        {statusLabels[item.status] || item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => openEditModal(item)}
                          title={canUpdate ? "View / Edit Form" : "View Details"}
                        >
                          <PencilIcon className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDelete(item)}
                          disabled={!canDelete}
                          title={canDelete ? "Delete Record" : "Requires HR Manager or Admin"}
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
      <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-blue-800 dark:text-blue-300">
        <InfoIcon className="size-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
        <div>
          <span className="font-semibold">Useful note:</span> List view should help users review raw check-in / check-out data and identify missing punches quickly.
        </div>
      </div>

      {/* Attendance Quick Widget Modal (From Wireframe) */}
      {isWidgetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl animate-in fade-in zoom-in-95">
            {/* Header with Status Indicator Dot */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-2">
                <span
                  className={`size-3 rounded-full ${
                    isCheckedIn ? "bg-emerald-500 animate-ping" : "bg-rose-500"
                  }`}
                />
                <h2 className="text-lg font-bold">Attendance Widget</h2>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsWidgetOpen(false)}
              >
                <XIcon className="size-4" />
              </Button>
            </div>

            {/* Widget Content */}
            <div className="mt-6 text-center space-y-6">
              <div>
                <p className="text-xs text-muted-foreground">Welcome back,</p>
                <h3 className="text-xl font-extrabold tracking-tight text-foreground mt-0.5">
                  {session?.user?.name || "User Name"}
                </h3>
              </div>

              <div className="rounded-xl bg-muted/40 p-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <ClockIcon className="size-4 text-primary" />
                    {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — <span className="font-semibold">Now</span>
                  </span>
                  <span className="font-mono font-bold text-primary">
                    {isCheckedIn ? formatElapsed(elapsedSeconds) : "00:00:00"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm border-t border-border pt-3">
                  <span className="text-muted-foreground">Today Worked</span>
                  <span className="font-mono font-semibold">
                    {isCheckedIn ? `${(elapsedSeconds / 3600).toFixed(2)} hrs` : "0.00 hrs"}
                  </span>
                </div>
              </div>

              {/* Main Quick Check In / Check Out Action Button */}
              <Button
                size="lg"
                onClick={handleQuickAction}
                disabled={isActionPending}
                className={`w-full py-6 text-base font-bold shadow-lg transition-all ${
                  isCheckedIn
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                }`}
              >
                {isActionPending ? (
                  "Processing..."
                ) : isCheckedIn ? (
                  <div className="flex items-center justify-center gap-2">
                    <LogOutIcon className="size-5" />
                    Check Out
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <LogInIcon className="size-5" />
                    Check In
                  </div>
                )}
              </Button>

              {/* Attendance Quick Action Note (From Wireframe) */}
              <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 text-left text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <InfoIcon className="size-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Attendance Quick Action Note:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-foreground">
                  <li>Clicking the attendance icon opens the Check In / Check Out popup.</li>
                  <li>If there is no active session, show Check In.</li>
                  <li>If the user is already checked in, show Check Out.</li>
                  <li>The popup displays elapsed time till now.</li>
                  <li>After successful Check In, the status indicator changes to green.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Detail / Form View Modal (From Wireframe) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h2 className="text-lg font-bold">
                  {editingItem
                    ? `Attendance / ${editingItem.employeeName || "Employee"} / ${editingItem.attendanceDate}`
                    : "Create Attendance Record"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Form view of one attendance record</p>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsFormOpen(false)}
              >
                <XIcon className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmitForm} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Employee */}
                <div className="space-y-1.5">
                  <Label htmlFor="employeeId">Employee</Label>
                  <select
                    id="employeeId"
                    required
                    disabled={Boolean(editingItem)}
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

                {/* Attendance Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="attendanceDate">Attendance Date</Label>
                  <Input
                    id="attendanceDate"
                    type="date"
                    required
                    value={formData.attendanceDate}
                    onChange={(e) => setFormData({ ...formData, attendanceDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Check In */}
                <div className="space-y-1.5">
                  <Label htmlFor="checkIn">Check In Time</Label>
                  <Input
                    id="checkIn"
                    type="datetime-local"
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                  />
                </div>

                {/* Check Out */}
                <div className="space-y-1.5">
                  <Label htmlFor="checkOut">Check Out Time</Label>
                  <Input
                    id="checkOut"
                    type="datetime-local"
                    value={formData.checkOut}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Status */}
                <div className="space-y-1.5">
                  <Label htmlFor="status">Attendance Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as AttendanceItem["status"],
                      })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                    <option value="overtime">Overtime</option>
                    <option value="incomplete">Incomplete</option>
                  </select>
                </div>

                {/* Calculated Worked Hours Preview */}
                <div className="space-y-1.5">
                  <Label>Calculated Worked Hours</Label>
                  <div className="h-9 w-full rounded-md border border-input bg-muted px-3 text-sm font-semibold flex items-center text-foreground">
                    {editingItem ? `${formatHoursDecimal(editingItem.workedMinutes)} hrs` : "Auto-calculated on save"}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes / Correction Audit</Label>
                <textarea
                  id="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="System generated from check in/out or manually corrected by an authorized user."
                />
              </div>

              {/* Useful Note Banner in Form */}
              <div className="flex items-start gap-2.5 rounded-md bg-blue-500/5 border border-blue-500/20 p-3 text-xs text-blue-800 dark:text-blue-300">
                <InfoIcon className="size-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <div>
                  <span className="font-semibold">Useful note:</span> Worked hours and overtime should be easy to read because they later influence payroll or reporting.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmittingForm}>
                  {isSubmittingForm
                    ? "Saving..."
                    : editingItem
                    ? "Update Attendance"
                    : "Create Attendance"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

