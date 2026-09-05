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

export const data = {
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
    {
      title: "Configuration",
      url: "/settings",
      icon: <Settings2Icon />,
      items: [
        {
          title: "Organization",
          url: "/settings/organization",
        },
        {
          title: "Departments",
          url: "/settings/departments",
        },
        {
          title: "Job Positions",
          url: "/settings/job-positions",
        },
        {
          title: "Working Schedules",
          url: "/settings/working-schedules",
        },
        {
          title: "Time Off Types",
          url: "/settings/time-off-types",
        },
        {
          title: "Salary Structures",
          url: "/settings/salary-structures",
        },
        {
          title: "Salary Rules",
          url: "/settings/salary-rules",
        },
      ],
    },

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