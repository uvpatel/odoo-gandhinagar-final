"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCan } from "@/hooks/use-permissions";
import { useSession } from "@/lib/auth/auth-client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UsersIcon,
  SearchIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  Building2Icon,
  BriefcaseBusinessIcon,
  KeyRoundIcon,
  Link2Icon,
  Unlink2Icon,
  BanIcon,
  CheckCircleIcon,
  Trash2Icon,
  EyeIcon,
  MoreVerticalIcon,
  XIcon,
  RefreshCwIcon,
  FilterIcon,
  LockIcon,
  AlertTriangleIcon,
  CheckIcon,
  CopyIcon,
  InfoIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AppRole } from "@/lib/auth/permissions";

interface LinkedEmployee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  workEmail: string | null;
  departmentName: string | null;
  jobTitle: string | null;
  status: string;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: AppRole;
  banned: boolean;
  banReason: string | null;
  banExpires: string | null;
  createdAt: string;
  updatedAt: string;
  employee: LinkedEmployee | null;
}

interface UnlinkedEmployee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  workEmail: string | null;
  departmentName: string | null;
  jobTitle: string | null;
}

const ROLE_OPTIONS: Array<{ value: AppRole; label: string; desc: string; color: string }> = [
  {
    value: "admin",
    label: "Administrator",
    desc: "Full system administration, user provisioning, security, and global permissions",
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
  {
    value: "hr_manager",
    label: "HR Manager",
    desc: "Employee lifecycle, contracts, time-off approvals, departments, and attendance",
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  {
    value: "payroll_manager",
    label: "Payroll Manager",
    desc: "Payroll computation, payslip validation, salary structures, rules, and payment",
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  {
    value: "payroll_user",
    label: "Payroll Officer",
    desc: "Payroll processing, salary computation, contracts, and attendance reviews",
    color: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
  },
  {
    value: "employee",
    label: "Employee",
    desc: "Self-service portal: own profile, attendance check-in/out, time-off, and payslips",
    color: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800",
  },
];

function AdminUsersContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const initialRole = searchParams.get("role") || "all";
  const initialStatus = searchParams.get("status") || "all";

  // Filter states
  const [searchTerm, setSearchTerm] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState(initialRole);
  const [statusFilter, setStatusFilter] = React.useState(initialStatus);

  // Modal dialog states
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = React.useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = React.useState(false);
  const [isBanModalOpen, setIsBanModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);

  // Active user for actions
  const [selectedUser, setSelectedUser] = React.useState<UserItem | null>(null);

  // Form states
  const [createForm, setCreateForm] = React.useState({
    name: "",
    email: "",
    role: "employee" as AppRole,
    password: "Password123!",
    employeeId: "",
  });

  const [editRole, setEditRole] = React.useState<AppRole>("employee");
  const [selectedEmployeeToLink, setSelectedEmployeeToLink] = React.useState<string>("");
  const [banReason, setBanReason] = React.useState("");

  // Query users
  const {
    data: queryData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<{ data: { users: UserItem[]; unlinkedEmployees: UnlinkedEmployee[] } }>({
    queryKey: ["admin-users", { q: searchTerm, role: roleFilter, status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set("q", searchTerm);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch users");
      }
      return res.json();
    },
  });

  const users = queryData?.data?.users || [];
  const unlinkedEmployees = queryData?.data?.unlinkedEmployees || [];

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (payload: typeof createForm) => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success(data.message || "User created successfully!");
      setIsCreateModalOpen(false);
      setCreateForm({
        name: "",
        email: "",
        role: "employee",
        password: "Password123!",
        employeeId: "",
      });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create user");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (payload: {
      userId: string;
      role?: AppRole;
      banned?: boolean;
      banReason?: string;
      employeeId?: string | null;
    }) => {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success(data.message || "User updated successfully!");
      setIsRoleModalOpen(false);
      setIsLinkModalOpen(false);
      setIsBanModalOpen(false);
      if (selectedUser && isDetailModalOpen) {
        // refresh detail modal if open
        setSelectedUser(null);
        setIsDetailModalOpen(false);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update user");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success(data.message || "User deleted successfully!");
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete user");
    },
  });

  // Action handlers
  const handleOpenRoleModal = (user: UserItem) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setIsRoleModalOpen(true);
  };

  const handleOpenLinkModal = (user: UserItem) => {
    setSelectedUser(user);
    setSelectedEmployeeToLink(user.employee?.id || "");
    setIsLinkModalOpen(true);
  };

  const handleOpenBanModal = (user: UserItem) => {
    setSelectedUser(user);
    setBanReason(user.banReason || "");
    setIsBanModalOpen(true);
  };

  const handleOpenDeleteModal = (user: UserItem) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleOpenDetailModal = (user: UserItem) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const handleToggleBan = (user: UserItem) => {
    if (user.banned) {
      // Unban directly
      updateUserMutation.mutate({
        userId: user.id,
        banned: false,
      });
    } else {
      handleOpenBanModal(user);
    }
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateForm((prev) => ({ ...prev, password: pass }));
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
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
            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200">
              User Management
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">User Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Provision logins, assign authorization roles, link employee profiles, and manage access states.
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

          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-9 gap-1.5 shadow-sm"
          >
            <UserPlusIcon className="size-3.5" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or employee #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FilterIcon className="size-3.5" />
            <span>Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="hr_manager">HR Manager</option>
              <option value="payroll_manager">Payroll Manager</option>
              <option value="payroll_user">Payroll Officer</option>
              <option value="employee">Employee</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Accounts</option>
              <option value="active">Active Only</option>
              <option value="banned">Suspended / Banned</option>
              <option value="linked">Linked to Employee</option>
              <option value="unlinked">Unlinked Accounts</option>
            </select>
          </div>

          {(searchTerm || roleFilter !== "all" || statusFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("all");
                setStatusFilter("all");
              }}
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Main Users Table Card */}
      <Card className="shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[280px]">User</TableHead>
                <TableHead className="w-[200px]">Linked Employee</TableHead>
                <TableHead className="w-[160px]">System Role</TableHead>
                <TableHead className="w-[110px]">Status</TableHead>
                <TableHead className="w-[130px]">Joined Date</TableHead>
                <TableHead className="w-[160px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-muted" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-28 bg-muted rounded" />
                          <div className="h-2.5 w-36 bg-muted rounded" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><div className="h-4 w-24 bg-muted rounded" /></TableCell>
                    <TableCell><div className="h-5 w-20 bg-muted rounded" /></TableCell>
                    <TableCell><div className="h-4 w-16 bg-muted rounded" /></TableCell>
                    <TableCell><div className="h-4 w-20 bg-muted rounded" /></TableCell>
                    <TableCell className="text-right"><div className="h-7 w-20 bg-muted rounded ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-red-600 dark:text-red-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertTriangleIcon className="size-6" />
                      <p className="text-sm font-medium">Failed to load user accounts.</p>
                      <p className="text-xs text-muted-foreground">{(error as Error)?.message}</p>
                      <Button size="xs" variant="outline" onClick={() => refetch()}>
                        Retry
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                        <UsersIcon className="size-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">No users found</p>
                      <p className="text-xs">
                        {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                          ? "Try adjusting your search query or role filters."
                          : "Create your first user account to get started."}
                      </p>
                      {searchTerm || roleFilter !== "all" || statusFilter !== "all" ? (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setSearchTerm("");
                            setRoleFilter("all");
                            setStatusFilter("all");
                          }}
                        >
                          Clear Filters
                        </Button>
                      ) : (
                        <Button
                          size="xs"
                          onClick={() => setIsCreateModalOpen(true)}
                          className="mt-1"
                        >
                          Add User
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const roleMeta = ROLE_OPTIONS.find((r) => r.value === user.role) || ROLE_OPTIONS[4];
                  const isCurrentSessionUser = user.id === currentUserId;
                  const dateStr = user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—";

                  return (
                    <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                      {/* User Details */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 border">
                            <AvatarImage src={user.image || undefined} alt={user.name} />
                            <AvatarFallback className="text-xs font-semibold uppercase">
                              {user.name ? user.name.slice(0, 2) : "US"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-sm text-foreground truncate">
                                {user.name}
                              </span>
                              {isCurrentSessionUser && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono text-primary">
                                  You
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground truncate block">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Linked Employee */}
                      <TableCell>
                        {user.employee ? (
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1 text-xs font-medium text-foreground">
                              <Building2Icon className="size-3 text-muted-foreground shrink-0" />
                              <span className="truncate">{user.employee.fullName}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              <span className="font-mono">{user.employee.employeeNumber}</span>
                              {user.employee.departmentName && ` • ${user.employee.departmentName}`}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className="text-[10px] border-amber-300 text-amber-700 dark:text-amber-400 bg-amber-50/30"
                            >
                              Not Linked
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              title="Link to Employee"
                              onClick={() => handleOpenLinkModal(user)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Link2Icon className="size-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>

                      {/* Role Badge */}
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${roleMeta.color}`}
                        >
                          {roleMeta.label}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {user.banned ? (
                          <Badge variant="destructive" className="text-[11px] gap-1 font-medium">
                            <BanIcon className="size-3" />
                            Suspended
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[11px] gap-1 font-medium border-emerald-300 text-emerald-700 dark:text-emerald-400 bg-emerald-50/20"
                          >
                            <CheckCircleIcon className="size-3" />
                            Active
                          </Badge>
                        )}
                      </TableCell>

                      {/* Joined Date */}
                      <TableCell className="text-xs text-muted-foreground">
                        {dateStr}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Details */}
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            title="View User Details"
                            onClick={() => handleOpenDetailModal(user)}
                          >
                            <EyeIcon className="size-3.5 text-muted-foreground hover:text-foreground" />
                          </Button>

                          {/* Role Edit */}
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            title="Change Role"
                            onClick={() => handleOpenRoleModal(user)}
                          >
                            <KeyRoundIcon className="size-3.5 text-purple-600 hover:text-purple-700" />
                          </Button>

                          {/* Link / Unlink Employee */}
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            title={user.employee ? "Manage Employee Link" : "Link Employee Profile"}
                            onClick={() => handleOpenLinkModal(user)}
                          >
                            <Link2Icon className="size-3.5 text-blue-600 hover:text-blue-700" />
                          </Button>

                          {/* Ban / Unban */}
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            disabled={isCurrentSessionUser}
                            title={
                              isCurrentSessionUser
                                ? "Cannot ban yourself"
                                : user.banned
                                ? "Activate Account"
                                : "Suspend Account"
                            }
                            onClick={() => handleToggleBan(user)}
                            className={user.banned ? "text-emerald-600" : "text-amber-600"}
                          >
                            {user.banned ? <CheckIcon className="size-3.5" /> : <BanIcon className="size-3.5" />}
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            disabled={isCurrentSessionUser}
                            title={isCurrentSessionUser ? "Cannot delete yourself" : "Delete User"}
                            onClick={() => handleOpenDeleteModal(user)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-t text-xs text-muted-foreground">
          <span>Showing {users.length} user account{users.length === 1 ? "" : "s"}</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheckIcon className="size-3.5 text-emerald-500" />
            Argon2/Scrypt Secured Credentials
          </span>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 1. CREATE USER MODAL                                                      */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <UserPlusIcon className="size-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Provision New User</h2>
                  <p className="text-xs text-muted-foreground">
                    Creates database login credentials and optionally links an employee.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsCreateModalOpen(false)}
              >
                <XIcon className="size-4" />
              </Button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createUserMutation.mutate(createForm);
              }}
              className="mt-4 space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="newUserName">Full Name *</Label>
                <Input
                  id="newUserName"
                  required
                  placeholder="e.g. Jordan Miller"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newUserEmail">Work Email Address *</Label>
                <Input
                  id="newUserEmail"
                  type="email"
                  required
                  placeholder="jordan.miller@peoplepay360.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newUserRole">Organizational Role *</Label>
                <select
                  id="newUserRole"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as AppRole })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — {opt.desc.slice(0, 60)}...
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="newUserPassword">Initial Password *</Label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-xs text-primary hover:underline"
                  >
                    Generate Random
                  </button>
                </div>
                <Input
                  id="newUserPassword"
                  type="text"
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                />
                <p className="text-[11px] text-muted-foreground">
                  Minimum 8 characters. The user can change this after signing in.
                </p>
              </div>

              {/* Link Employee Profile */}
              <div className="space-y-1.5 pt-1 border-t">
                <Label htmlFor="newUserEmployee">Link to Employee Record (Optional)</Label>
                <select
                  id="newUserEmployee"
                  value={createForm.employeeId}
                  onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Do not link an employee right now</option>
                  {unlinkedEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeNumber}) {emp.departmentName ? `• ${emp.departmentName}` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  {unlinkedEmployees.length} employee record{unlinkedEmployees.length === 1 ? "" : "s"} currently unlinked.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EDIT ROLE MODAL                                                        */}
      {/* ========================================================================= */}
      {isRoleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <KeyRoundIcon className="size-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Change User Role</h2>
                  <p className="text-xs text-muted-foreground">{selectedUser.name} ({selectedUser.email})</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsRoleModalOpen(false)}
              >
                <XIcon className="size-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Select Role Assignment</Label>
                <div className="space-y-2">
                  {ROLE_OPTIONS.map((opt) => {
                    const isSelected = editRole === opt.value;
                    return (
                      <div
                        key={opt.value}
                        onClick={() => setEditRole(opt.value)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start justify-between ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-xs"
                            : "border-border hover:border-border/80 hover:bg-muted/30"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{opt.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${opt.color}`}>
                              {opt.value}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{opt.desc}</p>
                        </div>
                        {isSelected && (
                          <div className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-0.5">
                            <CheckIcon className="size-3" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedUser.id === currentUserId && editRole !== "admin" && (
                <div className="p-3 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/20 text-xs text-red-700 dark:text-red-400">
                  Warning: You cannot remove your own administrator access.
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRoleModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  disabled={
                    updateUserMutation.isPending ||
                    (selectedUser.id === currentUserId && editRole !== "admin")
                  }
                  onClick={() => {
                    updateUserMutation.mutate({
                      userId: selectedUser.id,
                      role: editRole,
                    });
                  }}
                >
                  {updateUserMutation.isPending ? "Updating..." : "Save Role"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. LINK / UNLINK EMPLOYEE MODAL                                           */}
      {/* ========================================================================= */}
      {isLinkModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Link2Icon className="size-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Link Employee File</h2>
                  <p className="text-xs text-muted-foreground">{selectedUser.name}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsLinkModalOpen(false)}
              >
                <XIcon className="size-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Currently linked employee status */}
              {selectedUser.employee ? (
                <div className="p-3.5 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                      Currently Linked Employee:
                    </span>
                    <Button
                      size="xs"
                      variant="destructive"
                      onClick={() => {
                        updateUserMutation.mutate({
                          userId: selectedUser.id,
                          employeeId: null,
                        });
                      }}
                      disabled={updateUserMutation.isPending}
                      className="h-6 text-[11px] gap-1"
                    >
                      <Unlink2Icon className="size-3" />
                      Unlink
                    </Button>
                  </div>
                  <div className="text-sm font-medium">{selectedUser.employee.fullName}</div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>Employee #: <span className="font-mono">{selectedUser.employee.employeeNumber}</span></div>
                    {selectedUser.employee.departmentName && <div>Dept: {selectedUser.employee.departmentName}</div>}
                    {selectedUser.employee.jobTitle && <div>Title: {selectedUser.employee.jobTitle}</div>}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-dashed text-xs text-muted-foreground">
                  This user currently has no linked employee profile.
                </div>
              )}

              {/* Select a new employee to link */}
              <div className="space-y-1.5">
                <Label htmlFor="selectEmployee">Select Employee to Link</Label>
                <select
                  id="selectEmployee"
                  value={selectedEmployeeToLink}
                  onChange={(e) => setSelectedEmployeeToLink(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">-- Choose an unlinked employee --</option>
                  {unlinkedEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeNumber}) {emp.departmentName ? `• ${emp.departmentName}` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Associates the user ID with the employee's payroll and attendance profile.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsLinkModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  disabled={updateUserMutation.isPending || !selectedEmployeeToLink}
                  onClick={() => {
                    updateUserMutation.mutate({
                      userId: selectedUser.id,
                      employeeId: selectedEmployeeToLink,
                    });
                  }}
                >
                  {updateUserMutation.isPending ? "Linking..." : "Link Profile"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUSPEND / BAN USER MODAL                                               */}
      {/* ========================================================================= */}
      {isBanModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <BanIcon className="size-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Suspend User Account</h2>
                  <p className="text-xs text-muted-foreground">{selectedUser.name}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsBanModalOpen(false)}
              >
                <XIcon className="size-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                Suspending this user will immediately revoke all authentication sessions and prevent login to PeoplePay360.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="banReason">Reason for Suspension (Optional)</Label>
                <Input
                  id="banReason"
                  placeholder="e.g. Employee offboarding or security review"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBanModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={updateUserMutation.isPending}
                  onClick={() => {
                    updateUserMutation.mutate({
                      userId: selectedUser.id,
                      banned: true,
                      banReason: banReason.trim(),
                    });
                  }}
                >
                  {updateUserMutation.isPending ? "Suspending..." : "Confirm Suspension"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DELETE USER CONFIRMATION MODAL                                         */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center">
                  <Trash2Icon className="size-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Delete User Account</h2>
                  <p className="text-xs text-muted-foreground">{selectedUser.name}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                <XIcon className="size-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="p-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-xs text-red-700 dark:text-red-400 space-y-1">
                <p className="font-semibold">Warning: This action is permanent.</p>
                <p>
                  The user credentials and active sessions will be permanently removed. If this user is linked to an employee, the employee record will be preserved but detached.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={deleteUserMutation.isPending}
                  onClick={() => {
                    deleteUserMutation.mutate(selectedUser.id);
                  }}
                >
                  {deleteUserMutation.isPending ? "Deleting..." : "Permanently Delete"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. USER DETAILS MODAL                                                     */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="size-11 border">
                  <AvatarImage src={selectedUser.image || undefined} alt={selectedUser.name} />
                  <AvatarFallback className="font-semibold">
                    {selectedUser.name ? selectedUser.name.slice(0, 2).toUpperCase() : "US"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-bold">{selectedUser.name}</h2>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsDetailModalOpen(false)}
              >
                <XIcon className="size-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Core Account Details */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30 border">
                <div>
                  <span className="text-muted-foreground block text-[11px]">User ID</span>
                  <span className="font-mono text-foreground font-medium truncate block">
                    {selectedUser.id}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">System Role</span>
                  <Badge variant="outline" className="mt-0.5 capitalize">
                    {selectedUser.role.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Account Status</span>
                  {selectedUser.banned ? (
                    <Badge variant="destructive" className="mt-0.5 text-[10px]">
                      Suspended
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="mt-0.5 text-[10px] text-emerald-600 border-emerald-300">
                      Active
                    </Badge>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Registered Date</span>
                  <span className="text-foreground font-medium">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>

              {selectedUser.banned && selectedUser.banReason && (
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                  <span className="font-semibold text-amber-900 dark:text-amber-300 block mb-0.5">
                    Suspension Reason:
                  </span>
                  <p className="text-amber-800 dark:text-amber-400">{selectedUser.banReason}</p>
                </div>
              )}

              {/* Linked Employee Info */}
              <div className="space-y-2 border-t pt-3">
                <span className="font-semibold text-foreground text-sm block">
                  Workforce Profile Integration
                </span>
                {selectedUser.employee ? (
                  <div className="p-3 rounded-lg border bg-background space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{selectedUser.employee.fullName}</span>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {selectedUser.employee.employeeNumber}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                      <div>
                        <span>Department:</span>{" "}
                        <span className="text-foreground font-medium">
                          {selectedUser.employee.departmentName || "Unassigned"}
                        </span>
                      </div>
                      <div>
                        <span>Job Position:</span>{" "}
                        <span className="text-foreground font-medium">
                          {selectedUser.employee.jobTitle || "Unassigned"}
                        </span>
                      </div>
                      <div>
                        <span>Work Email:</span>{" "}
                        <span className="text-foreground font-medium">
                          {selectedUser.employee.workEmail || "None"}
                        </span>
                      </div>
                      <div>
                        <span>Employee Status:</span>{" "}
                        <span className="text-foreground font-medium capitalize">
                          {selectedUser.employee.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg border border-dashed text-center text-muted-foreground">
                    No employee record currently associated.
                  </div>
                )}
              </div>

              {/* Quick Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenRoleModal(selectedUser);
                    }}
                  >
                    Change Role
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenLinkModal(selectedUser);
                    }}
                  >
                    {selectedUser.employee ? "Manage Link" : "Link Employee"}
                  </Button>
                </div>

                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading user directory...</div>}>
      <AdminUsersContent />
    </Suspense>
  );
}
