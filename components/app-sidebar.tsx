"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavMainOptimize } from "@/components/nav-main-optimize"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { LayoutBottomIcon, AudioWave01Icon, CommandIcon, ComputerTerminalIcon, RoboticIcon, BookOpen02Icon, Settings05Icon, CropIcon, PieChartIcon, MapsIcon, PackageIcon, UserGroupIcon, SearchList01Icon } from "@hugeicons/core-free-icons"
import { getWebsiteIcon } from "@/lib/favicon"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: (
        <HugeiconsIcon icon={LayoutBottomIcon} strokeWidth={2} />
      ),
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: (
        <HugeiconsIcon icon={AudioWave01Icon} strokeWidth={2} />
      ),
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: (
        <HugeiconsIcon icon={CommandIcon} strokeWidth={2} />
      ),
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Product Data",
      url: "#",
      icon: (
        <HugeiconsIcon icon={PackageIcon} strokeWidth={2} />
      ),
      isActive: true,
      items: [
        {
          title: "Product Information",
          url: "/optimize#product-info",
        },
        {
          title: "Queries",
          url: "/optimize#queries",
        },
        {
          title: "Competitors Data",
          url: "/optimize#competitors-data",
          disabled: true,
        },
      ],
    },
    {
      title: "Dashboard",
      url: "/optimize",
      icon: (
        <HugeiconsIcon icon={ComputerTerminalIcon} strokeWidth={2} />
      ),
      items: [
        {
          title: "Perplexity",
          url: "/optimize",
        },
        {
          title: "Google AI Mode",
          url: "/optimize",
        },
        {
          title: "ChatGPT",
          url: "/optimize",
          disabled: true,
        },
      ],
    },
    {
      title: "Conversions",
      url: "#",
      icon: (
        <HugeiconsIcon icon={PieChartIcon} strokeWidth={2} />
      ),
      badge: "Beta",
      items: [
        {
          title: "Dashboard",
          url: "/optimize",
          section: "conversions",
        },
        {
          title: "Tracking Script",
          url: "/optimize",
          section: "conversion_tracker",
        },
      ],
    },
    /*
        {
          title: "Models",
          url: "#",
          icon: (
            <HugeiconsIcon icon={RoboticIcon} strokeWidth={2} />
          ),
          items: [
            {
              title: "Genesis",
              url: "#",
            },
            {
              title: "Explorer",
              url: "#",
            },
            {
              title: "Quantum",
              url: "#",
            },
          ],
        },
        */
    {
      title: "Audit",
      url: "#",
      badge: "Beta",
      icon: (
        <HugeiconsIcon icon={SearchList01Icon} strokeWidth={2} />
      ),
      items: [
        {
          title: "Website Audit",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      disabled: false,
      icon: (
        <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={2} />
      ),
      items: [
        {
          title: "Understand Dashboard",
          url: "#",
        },
        {
          title: "Conversion Dashboard",
          url: "#",
        },
        {
          title: "MCP Documentation",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      disabled: true,
      icon: (
        <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />
      ),
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  /*
    projects: [
      {
        name: "Design Engineering",
        url: "#",
        icon: (
          <HugeiconsIcon icon={CropIcon} strokeWidth={2} />
        ),
      },
      {
        name: "Sales & Marketing",
        url: "#",
        icon: (
          <HugeiconsIcon icon={PieChartIcon} strokeWidth={2} />
        ),
      },
      {
        name: "Travel",
        url: "#",
        icon: (
          <HugeiconsIcon icon={MapsIcon} strokeWidth={2} />
        ),
      },
    ],
    */
}

import { useProductStore } from "@/app/optimize/store"

export function AppSidebar({ mode = "dashboard", ...props }: React.ComponentProps<typeof Sidebar> & { mode?: "dashboard" | "optimize" }) {
  const userInfo = useProductStore((state) => state.userInfo)
  const currentProductId = useProductStore((state) => state.currentProductId)
  const products = useProductStore((state) => state.products)

  const currentProduct = products.find(p => p.id === currentProductId)
  const productUrl = currentProduct?.formData?.url || ""
  const faviconUrl = productUrl ? getWebsiteIcon(productUrl) : null

  const sidebarData = React.useMemo(() => {
    return {
      ...data,
      user: {
        name: userInfo?.name || "User",
        email: userInfo?.email || "user@example.com",
        avatar: userInfo?.avatarUrl || "/avatars/shadcn.jpg",
      },
      // In the future we can populate projects with real products here
    }
  }, [userInfo])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-4">
          {/* <TeamSwitcher teams={data.teams} /> */}
          <div className="flex items-center gap-3 overflow-hidden px-1">
            <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0 overflow-hidden">
              {faviconUrl ? (
                <img
                  src={faviconUrl}
                  alt={currentProduct?.name}
                  className="size-7 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      const iconEl = document.createElement('div');
                      iconEl.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 15h18"/></svg>';
                      parent.appendChild(iconEl.firstChild!);
                    }
                  }}
                />
              ) : (
                <HugeiconsIcon icon={LayoutBottomIcon} strokeWidth={2} className="size-7" />
              )}
            </div>
            <div className="flex flex-col overflow-hidden leading-tight">
              {currentProduct ? (
                <>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Analysis For</span>
                  <span className="text-sm font-bold truncate">{currentProduct.name}</span>
                </>
              ) : (
                <>
                  <span className="text-sm font-bold truncate">GodsEye AI</span>
                  <span className="text-xs text-muted-foreground truncate">Select a product</span>
                </>
              )}
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {mode === "optimize" ? (
          <NavMainOptimize items={sidebarData.navMain} />
        ) : (
          <NavMain items={sidebarData.navMain} />
        )}
        {/* <NavProjects projects={sidebarData.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
