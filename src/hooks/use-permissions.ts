"use client";

import { authClient } from "@/lib/auth-client";
import {
  hasPermission,
  normalizeRole,
  type AppRole,
  type ResourceName,
  type ActionName,
} from "@/lib/auth/permissions";

export function useCan() {
  const { data: session, isPending } = authClient.useSession();
  const rawRole = (session?.user as { role?: string })?.role;
  const role: AppRole = normalizeRole(rawRole);

  const can = <R extends ResourceName>(resource: R, action: ActionName<R>): boolean => {
    return hasPermission(role, resource, action);
  };

  return {
    session,
    role,
    isPending,
    can,
    isAdmin: role === "admin",
    isHR: role === "hr_manager" || role === "admin",
    isPayrollManager: role === "payroll_manager" || role === "admin",
    isPayroll: role === "payroll_user" || role === "payroll_manager" || role === "admin",
    isEmployee: role === "employee",
  };
}

export function useHasPermission<R extends ResourceName>(resource: R, action: ActionName<R>): boolean {
  const { can } = useCan();
  return can(resource, action);
}
