"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogInIcon, LogOutIcon, Loader2Icon } from "lucide-react";

export function HeaderAttendanceWidget() {
  const [isCheckedIn, setIsCheckedIn] = React.useState(false);
  const [activeSessionStart, setActiveSessionStart] = React.useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isPending, setIsPending] = React.useState(false);

  const fetchStatus = React.useCallback(async () => {
    try {
      const res = await fetch("/api/attendance/check-in");
      if (!res.ok) {
        setIsCheckedIn(false);
        setActiveSessionStart(null);
        return;
      }
      const data = await res.json();
      if (data.isCheckedIn && data.activeRecord?.checkIn) {
        setIsCheckedIn(true);
        setActiveSessionStart(new Date(data.activeRecord.checkIn));
      } else {
        setIsCheckedIn(false);
        setActiveSessionStart(null);
      }
    } catch {
      setIsCheckedIn(false);
      setActiveSessionStart(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStatus();

    const handleAttendanceEvent = () => {
      fetchStatus();
    };

    window.addEventListener("attendance-status-changed", handleAttendanceEvent);
    return () => {
      window.removeEventListener("attendance-status-changed", handleAttendanceEvent);
    };
  }, [fetchStatus]);

  // Live timer
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isCheckedIn && activeSessionStart) {
      const updateTimer = () => {
        const diff = Math.max(0, Math.floor((Date.now() - activeSessionStart.getTime()) / 1000));
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

  const handleToggle = async () => {
    setIsPending(true);
    try {
      if (!isCheckedIn) {
        const res = await fetch("/api/attendance/check-in", { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Check-in failed");

        setIsCheckedIn(true);
        setActiveSessionStart(new Date(data.data?.checkIn || Date.now()));
        toast.success("Checked in successfully!", {
          description: `Shift started at ${new Date().toLocaleTimeString()}`,
        });
      } else {
        const res = await fetch("/api/attendance/check-out", { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Check-out failed");

        setIsCheckedIn(false);
        setActiveSessionStart(null);
        setElapsedSeconds(0);
        toast.success("Checked out successfully!", {
          description: "Shift duration recorded. Great work!",
        });
      }

      window.dispatchEvent(new CustomEvent("attendance-status-changed"));
      await fetchStatus();
    } catch (err: any) {
      toast.error("Attendance action failed", {
        description: err.message || "An unexpected error occurred",
      });
      await fetchStatus();
    } finally {
      setIsPending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground animate-pulse">
        <Loader2Icon className="size-3.5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/attendance/me"
        title="View personal attendance details"
        className="hidden sm:flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium hover:bg-muted/80 transition-colors border border-border/60 bg-background/50"
      >
        <span
          className={`size-2 rounded-full ${
            isCheckedIn ? "bg-emerald-500 animate-pulse" : "bg-zinc-400 dark:bg-zinc-600"
          }`}
        />
        {isCheckedIn ? (
          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
            {formatElapsed(elapsedSeconds)}
          </span>
        ) : (
          <span className="text-muted-foreground">Not Checked In</span>
        )}
      </Link>

      <Button
        size="sm"
        variant={isCheckedIn ? "outline" : "default"}
        onClick={handleToggle}
        disabled={isPending}
        className={`h-8 gap-1.5 text-xs font-semibold shadow-xs transition-all ${
          isCheckedIn
            ? "border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/50"
            : "bg-emerald-600 hover:bg-emerald-700 text-white"
        }`}
      >
        {isPending ? (
          <Loader2Icon className="size-3.5 animate-spin" />
        ) : isCheckedIn ? (
          <>
            <LogOutIcon className="size-3.5" />
            <span>Check Out</span>
          </>
        ) : (
          <>
            <LogInIcon className="size-3.5" />
            <span>Check In</span>
          </>
        )}
      </Button>
    </div>
  );
}
