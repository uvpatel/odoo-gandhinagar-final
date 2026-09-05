"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()

  const isChildActive = React.useCallback(
    (subUrl: string) => {
      const cleanSub = subUrl.split("?")[0]
      if (
        cleanSub === "/dashboard" ||
        cleanSub === "/contracts" ||
        cleanSub === "/attendance" ||
        cleanSub === "/payroll" ||
        cleanSub === "/time-off" ||
        cleanSub === "/employees" ||
        cleanSub === "/reports"
      ) {
        return pathname === cleanSub
      }
      return pathname === cleanSub || pathname.startsWith(cleanSub + "/")
    },
    [pathname]
  )

  // Track open state of collapsible sections
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const item of items) {
      if (item.isActive) {
        initial[item.title] = true
      }
    }
    return initial
  })

  // Whenever the active route changes, expand the section that contains it
  React.useEffect(() => {
    for (const item of items) {
      const hasActiveChild = item.items?.some((subItem) => isChildActive(subItem.url))
      if (hasActiveChild) {
        setOpenSections((prev) => (prev[item.title] ? prev : { ...prev, [item.title]: true }))
      }
    }
  }, [pathname, items, isChildActive])

  const handleOpenChange = (title: string, nextOpen: boolean) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: nextOpen,
    }))
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasActiveChild = item.items?.some((subItem) => isChildActive(subItem.url)) ?? false
          const isOpen = openSections[item.title] ?? item.isActive ?? false

          return (
            <Collapsible
              key={item.title}
              open={isOpen}
              onOpenChange={(nextOpen) => handleOpenChange(item.title, nextOpen)}
              className="group/collapsible"
              render={<SidebarMenuItem />}
            >
              <CollapsibleTrigger
                render={<SidebarMenuButton tooltip={item.title} isActive={hasActiveChild} />}
              >
                {item.icon}
                <span>{item.title}</span>
                <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => {
                    const active = isChildActive(subItem.url)
                    return (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          render={<Link href={subItem.url} prefetch={true} />}
                          isActive={active}
                        >
                          <span>{subItem.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
