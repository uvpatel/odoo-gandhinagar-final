"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useCan } from "@/hooks/use-permissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  UsersIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  UserXIcon,
  UserPlusIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  RefreshCwIcon,
  KeyRoundIcon,
  Building2Icon,
  CheckCircle2Icon,
  LockIcon,
  DatabaseIcon,
  SparklesIcon,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  unlinkedEmployees: number;
  totalEmployees: number;
  roleDistribution: Record<string, number>;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
    banned: boolean | null;
    createdAt: string;
    employeeId: string | null;
    employeeNumber: string | null;
    departmentName: string | null;
  }>;
}

const ROLE_META: Record<
  string,
  { label: string; color: string; badgeVariant: "default" | "secondary" | "outline" | "destructive" }
> = {
  admin: {
    label: "Administrator",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    badgeVariant: "default",
  },
  hr_manager: {
    label: "HR Manager",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    badgeVariant: "secondary",
  },
  payroll_manager: {
    label: "Payroll Manager",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    badgeVariant: "outline",
  },
  payroll_user: {
    label: "Payroll Officer",
    color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
    badgeVariant: "outline",
  },
  employee: {
    label: "Employee",
    color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800",
    badgeVariant: "secondary",
  },
};

export default function AdminPage() {
  const { role } = useCan();
  const isAdmin = role === "admin";

  const {
    data: responseData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<{ data: AdminStats }>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load admin statistics");
      }
      return res.json();
    },
  });

  const stats = responseData?.data;

  const totalUsers = stats?.totalUsers || 0;
  const activeUsers = stats?.activeUsers || 0;
  const bannedUsers = stats?.bannedUsers || 0;
  const unlinkedEmployees = stats?.unlinkedEmployees || 0;
  const totalEmployees = stats?.totalEmployees || 0;
  const roleDistribution = stats?.roleDistribution || {};
  const recentUsers = stats?.recentUsers || [];

  const activePct = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 100;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="size-16 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
          <LockIcon className="size-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Access Restricted</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          Administration pages require the <span className="font-semibold text-foreground">admin</span> role. Your current active role is <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{role}</code>.
        </p>
        <Link href="/dashboard" className={cn(buttonVariants({ variant: "default" }), "mt-6")}>
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200">
              <ShieldCheckIcon className="size-3 mr-1" />
              Super Administration
            </Badge>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">Centralized RBAC Engine</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            System health, user governance, role distributions, and workforce account linking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 gap-1.5"
          >
            <RefreshCwIcon className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Link
            href="/admin/roles"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9 gap-1.5")}
          >
            <KeyRoundIcon className="size-3.5 text-purple-600" />
            Roles & Permissions
          </Link>

          <Link
            href="/admin/users"
            className={cn(buttonVariants({ size: "sm" }), "h-9 gap-1.5 shadow-sm")}
          >
            <UserPlusIcon className="size-3.5" />
            Manage Users
          </Link>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <Card className="border-red-300 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <AlertCircleIcon className="size-5 text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-900 dark:text-red-300">
                  Failed to load admin statistics
                </p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                  {(error as Error)?.message || "An unexpected error occurred while querying the database."}
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()} className="border-red-300">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="shadow-xs hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UsersIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <span className="animate-pulse">...</span> : totalUsers}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="font-medium text-foreground">{activeUsers}</span> active credentials
            </p>
          </CardContent>
        </Card>

        {/* Active Accounts */}
        <Card className="shadow-xs hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Accounts
            </CardTitle>
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheckIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {isLoading ? <span className="animate-pulse">...</span> : `${activePct}%`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {bannedUsers > 0 ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  {bannedUsers} suspended account{bannedUsers > 1 ? "s" : ""}
                </span>
              ) : (
                "0 suspended accounts"
              )}
            </p>
          </CardContent>
        </Card>

        {/* Unlinked Employees */}
        <Card className={`shadow-xs hover:border-border transition-colors ${unlinkedEmployees > 0 ? "border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/10" : ""}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unlinked Employees
            </CardTitle>
            <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <UserXIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {isLoading ? <span className="animate-pulse">...</span> : unlinkedEmployees}
              </div>
              {unlinkedEmployees > 0 && (
                <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:text-amber-400">
                  Needs Action
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of <span className="font-medium text-foreground">{totalEmployees}</span> registered employees
            </p>
          </CardContent>
        </Card>

        {/* Defined Roles */}
        <Card className="shadow-xs hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Configured Roles
            </CardTitle>
            <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ShieldCheckIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              5
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <CheckCircle2Icon className="size-3 text-emerald-500" />
              <span>Standardized across all modules</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Role Distribution + System Security */}
        <div className="lg:col-span-5 space-y-6">
          {/* Role Distribution Card */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Role Distribution</CardTitle>
                  <CardDescription>
                    Active user assignments per authorization tier
                  </CardDescription>
                </div>
                <Link
                  href="/admin/roles"
                  title="View Roles Matrix"
                  className={cn(buttonVariants({ variant: "ghost", size: "icon-xs" }))}
                >
                  <ArrowRightIcon className="size-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3.5">
              {Object.entries(ROLE_META).map(([roleKey, meta]) => {
                const count = roleDistribution[roleKey] || 0;
                const percentage = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;

                return (
                  <div key={roleKey} className="group space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <Link
                        href={`/admin/users?role=${roleKey}`}
                        className="font-medium hover:underline flex items-center gap-2"
                      >
                        <span className={`inline-block size-2.5 rounded-full ${meta.color.split(" ")[0]}`} />
                        <span>{meta.label}</span>
                      </Link>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-foreground">{count}</span>
                        <span className="text-muted-foreground">({percentage}%)</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          roleKey === "admin"
                            ? "bg-purple-600"
                            : roleKey === "hr_manager"
                            ? "bg-blue-600"
                            : roleKey === "payroll_manager"
                            ? "bg-emerald-600"
                            : roleKey === "payroll_user"
                            ? "bg-cyan-600"
                            : "bg-slate-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                <span>Total Assigned Users:</span>
                <span className="font-semibold text-foreground">{totalUsers}</span>
              </div>
            </CardContent>
          </Card>

          {/* System Security & Architecture Info */}
          
        </div>

        {/* Right Column: Recent Users List */}
        <div className="lg:col-span-7">
          <Card className="shadow-xs h-full flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Recently Registered Users</CardTitle>
                <CardDescription>
                  Latest user accounts created in the system
                </CardDescription>
              </div>
              <Link
                href="/admin/users"
                className={cn(buttonVariants({ variant: "outline", size: "xs" }))}
              >
                View All
              </Link>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="size-9 rounded-full bg-muted" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 w-32 bg-muted rounded" />
                        <div className="h-2.5 w-48 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentUsers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No users found.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentUsers.map((u) => {
                    const meta = ROLE_META[u.role] || ROLE_META.employee;
                    const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }) : "N/A";

                    return (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="size-9 border">
                            <AvatarImage src={u.image || undefined} alt={u.name} />
                            <AvatarFallback className="text-xs font-semibold uppercase">
                              {u.name.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-foreground truncate">
                                {u.name}
                              </span>
                              {u.banned && (
                                <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
                                  Banned
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                              <span>{u.email}</span>
                              <span>•</span>
                              <span>{dateStr}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 ml-3">
                          {/* Linked Employee Badge */}
                          {u.employeeNumber ? (
                            <Badge
                              variant="outline"
                              className="text-[11px] gap-1 hidden sm:flex items-center font-normal"
                            >
                              <Building2Icon className="size-3 text-muted-foreground" />
                              <span>{u.employeeNumber}</span>
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] hidden sm:flex border-amber-300 text-amber-700 dark:text-amber-400"
                            >
                              Unlinked
                            </Badge>
                          )}

                          {/* Role Badge */}
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${meta.color}`}
                          >
                            {meta.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Access Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <Card className="hover:border-primary/50 transition-all group shadow-xs">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="size-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <UsersIcon className="size-5" />
              </div>
              <Link
                href="/admin/users"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-xs")}
              >
                Open Users
                <ArrowRightIcon className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <CardTitle className="text-base mt-2">User Directory & Provisioning</CardTitle>
            <CardDescription className="text-xs">
              Search and filter existing credentials, provision new user accounts, link employee files, and adjust status controls.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:border-primary/50 transition-all group shadow-xs">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="size-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldCheckIcon className="size-5" />
              </div>
              <Link
                href="/admin/roles"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-xs")}
              >
                Open Roles
                <ArrowRightIcon className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <CardTitle className="text-base mt-2">Roles & Authorization Matrix</CardTitle>
            <CardDescription className="text-xs">
              Inspect module-level statement capabilities for Employee, HR Manager, Payroll Officer, Payroll Manager, and Admin.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

