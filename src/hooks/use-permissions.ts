"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  hasPermission,
  normalizeRole,
  type AppRole,
  type ResourceName,
  type ActionName,
} from "@/lib/auth/permissions";

const ROLE_STORAGE_KEY = "odoo_user_role";

function getStoredRole(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ROLE_STORAGE_KEY) || sessionStorage.getItem(ROLE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function useCan() {
  const { data: session, isPending } = authClient.useSession();
  const rawRole = (session?.user as { role?: string })?.role;
  const [cachedRole, setCachedRole] = useState<string | null>(null);

  useEffect(() => {
    // Read from storage only after initial mount/hydration to avoid hydration mismatch
    const stored = getStoredRole();
    if (stored) {
      setCachedRole(stored);
    }
  }, []);

  useEffect(() => {
    if (rawRole) {
      setCachedRole(rawRole);
      try {
        localStorage.setItem(ROLE_STORAGE_KEY, rawRole);
        sessionStorage.setItem(ROLE_STORAGE_KEY, rawRole);
      } catch {}
    }
  }, [rawRole]);

  // Fallback to cached role while session is loading to prevent layout shifts & sidebar flicker
  const effectiveRole = rawRole || cachedRole;
  const role: AppRole = normalizeRole(effectiveRole);

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
