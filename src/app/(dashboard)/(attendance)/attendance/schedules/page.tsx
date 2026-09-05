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
  CalendarDaysIcon,
  SearchIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  InfoIcon,
  ClockIcon,
  CheckCircle2Icon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

type WorkingScheduleItem = {
  id: string;
  name: string;
  scheduleType: string;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AttendanceSchedulesPage() {
  const { can } = useCan();
  const [schedules, setSchedules] = React.useState<WorkingScheduleItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingSchedule, setEditingSchedule] = React.useState<WorkingScheduleItem | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [formData, setFormData] = React.useState({
    name: "",
    scheduleType: "standard",
    timezone: "Asia/Kolkata",
    workDaysCount: "5",
    startTime: "09:00",
    endTime: "18:00",
    breakMinutes: "60",
    isActive: true,
  });

  const fetchSchedules = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/working-schedules");
      if (!res.ok) throw new Error("Failed to load working schedules");
      const json = await res.json();
      setSchedules(json.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load schedules");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleOpenCreate = () => {
    setEditingSchedule(null);
    setFormData({
      name: "",
      scheduleType: "standard",
      timezone: "Asia/Kolkata",
      workDaysCount: "5",
      startTime: "09:00",
      endTime: "18:00",
      breakMinutes: "60",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (schedule: WorkingScheduleItem) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      scheduleType: schedule.scheduleType || "standard",
      timezone: schedule.timezone || "Asia/Kolkata",
      workDaysCount: "5",
      startTime: "09:00",
      endTime: "18:00",
      breakMinutes: "60",
      isActive: schedule.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter schedule name");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSchedule) {
        // PUT update
        const res = await fetch("/api/working-schedules", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingSchedule.id,
            name: formData.name.trim(),
            scheduleType: formData.scheduleType,
            timezone: formData.timezone,
            isActive: formData.isActive,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to update schedule");
        toast.success("Working schedule updated successfully");
      } else {
        // POST create
        const res = await fetch("/api/working-schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name.trim(),
            scheduleType: formData.scheduleType,
            timezone: formData.timezone,
            isActive: formData.isActive,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to create schedule");
        toast.success("Working schedule created successfully");
      }
      setIsModalOpen(false);
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete working schedule "${name}"?`)) return;

    try {
      const res = await fetch(`/api/working-schedules?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete schedule");

      toast.success("Working schedule deleted successfully");
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete schedule");
    }
  };

  const filteredSchedules = schedules.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.scheduleType.toLowerCase().includes(q) ||
      s.timezone.toLowerCase().includes(q)
    );
  });

  // Calculate helper for weekly hours display
  const calculateHoursPerWeek = (workDays: number, start: string, end: string, breakMins: number) => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const dailyMins = eh * 60 + em - (sh * 60 + sm) - breakMins;
    const dailyHours = Math.max(0, dailyMins / 60);
    return (dailyHours * workDays).toFixed(1);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Sub Navigation Tabs */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Working Schedules
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure company work calendars, shifts, and standard weekly hours patterns
          </p>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 self-start md:self-auto">
          <Link
            href="/attendance"
            className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white dark:hover:bg-slate-700"
          >
            All Attendance
          </Link>
          <Link
            href="/attendance/me"
            className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white dark:hover:bg-slate-700"
          >
            My Attendance
          </Link>
          <Link
            href="/attendance/exceptions"
            className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white dark:hover:bg-slate-700"
          >
            Exceptions
          </Link>
          <Link
            href="/attendance/schedules"
            className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
          >
            Working Schedules
          </Link>
        </div>
      </div>

      {/* Toolbar / Search & Add */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search schedule name, type, timezone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {can("workingSchedule", "create") && (
            <Button
              onClick={handleOpenCreate}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Working Schedule
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Schedules Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
            Configured Working Schedules ({filteredSchedules.length})
          </CardTitle>
          <CardDescription>
            Master schedule records used for tracking attendance, employee shifts, and overtime limits.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading working schedules...</div>
          ) : filteredSchedules.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <ClockIcon className="h-10 w-10 mx-auto text-slate-400" />
              <p className="font-medium">No working schedules found</p>
              <p className="text-xs text-slate-400">
                {searchTerm ? "Try adjusting your search query." : "Click 'New Working Schedule' to define your first work schedule."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                  <TableHead className="font-semibold">Schedule Name</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Days / Week</TableHead>
                  <TableHead className="font-semibold">Standard Hours</TableHead>
                  <TableHead className="font-semibold">Timezone</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchedules.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                      {item.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs font-normal">
                        {item.scheduleType.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300 text-sm">
                      5 Days (Mon - Fri)
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300 text-sm">
                      <div className="flex items-center gap-1.5">
                        <ClockIcon className="h-3.5 w-3.5 text-blue-500" />
                        <span>40.0 hrs / week (09:00 - 18:00)</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400 text-xs font-mono">
                      {item.timezone}
                    </TableCell>
                    <TableCell>
                      {item.isActive ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 font-medium">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-slate-500 font-medium">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {can("workingSchedule", "update") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(item)}
                            className="h-8 px-2 text-slate-600 hover:text-blue-600"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        )}
                        {can("workingSchedule", "delete") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(item.id, item.name)}
                            className="h-8 px-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form View Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-lg w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {editingSchedule ? "Edit Working Schedule" : "Create Working Schedule"}
                </h3>
                <p className="text-xs text-slate-500">
                  Define weekly work pattern, default check-in window, and timezone
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="sched-name" className="text-sm font-medium">
                  Schedule Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="sched-name"
                  placeholder="e.g. Standard 40h Working Week"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sched-type" className="text-sm font-medium">
                    Schedule Type
                  </Label>
                  <select
                    id="sched-type"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                    value={formData.scheduleType}
                    onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
                  >
                    <option value="standard">Standard Full-Time</option>
                    <option value="flexible">Flexible Hours</option>
                    <option value="shift">Shift Work</option>
                    <option value="part_time">Part-Time</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sched-tz" className="text-sm font-medium">
                    Timezone
                  </Label>
                  <select
                    id="sched-tz"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                    <option value="UTC">UTC (GMT +0:00)</option>
                    <option value="America/New_York">America/New_York (EST -5:00)</option>
                    <option value="Europe/London">Europe/London (GMT +0:00)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                  </select>
                </div>
              </div>

              {/* Weekly Work Hours Configuration */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Weekly Pattern & Times
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="sched-start" className="text-xs">
                      Start Time
                    </Label>
                    <Input
                      id="sched-start"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="sched-end" className="text-xs">
                      End Time
                    </Label>
                    <Input
                      id="sched-end"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="sched-break" className="text-xs">
                      Break (Mins)
                    </Label>
                    <Input
                      id="sched-break"
                      type="number"
                      value={formData.breakMinutes}
                      onChange={(e) => setFormData({ ...formData, breakMinutes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1 border-t dark:border-slate-700">
                  <span>Calculated Hours:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {calculateHoursPerWeek(
                      Number(formData.workDaysCount),
                      formData.startTime,
                      formData.endTime,
                      Number(formData.breakMinutes)
                    )}{" "}
                    hrs / week (5 days)
                  </span>
                </div>
              </div>

              {/* Status Switch */}
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label className="text-sm">Active Schedule</Label>
                  <p className="text-xs text-slate-500">
                    Active schedules can be selected on employee profiles and contracts
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingSchedule
                    ? "Update Schedule"
                    : "Create Schedule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Useful Note Footer Banner */}
      <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-sm flex items-start gap-3">
        <InfoIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Useful note:</span> Working Schedules define standard working hours and weekly patterns used for attendance tracking, missing punch exception alerts, and payroll overtime calculations.
        </div>
      </div>
    </div>
  );
}

