"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCan } from "@/hooks/use-permissions";
import { TimeOffSubNav } from "@/components/time-off/time-off-subnav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  ClockIcon,
  CheckCircle2Icon,
  PlusIcon,
  LayersIcon,
  FileTextIcon,
  UserCheckIcon,
  InfoIcon,
} from "lucide-react";

export default function TimeOffPage() {
  const router = useRouter();
  const { can, role, isEmployee } = useCan();
  const [stats, setStats] = React.useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    totalAllocations: 0,
    totalTypes: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (role === "employee") {
      router.replace("/time-off/me");
      return;
    }
  }, [role, router]);

  React.useEffect(() => {
    async function loadStats() {
      try {
        setIsLoading(true);
        const [reqRes, allocRes, typesRes] = await Promise.all([
          fetch("/api/time-off/requests"),
          fetch("/api/time-off/allocations"),
          fetch("/api/time-off/types"),
        ]);

        const [reqData, allocData, typesData] = await Promise.all([
          reqRes.json(),
          allocRes.json(),
          typesRes.json(),
        ]);

        const requestsList = reqData.data || [];
        setStats({
          totalRequests: requestsList.length,
          pendingRequests: requestsList.filter((r: any) => r.status === "pending").length,
          approvedRequests: requestsList.filter((r: any) => r.status === "approved").length,
          totalAllocations: (allocData.data || []).length,
          totalTypes: (typesData.data || []).length,
        });
      } catch (err) {
        console.error("Failed to load time-off dashboard stats:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Sub-Navigation Tabs */}
      <TimeOffSubNav />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Time Off Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of leave requests, balances, allocations, and approval policies.
          </p>
        </div>

        <Link href="/time-off/requests">
          <Button>
            <PlusIcon className="mr-1.5 size-4" />
            New Time Off Request
          </Button>
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">To Approve (Pending)</CardDescription>
            <ClockIcon className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.pendingRequests}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Awaiting manager/HR review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">Approved Requests</CardDescription>
            <CheckCircle2Icon className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.approvedRequests}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Active & history leave</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">Leave Allocations</CardDescription>
            <CalendarIcon className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.totalAllocations}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Configured balance accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">Time Off Types</CardDescription>
            <LayersIcon className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTypes}</div>
            <p className="mt-1 text-xs text-muted-foreground">Configured policy types</p>
          </CardContent>
        </Card>
      </div>

      {/* Sub-module Navigation Cards (From Wireframe Diagram) */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Card 1: Time Offs */}
        <Card className="hover:shadow-md transition-all border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-semibold text-base">
              <FileTextIcon className="size-5" />
              <span>Time offs (Requests)</span>
            </div>
            <CardDescription className="text-xs leading-relaxed">
              Submit and manage leave requests with clear approval status tracking.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Link href="/time-off/requests">
              <Button variant="outline" className="w-full text-xs">
                Open Requests List →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Card 2: Time Off Types */}
        <Card className="hover:shadow-md transition-all border-purple-500/20">
          <CardHeader>
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold text-base">
              <LayersIcon className="size-5" />
              <span>Time Off Types</span>
            </div>
            <CardDescription className="text-xs leading-relaxed">
              Configure leave policies (Paid Time Off, Sick Leave, Comp Off) and approval rules.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Link href="/time-off/types">
              <Button variant="outline" className="w-full text-xs">
                Manage Policy Types →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Card 3: Allocations */}
        <Card className="hover:shadow-md transition-all border-blue-500/20">
          <CardHeader>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-base">
              <CalendarIcon className="size-5" />
              <span>Allocations</span>
            </div>
            <CardDescription className="text-xs leading-relaxed">
              View balance math (Allocated, Taken, Remaining) and grant annual leave allocations.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Link href="/time-off/allocations">
              <Button variant="outline" className="w-full text-xs">
                View Leave Balances →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Useful Note Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-blue-800 dark:text-blue-300">
        <InfoIcon className="size-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
        <div>
          <span className="font-semibold">Useful note:</span> Requests, allocations, and Time Off Types must be reached from the Time Off navbar dropdown/sub-menu. Approved allocations create available leave balances, and approved leave reduces available balance.
        </div>
      </div>
    </div>
  );
}

