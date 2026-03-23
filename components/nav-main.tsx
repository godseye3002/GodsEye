"use client"

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
import { useDashboardStore } from '@/lib/store'
import { useRouter } from "next/navigation"

export function NavMain({
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
  const setActiveEngine = useDashboardStore((state) => state.setActiveEngine);
  const activeEngine = useDashboardStore((state) => state.activeEngine);
  const isLoading = useDashboardStore((state) => state.isLoading);
  const setActiveSection = useDashboardStore((state) => state.setActiveSection);
  const activeSection = useDashboardStore((state) => state.activeSection);
  const router = useRouter();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            defaultOpen={item.isActive}
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
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.items?.map((subItem) => {
                  const isDashboard = subItem.url === "/optimize"
                  const isProductInfo = subItem.title === "Product Information"
                  const isQueries = subItem.title === "Queries"
                  const isConversions = subItem.title === "Conversions"
                  const isCompetitorsData = subItem.title === "Competitors Data"
                  const isUnderstandDashboard = subItem.title === "Understand Dashboard"
                  const isWebsiteAudit = subItem.title === "Website Audit"
                  const isSpecialSection = isDashboard || isProductInfo || isQueries || isConversions || isCompetitorsData || isUnderstandDashboard || isWebsiteAudit

                  const isActive = isDashboard
                    ? (subItem.title === activeEngine && pathname === "/optimize" && activeSection === 'overview')
                    : isProductInfo
                      ? (activeSection === 'product_information' && pathname === "/optimize")
                      : isQueries
                        ? (activeSection === 'queries' && pathname === "/optimize")
                        : isConversions
                          ? (activeSection === 'conversions' && pathname === "/optimize")
                          : isCompetitorsData
                              ? (activeSection === 'documentation' && pathname === "/optimize")
                              : isWebsiteAudit
                                ? (activeSection === 'website_audit' && pathname === "/optimize")
                                : (pathname === subItem.url)

                  return (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton
                        onClick={(e) => {
                          if (subItem.disabled) {
                            e.preventDefault();
                            return;
                          }
                          if (isSpecialSection) {
                            e.preventDefault();

                            // 1. Set the correct state
                            if (isDashboard) {
                              setActiveEngine(subItem.title as any);
                              setActiveSection('overview');
                            } else if (isProductInfo) {
                              setActiveSection('product_information');
                            } else if (isQueries) {
                              setActiveSection('queries');
                            } else if (isConversions) {
                              setActiveSection('conversions');
                            } else if (isUnderstandDashboard) {
                              setActiveSection('documentation');
                            } else if (isWebsiteAudit) {
                              setActiveSection('website_audit');
                            } else if (isCompetitorsData) {
                              setActiveSection('competitors_data');
                            }

                            // 2. Navigate if not on optimize page
                            if (pathname !== "/optimize") {
                              router.push("/optimize")
                            }
                            return;
                          }
                        }}
                        isActive={isActive}
                        render={isSpecialSection ? <button /> : <a href={subItem.url} />}
                        className={subItem.disabled ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        <span className="flex items-center justify-between w-full gap-3">
                          <span className="flex items-center gap-2">
                            {subItem.title}
                            {isActive && isLoading && isDashboard && (
                              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                            )}
                          </span>
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
