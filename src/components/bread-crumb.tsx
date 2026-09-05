// components/app-breadcrumb.tsx

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  approvals: "Approvals",
  attendance: "Attendance",
  organization: "Organization",
  employees: "Employees",
  departments: "Departments",
  designations: "Designations",
  "office-locations": "Office Locations",
  payroll: "Payroll",
  settings: "Settings",
  profile: "Profile",
}

function formatSegment(segment: string) {
  const decoded = decodeURIComponent(segment)

  // Use custom name if available
  if (routeLabels[decoded]) {
    return routeLabels[decoded]
  }

  // Otherwise automatically convert:
  // office-locations -> Office Locations
  // employee_details -> Employee Details
  return decoded
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function AppBreadcrumb() {
  const pathname = usePathname()

  const segments = pathname.split("/").filter(Boolean)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/")
          const isLast = index === segments.length - 1

          return (
            <div key={href} className="contents">
              <BreadcrumbItem
                className={!isLast ? "hidden md:inline-flex" : undefined}
              >
                {isLast ? (
                  <BreadcrumbPage>
                    {formatSegment(segment)}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink >
                    <Link href={href}>
                      {formatSegment(segment)}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>

              {!isLast && (
                <BreadcrumbSeparator className="hidden md:block" />
              )}
            </div>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}