import { type AppRole, normalizeRole } from "./permissions";

export type RouteRule = {
  path: string;
  roles: AppRole[];
};

export const routeRules: RouteRule[] = [
  // Admin module
  {
    path: "/admin",
    roles: ["admin"],
  },

  // Organization configuration (Admin only)
  {
    path: "/settings/organization",
    roles: ["admin"],
  },

  // General Settings / Configuration (HR & Payroll configuration)
  {
    path: "/settings/salary-structures",
    roles: ["payroll_user", "payroll_manager", "admin"],
  },
  {
    path: "/settings/salary-rules",
    roles: ["payroll_user", "payroll_manager", "admin"],
  },
  {
    path: "/settings",
    roles: ["hr_manager", "payroll_user", "payroll_manager", "admin"],
  },

  // Payroll module (Specific before general)
  {
    path: "/payroll/payslips/me",
    roles: ["employee", "hr_manager", "payroll_user", "payroll_manager", "admin"],
  },
  {
    path: "/payroll/payruns",
    roles: ["payroll_user", "payroll_manager", "admin"],
  },
  {
    path: "/payroll/payslips",
    roles: ["payroll_user", "payroll_manager", "admin"],
  },
  {
    path: "/payroll/salary-structures",
    roles: ["payroll_user", "payroll_manager", "admin"],
  },
  {
    path: "/payroll/salary-rules",
    roles: ["payroll_user", "payroll_manager", "admin"],
  },
  {
    path: "/payroll",
    roles: ["payroll_user", "payroll_manager", "admin"],
  },

  // Employees module
  {
    path: "/employees/departments",
    roles: ["hr_manager", "payroll_user", "payroll_manager", "admin"],
  },
  {
    path: "/employees/job-positions",
    roles: ["hr_manager", "payroll_user", "payroll_manager", "admin"],
  },
  {
    path: "/employees",
    roles: ["hr_manager", "payroll_user", "payroll_manager", "admin"],
  },

  // Contracts module
  {
    path: "/contracts/groups",
    roles: ["hr_manager", "payroll_user", "payroll_manager", "admin"],
  },
  {
    path: "/contracts/expiring",
    roles: ["hr_manager", "payroll_user", "payroll_manager", "admin"],
  },
  {
    path: "/contracts/active",
    roles: ["hr_manager", "payroll_user", "payroll_manager", "admin"],
  },
  {
    path: "/contracts",
    roles: ["hr_manager", "payroll_user", "payroll_manager", "admin"],
  },

  // Attendance module (Self before general)
  {
    path: "/attendance/me",
    roles: ["employee", "hr_manager", "payroll_user", "payroll_manager", "admin"],
  },
  {
    path: "/attendance/schedules",
    roles: ["hr_manager", "payroll_user", "payroll_manager", "admin"],
  },
  {
    path: "/attendance/exceptions",
    roles: ["hr_manager", "payroll_user", "payroll_manager", "admin"],
  },
  {
    path: "/attendance",
    roles: ["hr_manager", "payroll_user", "payroll_manager", "admin"],
  },

  // Time Off module (Self before general)
  {
    path: "/time-off/me",
    roles: ["employee", "hr_manager", "payroll_user", "payroll_manager", "admin"],
  },
  {
    path: "/time-off/requests",
    roles: ["hr_manager", "payroll_user", "payroll_manager", "admin"],
  },
  {
    path: "/time-off/allocations",
    roles: ["hr_manager", "payroll_user", "payroll_manager", "admin"],
  },
  {
    path: "/time-off/types",
    roles: ["hr_manager", "payroll_user", "payroll_manager", "admin"],
  },
  {
    path: "/time-off",
    roles: ["employee", "hr_manager", "payroll_user", "payroll_manager", "admin"],
  },

  // Reports
  {
    path: "/reports/payroll",
    roles: ["payroll_user", "payroll_manager", "admin"],
  },
  {
    path: "/reports",
    roles: ["hr_manager", "payroll_user", "payroll_manager", "admin"],
  },

  // Dashboard (Specific before general)
  {
    path: "/dashboard/analytics",
    roles: ["hr_manager", "payroll_user", "payroll_manager", "admin"],
  },
  {
    path: "/dashboard/reports",
    roles: ["hr_manager", "payroll_user", "payroll_manager", "admin"],
  },
  {
    path: "/dashboard",
    roles: ["employee", "hr_manager", "payroll_user", "payroll_manager", "admin"],
  },
];

/**
 * Validates whether a user with the given role has access to a pathname.
 * Uses prefix matching against the ordered routeRules.
 */
export function canAccessRoute(pathname: string, rawRole?: string | null): boolean {
  const role = normalizeRole(rawRole);
  
  // Find matching rule (ordered from most specific to general)
  const rule = routeRules.find(
    ({ path }) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!rule) {
    // If route isn't guarded by routeRules, return true (public or unmatched internal)
    return true;
  }

  return rule.roles.includes(role);
}

/**
 * Returns whether a route is restricted to specific roles.
 */
export function isGuardedRoute(pathname: string): boolean {
  return routeRules.some(
    ({ path }) => pathname === path || pathname.startsWith(`${path}/`)
  );
}
