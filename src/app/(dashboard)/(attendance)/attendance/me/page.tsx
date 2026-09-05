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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ClockIcon,
  CheckCircle2Icon,
  InfoIcon,
  LogInIcon,
  LogOutIcon,
  CalendarIcon,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";

type AttendanceItem = {
  id: string;
  attendanceDate: string;
  checkIn: string | null;
  checkOut: string | null;
  workedMinutes: number;
  status: string;
  notes: string | null;
};

export default function MyAttendancePage() {
  const { session } = useCan();
  const [attendanceList, setAttendanceList] = React.useState<AttendanceItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCheckedIn, setIsCheckedIn] = React.useState(false);
  const [activeStart, setActiveStart] = React.useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [isPending, setIsPending] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/attendance?todayOnly=false");
      const data = await res.json();
      if (data.data) {
        setAttendanceList(data.data);
        const todayStr = new Date().toISOString().split("T")[0];
        const todayRec = data.data.find(
          (a: AttendanceItem) => a.attendanceDate === todayStr && a.checkIn && !a.checkOut
        );

        if (todayRec && todayRec.checkIn) {
          setIsCheckedIn(true);
          setActiveStart(new Date(todayRec.checkIn));
        } else {
          setIsCheckedIn(false);
          setActiveStart(null);
        }
      }
    } catch (err) {
      console.error("Failed to load my attendance:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Timer interval for elapsed time
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isCheckedIn && activeStart) {
      const updateTimer = () => {
        const diff = Math.max(0, Math.floor((new Date().getTime() - activeStart.getTime()) / 1000));
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
  }, [isCheckedIn, activeStart]);

  const handleQuickAction = async () => {
    setIsPending(true);
    try {
      if (!isCheckedIn) {
        const res = await fetch("/api/attendance/check-in", { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Check-in failed");

        toast.success("Checked in successfully!", {
          description: `Timestamp: ${new Date().toLocaleTimeString()}`,
        });
        setIsCheckedIn(true);
        setActiveStart(new Date());
      } else {
        const res = await fetch("/api/attendance/check-out", { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Check-out failed");

        toast.success("Checked out successfully!");
        setIsCheckedIn(false);
        setActiveStart(null);
      }
      fetchData();
    } catch (err: any) {
      toast.error("Action failed", { description: err.message });
    } finally {
      setIsPending(false);
    }
  };

  const formatElapsed = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimeStr = (isoStr: string | null) => {
    if (!isoStr) return "—";
    try {
      return new Date(isoStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "—";
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
          <Button variant="secondary" size="sm" className="text-xs font-semibold">
            My Attendance
          </Button>
        </Link>
        <Link href="/attendance/exceptions">
          <Button variant="ghost" size="sm" className="text-xs">
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Attendance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View your personal check-in / check-out history and mark attendance.
        </p>
      </div>

      {/* Quick Action Punch Card */}
      <Card className="border-primary/20 bg-muted/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <span
                className={`size-4 rounded-full ${
                  isCheckedIn ? "bg-emerald-500 animate-ping" : "bg-rose-500"
                }`}
              />
              <div>
                <h3 className="text-lg font-bold">
                  Welcome back, {session?.user?.name || "Employee"}!
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isCheckedIn
                    ? "You are currently checked in."
                    : "You are checked out. Click below to start your shift."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-xs text-muted-foreground block">Session Duration</span>
                <span className="text-xl font-mono font-bold text-primary">
                  {isCheckedIn ? formatElapsed(elapsedSeconds) : "00:00:00"}
                </span>
              </div>

              <Button
                size="lg"
                onClick={handleQuickAction}
                disabled={isPending}
                className={
                  isCheckedIn
                    ? "bg-rose-600 hover:bg-rose-700 text-white font-bold"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                }
              >
                {isPending ? (
                  "Processing..."
                ) : isCheckedIn ? (
                  <div className="flex items-center gap-2">
                    <LogOutIcon className="size-4" /> Check Out
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogInIcon className="size-4" /> Check In
                  </div>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Attendance History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Attendance History</CardTitle>
          <CardDescription className="text-xs">Your logged shift records</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Worked Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Loading personal records...
                  </TableCell>
                </TableRow>
              ) : attendanceList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No personal attendance records logged yet.
                  </TableCell>
                </TableRow>
              ) : (
                attendanceList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-xs">{item.attendanceDate}</TableCell>
                    <TableCell className="font-mono text-xs text-emerald-600">
                      {formatTimeStr(item.checkIn)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-blue-600">
                      {formatTimeStr(item.checkOut)}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold">
                      {(item.workedMinutes / 60).toFixed(2)} hrs
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Useful Note Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-blue-800 dark:text-blue-300">
        <InfoIcon className="size-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
        <div>
          <span className="font-semibold">Useful note:</span> Employees can mark attendance from the quick widget and review their own personal records.
        </div>
      </div>
    </div>
  );
}

