"use client"

import * as React from "react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { UnfoldMoreIcon, LogoutIcon } from "@hugeicons/core-free-icons"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useProductStore } from "@/app/optimize/store"
import { Separator } from "./ui/separator"
import { cn } from "@/lib/utils"
import { CircleIcon, CoinsIcon, DatabaseIcon, SparklesIcon, Clock01Icon, Analytics01Icon } from "@hugeicons/core-free-icons"
import { Switch } from "@/components/ui/switch"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const { signOut, user: authUser } = useAuth()
  const router = useRouter()

  const userCredits = useProductStore((state) => state.userCredits)
  const subscription = useProductStore((state) => state.subscription)
  const plan = useProductStore((state) => state.plan)
  const currentProductId = useProductStore((state) => state.currentProductId)
  const products = useProductStore((state) => state.products)
  const toggleDailyTracker = useProductStore((state) => state.toggleDailyTracker)

  const currentProduct = React.useMemo(() => 
    products.find(p => p.id === currentProductId),
    [products, currentProductId]
  )

  const trialDaysRemaining = React.useMemo(() => {
    if (!subscription?.trialExpiresAt) return null;
    const expiry = new Date(subscription.trialExpiresAt);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  }, [subscription?.trialExpiresAt]);

  const handleLogout = async () => {
    try {
      await signOut()
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <Avatar>
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
            <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            
            {/* Subscription & Usage Stats */}
            <DropdownMenuGroup className="px-1 py-1.5">
              <div className="space-y-3 px-1">
                {/* Plan Tier Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">Subscription</span>
                  <div className={cn(
                    "px-2 py-0.5 rounded text-[0.6rem] font-black uppercase tracking-wider",
                    subscription?.tier === 'pro_max' ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                    subscription?.tier === 'pro' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                    "bg-[#2ED47A]/10 text-[#2ED47A] border border-[#2ED47A]/20"
                  )}>
                    {subscription?.tier?.replace('_', ' ') || 'Free'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                   {/* Credits */}
                  <div className="flex flex-col gap-1 rounded-md border border-white/5 bg-white/5 p-2">
                    <div className="flex items-center gap-1.5">
                      <HugeiconsIcon icon={CoinsIcon} size={10} className="text-[#2ED47A]" />
                      <span className="text-[0.55rem] font-bold uppercase tracking-wider text-muted-foreground">Credits</span>
                    </div>
                    <span className="text-xs font-bold text-[#F2F5FA]">{userCredits ?? 0}</span>
                  </div>

                  {/* Usage */}
                  <div className="flex flex-col gap-1 rounded-md border border-white/5 bg-white/5 p-2">
                    <div className="flex items-center gap-1.5">
                      <HugeiconsIcon icon={DatabaseIcon} size={10} className="text-[#2ED47A]" />
                      <span className="text-[0.55rem] font-bold uppercase tracking-wider text-muted-foreground">Usage</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-bold text-[#F2F5FA]">{subscription?.interactionsUsed ?? 0}</span>
                      <span className="text-[0.6rem] font-medium text-muted-foreground">/ {plan?.interactionLimit ?? '∞'}</span>
                    </div>
                  </div>
                </div>

                {/* Daily Tracker Toggle */}
                {currentProduct && (
                  <DropdownMenuItem
                    className="p-0 border-none bg-transparent focus:bg-transparent data-[highlighted]:bg-transparent data-[highlighted]:text-inherit h-auto min-h-0 cursor-default"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <div 
                      className="flex items-center justify-between gap-2 rounded-md border border-white/5 bg-white/5 p-2 transition-colors hover:bg-white/10 group w-full cursor-default"
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <HugeiconsIcon icon={Analytics01Icon} size={10} className="text-[#2ED47A]" />
                          <span className="text-[0.55rem] font-black uppercase tracking-widest text-[#2ED47A]">Daily Tracker</span>
                        </div>
                        <span className="text-[0.65rem] text-muted-foreground font-medium truncate">
                          {currentProduct.name}
                        </span>
                      </div>
                      <Switch 
                        checked={currentProduct.daily_tracker}
                        onCheckedChange={(checked) => {
                          if (authUser?.id) {
                            toggleDailyTracker(currentProduct.id, authUser.id, checked)
                          }
                        }}
                        className="data-[state=checked]:bg-[#2ED47A] scale-75 origin-right"
                      />
                    </div>
                  </DropdownMenuItem>
                )}

                {/* Trial Countdown (Only if Free & Expires) */}
                {subscription?.tier === 'free' && trialDaysRemaining !== null && (
                  <div className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[0.65rem] font-semibold",
                    trialDaysRemaining <= 1 ? "bg-red-500/10 text-red-500 border border-red-500/10" : "bg-white/5 text-muted-foreground border border-white/5"
                  )}>
                    <HugeiconsIcon icon={Clock01Icon} size={12} />
                    <span>Free Trial: {trialDaysRemaining} days remaining</span>
                  </div>
                )}
              </div>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 focus:bg-red-500/10">
              <HugeiconsIcon icon={LogoutIcon} strokeWidth={2} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
