"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export function AppShell({
  headerTitle,
  sidebarMode,
  children,
  headerActions,
}: {
  headerTitle: string
  sidebarMode: "dashboard" | "optimize"
  children: React.ReactNode
  headerActions?: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar mode={sidebarMode} />
      <SidebarInset>
        <SiteHeader title={headerTitle} actions={headerActions} />
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
