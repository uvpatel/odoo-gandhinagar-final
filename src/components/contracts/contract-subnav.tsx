"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  FileTextIcon,
  CheckCircle2Icon,
  ClockIcon,
  LayersIcon,
} from "lucide-react";

export function ContractSubNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "All Contracts",
      href: "/contracts",
      icon: FileTextIcon,
      isActive: pathname === "/contracts",
    },
    {
      label: "Active Contracts",
      href: "/contracts/active",
      icon: CheckCircle2Icon,
      isActive: pathname === "/contracts/active",
    },
    {
      label: "Expiring Soon",
      href: "/contracts/expiring",
      icon: ClockIcon,
      isActive: pathname === "/contracts/expiring",
    },
    {
      label: "Contract Groups",
      href: "/contracts/groups",
      icon: LayersIcon,
      isActive: pathname === "/contracts/groups",
    },
  ];

  return (
    <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} prefetch={true}>
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
