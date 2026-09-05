"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useCan } from "@/hooks/use-permissions";
import {
  statement,
  hasPermission,
  type AppRole,
  type ResourceName,
  type ActionName,
} from "@/lib/auth/permissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShieldCheckIcon,
  UsersIcon,
  LockIcon,
  CheckIcon,
  MinusIcon,
  SearchIcon,
  ArrowRightIcon,
  UserRoundIcon,
  CheckCircle2Icon,
  InfoIcon,
  Code2Icon,
  LayersIcon,
  Building2Icon,
  CalendarDaysIcon,
  WalletCardsIcon,
  SlidersIcon,
  FileCode2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleDefinition {
  key: AppRole;
  title: string;
  badgeLabel: string;
  badgeClass: string;
  bgLight: string;
  borderClass: string;
  persona: string;
  description: string;
  responsibilities: string[];
}

const ROLES_LIST: RoleDefinition[] = [
  {
    key: "admin",
    title: "System Administrator",
    badgeLabel: "Tier 5 • Super Admin",
    badgeClass: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    bgLight: "bg-purple-50/30 dark:bg-purple-950/10",
    borderClass: "border-purple-300 dark:border-purple-800",
    persona: "IT & System Administrators, Operations Leaders",
    description:
      "Highest authority level with unrestricted access across all operational modules, salary engine configurations, user credentials, and security settings.",
    responsibilities: [
      "User provisioning and role assignment",
      "Organization company profile and global configuration",
      "All HR and Payroll management rights",
      "Database schema synchronization and system auditing",
    ],
  },
  {
    key: "payroll_manager",
    title: "Payroll Manager",
    badgeLabel: "Tier 4 • Management",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    bgLight: "bg-emerald-50/30 dark:bg-emerald-950/10",
    borderClass: "border-emerald-300 dark:border-emerald-800",
    persona: "Head of Payroll, Senior Finance Officers",
    description:
      "Authority over financial computations, salary rule drafting, batch payrun execution, validation, disbursement, and department cost reporting.",
    responsibilities: [
      "Create, configure, and approve Salary Structures & Rules",
      "Compute and validate monthly employee payruns",
      "Mark payruns as paid and dispatch payslips",
      "Access department cost and payroll analytics",
    ],
  },
  {
    key: "payroll_user",
    title: "Payroll Officer",
    badgeLabel: "Tier 3 • Operational",
    badgeClass: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
    bgLight: "bg-cyan-50/30 dark:bg-cyan-950/10",
    borderClass: "border-cyan-300 dark:border-cyan-800",
    persona: "Payroll Specialists, Financial Associates",
    description:
      "Operational processing of recurring payroll batches, payslip generation, and viewing workforce contract conditions.",
    responsibilities: [
      "Execute salary computation passes",
      "Review employee attendance and contract rates",
      "Print and deliver approved payslips",
      "Read-only access to organizational salary structures",
    ],
  },
  {
    key: "hr_manager",
    title: "HR Manager",
    badgeLabel: "Tier 2 • People Ops",
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    bgLight: "bg-blue-50/30 dark:bg-blue-950/10",
    borderClass: "border-blue-300 dark:border-blue-800",
    persona: "HR Directors, People Operations Specialists",
    description:
      "Full ownership of the employee lifecycle: onboarding, contract generation, department hierarchy, attendance monitoring, and time-off request approvals.",
    responsibilities: [
      "Manage employee profiles and personnel records",
      "Create and assign employment contracts",
      "Approve or refuse employee time-off and leave requests",
      "Oversee working shifts, schedule exceptions, and departments",
    ],
  },
  {
    key: "employee",
    title: "Employee (Self-Service)",
    badgeLabel: "Tier 1 • Self-Service",
    badgeClass: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800",
    bgLight: "bg-slate-50/30 dark:bg-slate-900/10",
    borderClass: "border-slate-300 dark:border-slate-700",
    persona: "All general staff, contractors, and team members",
    description:
      "Self-service portal access strictly isolated to their own records: digital attendance punch clock, leave requests, and personal payslips.",
    responsibilities: [
      "Check in and check out for attendance tracking",
      "Submit personal time-off requests and track balance",
      "View and download monthly PDF payslips",
      "Review personal employment contract information",
    ],
  },
];

// Human-friendly module categorization
const MODULE_GROUPS: Array<{
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  resources: ResourceName[];
}> = [
  {
    id: "workforce",
    name: "Workforce & Organization",
    icon: Building2Icon,
    resources: ["employee", "department", "jobPosition", "contract"],
  },
  {
    id: "time_attendance",
    name: "Time, Shifts & Leave",
    icon: CalendarDaysIcon,
    resources: ["attendance", "workingSchedule", "timeOffRequest", "timeOffAllocation", "timeOffType"],
  },
  {
    id: "payroll_finance",
    name: "Payroll & Compensation Engine",
    icon: WalletCardsIcon,
    resources: ["salaryStructure", "salaryRule", "payrun", "payslip"],
  },
  {
    id: "analytics_admin",
    name: "Governance, Analytics & Admin",
    icon: SlidersIcon,
    resources: ["dashboard", "report", "organization", "administration"],
  },
];

export default function AdminRolesPage() {
  const { role: currentUserRole } = useCan();
  const isAdmin = currentUserRole === "admin";

  const [activeTab, setActiveTab] = React.useState<"matrix" | "inspector" | "spec">("matrix");
  const [selectedRoleKey, setSelectedRoleKey] = React.useState<AppRole>("admin");
  const [moduleFilter, setModuleFilter] = React.useState<string>("all");
  const [actionSearch, setActionSearch] = React.useState<string>("");

  // Query stats to display real user counts per role
  const { data: statsResponse } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const roleDistribution = statsResponse?.data?.roleDistribution || {};

  // Compute total actions count across the system
  const allActionsCount = React.useMemo(() => {
    let count = 0;
    for (const resKey of Object.keys(statement) as ResourceName[]) {
      count += statement[resKey].length;
    }
    return count;
  }, []);

  // Compute allowed actions count for a specific role
  const getRoleAllowedCount = (role: AppRole) => {
    let count = 0;
    for (const resKey of Object.keys(statement) as ResourceName[]) {
      for (const act of statement[resKey]) {
        if (hasPermission(role, resKey, act as any)) {
          count++;
        }
      }
    }
    return count;
  };

  const selectedRoleDef = ROLES_LIST.find((r) => r.key === selectedRoleKey) || ROLES_LIST[0];

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="size-16 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
          <LockIcon className="size-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Access Restricted</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          Administration pages require the <span className="font-semibold text-foreground">admin</span> role. Your current active role is <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{currentUserRole}</code>.
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
            <Link
              href="/admin"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin
            </Link>
            <span className="text-xs text-muted-foreground">/</span>
            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200">
              <ShieldCheckIcon className="size-3 mr-1" />
              Role-Based Access Control
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Central authorization matrix derived directly from the application security model (<code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">permissions.ts</code>).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/users"
            className={cn(buttonVariants({ size: "sm" }), "h-9 gap-1.5 shadow-sm")}
          >
            <UsersIcon className="size-3.5" />
            Manage User Roles
          </Link>
        </div>
      </div>

      {/* Role Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {ROLES_LIST.map((r) => {
          const userCount = roleDistribution[r.key] || 0;
          const allowedCount = getRoleAllowedCount(r.key);
          const isSelected = selectedRoleKey === r.key;

          return (
            <div
              key={r.key}
              onClick={() => {
                setSelectedRoleKey(r.key);
                setActiveTab("inspector");
              }}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? `${r.borderClass} ${r.bgLight} ring-2 ring-primary/20 shadow-xs`
                  : "border-border hover:border-border/80 hover:bg-muted/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <Badge variant="outline" className={`text-[10px] font-mono ${r.badgeClass}`}>
                  {r.key}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{userCount}</span> user{userCount === 1 ? "" : "s"}
                </span>
              </div>

              <div className="font-semibold text-sm mt-2 text-foreground">{r.title}</div>

              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Coverage:</span>
                <span className="font-medium text-foreground">
                  {allowedCount} / {allActionsCount} ({Math.round((allowedCount / allActionsCount) * 100)}%)
                </span>
              </div>

              <div className="h-1.5 w-full rounded-full bg-muted mt-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    r.key === "admin"
                      ? "bg-purple-600"
                      : r.key === "payroll_manager"
                      ? "bg-emerald-600"
                      : r.key === "payroll_user"
                      ? "bg-cyan-600"
                      : r.key === "hr_manager"
                      ? "bg-blue-600"
                      : "bg-slate-500"
                  }`}
                  style={{ width: `${(allowedCount / allActionsCount) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b pb-px">
        <button
          onClick={() => setActiveTab("matrix")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "matrix"
              ? "border-primary text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <LayersIcon className="size-4" />
          Full Permission Matrix
        </button>

        <button
          onClick={() => setActiveTab("inspector")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "inspector"
              ? "border-primary text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserRoundIcon className="size-4" />
          Role Deep-Dive ({selectedRoleDef.title})
        </button>

        <button
          onClick={() => setActiveTab("spec")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "spec"
              ? "border-primary text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Code2Icon className="size-4" />
          Enforcement Architecture
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FULL PERMISSION MATRIX                                             */}
      {/* ========================================================================= */}
      {activeTab === "matrix" && (
        <div className="space-y-4">
          {/* Matrix Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search action or resource name..."
                value={actionSearch}
                onChange={(e) => setActionSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Module Group:</span>
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Modules</option>
                {MODULE_GROUPS.map((mg) => (
                  <option key={mg.id} value={mg.id}>
                    {mg.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Matrix Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-lg border">
            <span className="font-semibold text-foreground">Legend:</span>
            <span className="flex items-center gap-1">
              <span className="size-4 rounded bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <CheckIcon className="size-3" />
              </span>
              Full Action Access
            </span>
            <span className="flex items-center gap-1">
              <span className="size-4 rounded bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                👤
              </span>
              Self-Only Access (Own records)
            </span>
            <span className="flex items-center gap-1">
              <span className="size-4 rounded bg-muted text-muted-foreground flex items-center justify-center">
                <MinusIcon className="size-3" />
              </span>
              No Access (Restricted)
            </span>
          </div>

          {/* Table */}
          <Card className="shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-[180px]">Resource / Module</TableHead>
                    <TableHead className="w-[180px]">Action Statement</TableHead>
                    <TableHead className="w-[110px] text-center">Employee</TableHead>
                    <TableHead className="w-[110px] text-center">HR Mgr</TableHead>
                    <TableHead className="w-[110px] text-center">Payroll Usr</TableHead>
                    <TableHead className="w-[110px] text-center">Payroll Mgr</TableHead>
                    <TableHead className="w-[110px] text-center">Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MODULE_GROUPS.filter((mg) => moduleFilter === "all" || mg.id === moduleFilter).map(
                    (group) => {
                      const Icon = group.icon;
                      return (
                        <React.Fragment key={group.id}>
                          {/* Module Header Row */}
                          <TableRow className="bg-muted/60 hover:bg-muted/60 font-semibold text-xs text-foreground">
                            <TableCell colSpan={7} className="py-2.5">
                              <div className="flex items-center gap-2">
                                <Icon className="size-4 text-primary" />
                                <span>{group.name}</span>
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Resources & Actions inside group */}
                          {group.resources.map((resKey) => {
                            const actions = statement[resKey] || [];
                            const filteredActions = actions.filter(
                              (act) =>
                                !actionSearch ||
                                act.toLowerCase().includes(actionSearch.toLowerCase()) ||
                                resKey.toLowerCase().includes(actionSearch.toLowerCase())
                            );

                            if (filteredActions.length === 0) return null;

                            return filteredActions.map((actionName, actionIdx) => {
                              const isSelfOnly = actionName.includes("self");

                              return (
                                <TableRow
                                  key={`${resKey}-${actionName}`}
                                  className="hover:bg-muted/20 transition-colors"
                                >
                                  {/* Resource name shown on first action */}
                                  <TableCell className="text-xs font-mono text-foreground/80 py-2">
                                    {actionIdx === 0 ? (
                                      <span className="font-semibold text-foreground">
                                        {resKey}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground pl-2">↳</span>
                                    )}
                                  </TableCell>

                                  {/* Action name */}
                                  <TableCell className="text-xs py-2">
                                    <span
                                      className={`font-mono px-1.5 py-0.5 rounded text-[11px] ${
                                        isSelfOnly
                                          ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 font-medium"
                                          : "bg-muted text-foreground"
                                      }`}
                                    >
                                      {actionName}
                                    </span>
                                  </TableCell>

                                  {/* Role checks */}
                                  {(["employee", "hr_manager", "payroll_user", "payroll_manager", "admin"] as AppRole[]).map(
                                    (roleKey) => {
                                      const allowed = hasPermission(roleKey, resKey, actionName as any);

                                      return (
                                        <TableCell key={roleKey} className="text-center py-2">
                                          {allowed ? (
                                            isSelfOnly ? (
                                              <span
                                                title="Self records only"
                                                className="inline-flex size-5 rounded items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold"
                                              >
                                                👤
                                              </span>
                                            ) : (
                                              <span
                                                title="Granted"
                                                className="inline-flex size-5 rounded items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                                              >
                                                <CheckIcon className="size-3.5" />
                                              </span>
                                            )
                                          ) : (
                                            <span
                                              title="Restricted"
                                              className="inline-flex size-5 rounded items-center justify-center text-muted-foreground/40"
                                            >
                                              <MinusIcon className="size-3.5" />
                                            </span>
                                          )}
                                        </TableCell>
                                      );
                                    }
                                  )}
                                </TableRow>
                              );
                            });
                          })}
                        </React.Fragment>
                      );
                    }
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ROLE DEEP DIVE INSPECTOR                                           */}
      {/* ========================================================================= */}
      {activeTab === "inspector" && (
        <div className="space-y-6">
          <Card className={`shadow-xs ${selectedRoleDef.borderClass} ${selectedRoleDef.bgLight}`}>
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`font-mono text-xs ${selectedRoleDef.badgeClass}`}>
                      {selectedRoleDef.badgeLabel}
                    </Badge>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs font-mono text-muted-foreground">key: {selectedRoleDef.key}</span>
                  </div>
                  <CardTitle className="text-2xl font-bold">{selectedRoleDef.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {selectedRoleDef.description}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/users?role=${selectedRoleDef.key}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
                  >
                    <UsersIcon className="size-3.5" />
                    View Assigned Users ({roleDistribution[selectedRoleDef.key] || 0})
                  </Link>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Responsibilities & Target Persona */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-lg bg-background border shadow-xs space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Target Persona & Teams
                  </div>
                  <p className="text-sm font-medium text-foreground">{selectedRoleDef.persona}</p>
                </div>

                <div className="p-4 rounded-lg bg-background border shadow-xs space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Primary Operational Duties
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    {selectedRoleDef.responsibilities.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Module-by-Module Granted Capabilities */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <LayersIcon className="size-4 text-primary" />
                  Granted Statements by Resource
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(Object.keys(statement) as ResourceName[]).map((resKey) => {
                    const allActs = statement[resKey];
                    const grantedActs = allActs.filter((act) =>
                      hasPermission(selectedRoleDef.key, resKey, act as any)
                    );

                    const isNone = grantedActs.length === 0;
                    const isAll = grantedActs.length === allActs.length;

                    return (
                      <div
                        key={resKey}
                        className={`p-3.5 rounded-lg border bg-background transition-colors ${
                          isNone ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {resKey}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {isAll ? (
                              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                                Full Access
                              </Badge>
                            ) : isNone ? (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                Restricted
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-300">
                                Partial ({grantedActs.length}/{allActs.length})
                              </Badge>
                            )}
                          </span>
                        </div>

                        {isNone ? (
                          <p className="text-xs text-muted-foreground italic">
                            No permissions granted on this resource.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {grantedActs.map((act) => (
                              <span
                                key={act}
                                className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                                  act.includes("self")
                                    ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900"
                                    : "bg-muted text-foreground border-border"
                                }`}
                              >
                                {act}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SPECIFICATION & ENFORCEMENT ARCHITECTURE                          */}
      {/* ========================================================================= */}
      {activeTab === "spec" && (
        <div className="space-y-6">
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileCode2Icon className="size-4 text-primary" />
                Three-Tier Enforcement Architecture
              </CardTitle>
              <CardDescription>
                How PeoplePay360 enforces permissions synchronously from database query to UI rendering.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Layer 1 */}
              <div className="p-4 rounded-lg border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm flex items-center gap-2">
                    <span className="size-6 rounded bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                      1
                    </span>
                    Server-Side API Enforcement (`requirePermission`)
                  </span>
                  <Badge variant="outline">Backend Defense</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Every Route Handler invokes <code className="text-foreground font-semibold">requirePermission(resource, action, request.headers)</code>. If unauthorized, an immediate HTTP 403 Forbidden is thrown with zero database leakage.
                </p>
                <pre className="p-3 rounded-md bg-zinc-950 text-zinc-100 text-xs font-mono overflow-x-auto">
{`// src/app/api/payroll/payruns/route.ts
export async function POST(request: NextRequest) {
  // Requires "payrun:create" permission
  await requirePermission("payrun", "create", request.headers);
  
  // Safe to proceed with database mutations...
}`}
                </pre>
              </div>

              {/* Layer 2 */}
              <div className="p-4 rounded-lg border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm flex items-center gap-2">
                    <span className="size-6 rounded bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                      2
                    </span>
                    Next.js Edge & Route Protection (`canAccessRoute`)
                  </span>
                  <Badge variant="outline">Navigation Layer</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  The sidebar and navigation router check <code className="text-foreground font-semibold">canAccessRoute(pathname, role)</code> to prune navigation menus and redirect unauthorized attempts before page renders.
                </p>
                <pre className="p-3 rounded-md bg-zinc-950 text-zinc-100 text-xs font-mono overflow-x-auto">
{`// src/lib/auth/route-permissions.ts
export const routeRules = [
  { path: "/admin", roles: ["admin"] },
  { path: "/payroll", roles: ["payroll_user", "payroll_manager", "admin"] },
  { path: "/employees", roles: ["hr_manager", "payroll_user", "payroll_manager", "admin"] },
  { path: "/payroll/payslips/me", roles: ["employee", "hr_manager", "payroll_user", "payroll_manager", "admin"] },
];`}
                </pre>
              </div>

              {/* Layer 3 */}
              <div className="p-4 rounded-lg border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm flex items-center gap-2">
                    <span className="size-6 rounded bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                      3
                    </span>
                    Client Component Authorization Hooks (`useCan`)
                  </span>
                  <Badge variant="outline">Reactive UI Layer</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Buttons, modals, and actions utilize <code className="text-foreground font-semibold">useCan()</code> to conditionally disable or omit sensitive operations (such as approving leave or modifying salary structures).
                </p>
                <pre className="p-3 rounded-md bg-zinc-950 text-zinc-100 text-xs font-mono overflow-x-auto">
{`const { can, role } = useCan();

{can("payrun", "validate") && (
  <Button onClick={handleValidatePayrun}>
    Validate & Lock Payrun
  </Button>
)}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
