"use client"

import * as React from "react"

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
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { useProductStore } from "@/app/optimize/store"
import { useDashboardStore } from "@/lib/store"
import { useRouter } from "next/navigation"

export function NavMainOptimize({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    isActive?: boolean
    disabled?: boolean
    badge?: string
    items?: {
      title: string
      url: string
      disabled?: boolean
    }[]
  }[]
}) {
  const activeSection = useProductStore((state) => state.activeSection)
  const setActiveSection = useProductStore((state) => state.setActiveSection)
  const setDashboardActiveSection = useDashboardStore((state) => state.setActiveSection)
  const router = useRouter()

  const mapTitleToOptimizeSection = (title: string): string | null => {
    if (title === "Product Information") return "product"
    if (title === "Queries") return "query"
    if (title === "Perplexity") return "perplexity"
    if (title === "Google AI Mode") return "google"
    if (title === "ChatGPT") return "chatgpt"
    if (title === "Competitors Data") return "competitors_data"
    if (title === "Understand Dashboard") return "documentation"
    if (title === "MCP Documentation") return "mcp_documentation"
    if (title === "Website Audit") return "website_audit"
    return null
  }

  const shouldGroupBeOpen = (groupItems?: { title: string; url: string }[]) => {
    if (!groupItems || groupItems.length === 0) return false
    return groupItems.some(
      (subItem) => mapTitleToOptimizeSection(subItem.title) === activeSection,
    )
  }

  const [openByGroupTitle, setOpenByGroupTitle] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const item of items) {
      initial[item.title] = shouldGroupBeOpen(item.items) || !!item.isActive
    }
    return initial
  })

  React.useEffect(() => {
    const activeGroupTitle = items.find((item) => shouldGroupBeOpen(item.items))?.title
    if (!activeGroupTitle) return
    setOpenByGroupTitle((prev) => {
      if (prev[activeGroupTitle]) return prev
      return { ...prev, [activeGroupTitle]: true }
    })
  }, [activeSection, items])

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            open={!!openByGroupTitle[item.title]}
            onOpenChange={(nextOpen) =>
              setOpenByGroupTitle((prev) => ({ ...prev, [item.title]: nextOpen }))
            }
            className="group/collapsible"
            render={<SidebarMenuItem />}
          >
            <CollapsibleTrigger
              disabled={item.disabled}
              render={<SidebarMenuButton tooltip={item.title} className={item.disabled ? "opacity-50 cursor-not-allowed" : ""} />}
            >
              {item.icon}
              <span className="flex items-center gap-2">
                {item.title}
                {item.disabled && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-linear-to-r from-[#2ED47A]/20 to-[#2ED47A]/10 border border-[#2ED47A]/20 text-[#2ED47A] uppercase tracking-wider whitespace-nowrap">
                    Soon
                  </span>
                )}
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#2ED47A] text-[#0D0F14] uppercase tracking-wider whitespace-nowrap ml-1">
                    {item.badge}
                  </span>
                )}
              </span>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90"
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.items?.map((subItem) => {
                  const mappedSection = mapTitleToOptimizeSection(subItem.title)
                  const isOptimizeSection = mappedSection !== null
                  const isActive = isOptimizeSection ? activeSection === mappedSection : false

                  return (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton
                        onClick={(e) => {
                          if (subItem.disabled) {
                            e.preventDefault()
                            return
                          }
                          if (subItem.title === "Understand Dashboard") {
                            e.preventDefault()
                            setActiveSection('documentation')
                            return
                          }
                          if (subItem.title === "MCP Documentation") {
                            e.preventDefault()
                            setActiveSection('mcp_documentation')
                            return
                          }
                          if (isOptimizeSection) {
                            e.preventDefault()
                            setActiveSection(mappedSection)
                          }
                        }}
                        isActive={isActive}
                        render={(isOptimizeSection || subItem.title === "Understand Dashboard" || subItem.title === "MCP Documentation") ? <button /> : <a href={subItem.url} />}
                        className={subItem.disabled ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        <span className="flex items-center justify-between w-full gap-3">
                          <span className="flex items-center gap-2">{subItem.title}</span>
                          {subItem.disabled && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-linear-to-r from-[#2ED47A]/20 to-[#2ED47A]/10 border border-[#2ED47A]/20 text-[#2ED47A] uppercase tracking-wider whitespace-nowrap ml-auto">
                              Soon
                            </span>
                          )}
                        </span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
