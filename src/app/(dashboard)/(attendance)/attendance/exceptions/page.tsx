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
  AlertTriangleIcon,
  SearchIcon,
  PencilIcon,
  InfoIcon,
  CheckCircle2Icon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

type ExceptionItem = {
  id: string;
  employeeId: string;
  employeeName: string | null;
  employeeNumber: string | null;
  departmentName: string | null;
  attendanceDate: string;
  checkIn: string | null;
  checkOut: string | null;
  workedMinutes: number;
  status: string;
  notes: string | null;
};

export default function AttendanceExceptionsPage() {
  const { can } = useCan();
  const [exceptionsList, setExceptionsList] = React.useState<ExceptionItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<ExceptionItem | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    checkIn: "",
    checkOut: "",
    notes: "Manually corrected missing punch.",
  });

  const canUpdate = can("attendance", "update");

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/attendance?todayOnly=false");
      const data = await res.json();
      if (data.data) {
        // Filter records that have exceptions (missing check-out, incomplete status, absent, etc.)
        const exceptions = data.data.filter(
          (a: ExceptionItem) =>
            (!a.checkOut && a.checkIn) ||
            a.status === "incomplete" ||
            a.status === "absent" ||
            a.workedMinutes === 0
        );
        setExceptionsList(exceptions);
      }
    } catch (err) {
      console.error("Failed to load exceptions:", err);
      toast.error("Failed to load attendance exceptions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openFixModal = (item: ExceptionItem) => {
    setSelectedItem(item);
    const checkInLocal = item.checkIn
      ? new Date(item.checkIn).toISOString().slice(0, 16)
      : "";
    const checkOutLocal = item.checkOut
      ? new Date(item.checkOut).toISOString().slice(0, 16)
      : "";

    setFormData({
      checkIn: checkInLocal,
      checkOut: checkOutLocal,
      notes: "Manually resolved missing punch / exception.",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedItem.id,
          checkIn: formData.checkIn ? new Date(formData.checkIn).toISOString() : null,
          checkOut: formData.checkOut ? new Date(formData.checkOut).toISOString() : null,
          status: "present",
          notes: formData.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resolve exception");

      toast.success("Punch exception resolved successfully");
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Action failed", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = exceptionsList.filter(
    (e) =>
      (e.employeeName && e.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.employeeNumber && e.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatTimeStr = (isoStr: string | null) => {
    if (!isoStr) return "Missing Punch";
    try {
      return new Date(isoStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Missing Punch";
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b pb-3">
        <Link href="/attendance">
          <Button variant="ghost" size="sm" className="text-xs">
            All Attendance
          </Button>
        </Link>
        <Link href="/attendance/me">
          <Button variant="ghost" size="sm" className="text-xs">
            My Attendance
          </Button>
        </Link>
        <Link href="/attendance/exceptions">
          <Button variant="secondary" size="sm" className="text-xs font-semibold">
            Exceptions / Missing Punches
          </Button>
        </Link>
        <Link href="/attendance/schedules">
          <Button variant="ghost" size="sm" className="text-xs">
            Working Schedules
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Attendance Exceptions</h1>
            <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-600 text-xs">
              {exceptionsList.length} Exceptions
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Review missing punches, incomplete sessions, and unclosed shift logs requiring HR resolution.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search exceptions by employee name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Exceptions Table */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Scanning attendance exceptions...</span>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <CheckCircle2Icon className="mx-auto size-8 text-emerald-500" />
          <h3 className="mt-3 text-base font-semibold">No attendance exceptions found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            All employee check-in and check-out logs are clean and complete!
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
                  <TableHead>Issue / Exception</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{item.employeeName}</span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {item.employeeNumber}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium">{item.attendanceDate}</TableCell>
                    <TableCell className="text-xs font-mono text-emerald-600">
                      {formatTimeStr(item.checkIn)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-rose-600 font-semibold">
                      {formatTimeStr(item.checkOut)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 text-[11px]">
                        {!item.checkOut ? "Missing Check-Out" : "Incomplete Session"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => openFixModal(item)}
                        disabled={!canUpdate}
                        className="border-primary/30 text-primary hover:bg-primary/10"
                      >
                        <PencilIcon className="mr-1 size-3" /> Fix Punch
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Useful Note Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-800 dark:text-amber-300">
        <InfoIcon className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <div>
          <span className="font-semibold">Useful note:</span> List view helps HR and managers quickly identify missing punches and resolve attendance anomalies before payroll run.
        </div>
      </div>

      {/* Fix Punch Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b">
              <h2 className="text-lg font-bold">
                Fix Punch: {selectedItem.employeeName} ({selectedItem.attendanceDate})
              </h2>
              <Button variant="ghost" size="icon-xs" onClick={() => setIsModalOpen(false)}>
                <XIcon className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="checkIn">Check In Timestamp</Label>
                <Input
                  id="checkIn"
                  type="datetime-local"
                  required
                  value={formData.checkIn}
                  onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="checkOut">Check Out Timestamp</Label>
                <Input
                  id="checkOut"
                  type="datetime-local"
                  required
                  value={formData.checkOut}
                  onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Correction Note</Label>
                <textarea
                  id="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Resolve Punch"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

