import {
  LayoutDashboardIcon,
  UsersIcon,
  UserRoundIcon,
  FileTextIcon,
  CalendarClockIcon,
  Clock3Icon,
  CalendarDaysIcon,
  ClipboardListIcon,
  WalletCardsIcon,
  BanknoteIcon,
  ReceiptTextIcon,
  ChartNoAxesCombinedIcon,
  Building2Icon,
  BriefcaseBusinessIcon,
  Settings2Icon,
  ShieldCheckIcon,
  CalendarRangeIcon,
  TagsIcon,
  ListChecksIcon,
  GalleryVerticalEndIcon,
  AudioLinesIcon,
  TerminalIcon,
} from "lucide-react"
import {
  type AppRole,
  type ResourceName,
  normalizeRole,
  hasPermission,
} from "@/lib/auth/permissions"
import { canAccessRoute } from "@/lib/auth/route-permissions"

export type NavSubItem = {
  title: string
  url: string
  roles?: AppRole[]
  permission?: {
    resource: ResourceName
    action: string
  }
}

export type NavMainItem = {
  title: string
  url: string
  icon?: React.ReactNode
  isActive?: boolean
  roles?: AppRole[]
  items?: NavSubItem[]
}

export type NavData = {
  user: {
    name: string
    email: string
    avatar: string
  }
  teams: {
    name: string
    logo: React.ReactNode
    plan: string
  }[]
  navMain: NavMainItem[]
  projects: {
    name: string
    url: string
    icon: React.ReactNode
    roles?: AppRole[]
  }[]
}

export const data: NavData = {
  user: {
    name: "Urvil Patel",
    email: "urvil@example.com",
    avatar: "/avatars/user.jpg",
  },

  teams: [
    {
      name: "PeoplePay360 Inc.",
      logo: <GalleryVerticalEndIcon />,
      plan: "Enterprise",
    },
    {
      name: "PeoplePay360 Corp.",
      logo: <AudioLinesIcon />,
      plan: "Startup",
    },
    {
      name: "Demo Organization",
      logo: <TerminalIcon />,
      plan: "Demo",
    },
  ],

  navMain: [
    // ─────────────────────────────────────────────
    // DASHBOARD
    // ─────────────────────────────────────────────
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
      isActive: true,
      items: [
        {
            title: "Overview",
            url: "/dashboard",
          },
          {
            title: "Analytics",
            url: "/dashboard/analytics",
          },
          {
            title: "Reports",
            url: "/dashboard/reports",
        }
      ],
    },

    // ─────────────────────────────────────────────
    // EMPLOYEES
    // ─────────────────────────────────────────────
    {
      title: "Employees",
      url: "/employees",
      icon: <UsersIcon />,
      items: [
        {
          title: "All Employees",
          url: "/employees",
        },
        {
          title: "Departments",
          url: "/employees/departments",
        },
        {
          title: "Job Positions",
          url: "/employees/job-positions",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // CONTRACTS
    // ─────────────────────────────────────────────
    {
      title: "Contracts",
      url: "/contracts",
      icon: <FileTextIcon />,
      items: [
        {
          title: "All Contracts",
          url: "/contracts",
        },
        {
          title: "Active Contracts",
          url: "/contracts?status=active",
        },
        {
          title: "Expiring Contracts",
          url: "/contracts?status=expiring",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // ATTENDANCE
    // ─────────────────────────────────────────────
    {
      title: "Attendance",
      url: "/attendance",
      icon: <Clock3Icon />,
      items: [
        {
          title: "Attendance Records",
          url: "/attendance",
        },
        {
          title: "My Attendance",
          url: "/attendance/me",
        },
        {
          title: "Working Schedules",
          url: "/attendance/schedules",
        },
        {
          title: "Exceptions",
          url: "/attendance/exceptions",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // TIME OFF
    // ─────────────────────────────────────────────
    {
      title: "Time Off",
      url: "/time-off",
      icon: <CalendarDaysIcon />,
      items: [
        {
          title: "Requests",
          url: "/time-off/requests",
        },
        {
          title: "My Time Off",
          url: "/time-off/me",
        },
        {
          title: "Allocations",
          url: "/time-off/allocations",
        },
        {
          title: "Time Off Types",
          url: "/time-off/types",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // PAYROLL
    // ─────────────────────────────────────────────
    {
      title: "Payroll",
      url: "/payroll",
      icon: <BanknoteIcon />,
      items: [
        {
          title: "Payruns",
          url: "/payroll/payruns",
        },
        {
          title: "Payslips",
          url: "/payroll/payslips",
        },
        {
          title: "My Payslips",
          url: "/payroll/payslips/me",
          permission: { resource: "payslip", action: "read-self" },
        },
        {
          title: "Salary Structures",
          url: "/payroll/salary-structures",
        },
        {
          title: "Salary Rules",
          url: "/payroll/salary-rules",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // REPORTS
    // ─────────────────────────────────────────────
    {
      title: "Reports",
      url: "/reports",
      icon: <ChartNoAxesCombinedIcon />,
      items: [
        {
          title: "Payroll Overview",
          url: "/reports/payroll",
        },
        {
          title: "Attendance",
          url: "/reports/attendance",
        },
        {
          title: "Time Off",
          url: "/reports/time-off",
        },
        {
          title: "Department Costs",
          url: "/reports/departments",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // CONFIGURATION
    // ─────────────────────────────────────────────
    

    // ─────────────────────────────────────────────
    // ADMIN
    // ─────────────────────────────────────────────
    {
      title: "Administration",
      url: "/admin",
      icon: <ShieldCheckIcon />,
      items: [
        {
          title: "Users",
          url: "/admin/users",
        },
        {
          title: "Roles & Permissions",
          url: "/admin/roles",
        },
      ],
    },
  ],

  projects: [
    {
      name: "Employees",
      url: "/employees",
      icon: <UserRoundIcon />,
    },
    {
      name: "Attendance",
      url: "/attendance",
      icon: <CalendarClockIcon />,
    },
    {
      name: "Time Off",
      url: "/time-off/requests",
      icon: <ClipboardListIcon />,
    },
    {
      name: "Contracts",
      url: "/contracts",
      icon: <FileTextIcon />,
    },
    {
      name: "Payroll",
      url: "/payroll/payruns",
      icon: <WalletCardsIcon />,
    },
  ],
};

/**
 * Filters the navigation items based on the user's role and permissions.
 *
 * Rules:
 * - Omits top-level sections if the user lacks access to that section.
 * - Filters sub-items according to explicit roles, permissions, or route access rules.
 * - Omits parent sections when all their child items are restricted (e.g. Employee sees no Contracts, Employees, etc.).
 * - Shows only "My ..." items for employees where applicable (My Attendance, My Time Off, My Payslips).
 */
export function getFilteredNavMain(rawRole?: string | null): NavMainItem[] {
  const role = normalizeRole(rawRole);

  return data.navMain
    .map((section) => {
      // 1. If section has explicit roles and user doesn't match, filter out
      if (section.roles && !section.roles.includes(role)) {
        return null;
      }

      // 2. If section has sub-items, filter each sub-item
      if (section.items && section.items.length > 0) {
        const filteredItems = section.items.filter((item) => {
          // Explicit sub-item role check
          if (item.roles && !item.roles.includes(role)) {
            return false;
          }

          // Explicit sub-item permission check
          if (item.permission) {
            if (!hasPermission(role, item.permission.resource, item.permission.action as any)) {
              return false;
            }
          }

          // Route access check (strip query params)
          const cleanPath = item.url.split("?")[0];
          return canAccessRoute(cleanPath, role);
        });

        // Omit section if no sub-items are permitted
        if (filteredItems.length === 0) {
          return null;
        }

        return {
          ...section,
          items: filteredItems,
        };
      }

      // 3. Section without sub-items: check route access directly
      const cleanPath = section.url.split("?")[0];
      if (!canAccessRoute(cleanPath, role)) {
        return null;
      }

      return section;
    })
    .filter((item): item is NavMainItem => item !== null);
}

/**
 * Filters project shortcuts based on the user's role.
 */
export function getFilteredProjects(rawRole?: string | null) {
  const role = normalizeRole(rawRole);
  return data.projects.filter((item) => {
    const cleanPath = item.url.split("?")[0];
    return canAccessRoute(cleanPath, role);
  });
}