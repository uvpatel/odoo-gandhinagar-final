"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCan } from "@/hooks/use-permissions";
import {
  FileTextIcon,
  LayersIcon,
  CalendarIcon,
  UserCheckIcon,
  LayoutDashboardIcon,
} from "lucide-react";

export function TimeOffSubNav() {
  const pathname = usePathname();
  const { can, role } = useCan();

  const canManageAll = can("timeOffRequest", "read");
  const canManageAllocations = can("timeOffAllocation", "read");
  const canManageTypes = can("timeOffType", "read");

  const navItems = [
    ...(canManageAll
      ? [
          {
            label: "Dashboard",
            href: "/time-off",
            icon: LayoutDashboardIcon,
            isActive: pathname === "/time-off",
          },
          {
            label: "Requests",
            href: "/time-off/requests",
            icon: FileTextIcon,
            isActive: pathname === "/time-off/requests",
          },
        ]
      : []),
    {
      label: "My Time Off",
      href: "/time-off/me",
      icon: UserCheckIcon,
      isActive: pathname === "/time-off/me",
    },
    ...(canManageAllocations
      ? [
          {
            label: "Allocations",
            href: "/time-off/allocations",
            icon: CalendarIcon,
            isActive: pathname.startsWith("/time-off/allocations"),
          },
        ]
      : []),
    ...(canManageTypes
      ? [
          {
            label: "Time Off Types",
            href: "/time-off/types",
            icon: LayersIcon,
            isActive: pathname.startsWith("/time-off/types"),
          },
        ]
      : []),
  ];

  return (
    <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={item.isActive ? "secondary" : "ghost"}
              size="sm"
              className={`text-xs gap-1.5 h-8 ${
                item.isActive
                  ? "font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" />
              <span>{item.label}</span>
            </Button>
          </Link>
        );
      })}
    </div>
  );
}
