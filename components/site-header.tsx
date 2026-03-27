import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useProductStore } from "@/app/optimize/store"
import { Box, Typography } from "@mui/joy"
import { HugeiconsIcon } from "@hugeicons/react"
import { Copy01Icon, CheckmarkCircle02Icon, SidebarLeftIcon } from "@hugeicons/core-free-icons"
import * as React from "react"
import { cn } from "@/lib/utils"

export function SiteHeader({ title = "Dashboard", actions }: { title?: string; actions?: React.ReactNode }) {
  const currentProductId = useProductStore((state) => state.currentProductId)
  const products = useProductStore((state) => state.products)
  const userCredits = useProductStore((state) => state.userCredits)
  const subscription = useProductStore((state) => state.subscription)
  const plan = useProductStore((state) => state.plan)
  const [copied, setCopied] = React.useState(false)

  const trialDaysRemaining = React.useMemo(() => {
    if (!subscription?.trialExpiresAt) return null;
    const expiry = new Date(subscription.trialExpiresAt);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  }, [subscription?.trialExpiresAt]);

  const currentProduct = products.find((p) => p.id === currentProductId)

  const handleCopy = () => {
    if (currentProductId) {
      navigator.clipboard.writeText(currentProductId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <header className="flex h-16 shrink-0 items-center border-b border-[#1E2028] bg-[#0D0F14]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="flex w-full items-center gap-2 px-6">
        <SidebarTrigger size="icon-lg" className="-ml-3 [&_svg]:size-6 text-white hover:bg-white/5 active:bg-white/10" />
        <Separator
          orientation="vertical"
          className="mx-2 h-6 bg-[#1E2028]"
        />
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-medium text-[#F2F5FA]">{title}</h1>
            {currentProduct && (
              <div className="flex items-center gap-2 ml-1">
                {/* Product ID Box */}
                <div className="flex items-center gap-2 px-2 py-1 bg-[#1E2028]/50 border border-[#2ED47A]/20 rounded-full">
                  <div className="flex flex-col -mr-1">
                    <Typography level="body-xs" sx={{ color: "#2ED47A", fontWeight: 800, fontSize: "0.55rem", textTransform: "uppercase", lineHeight: 1.1, letterSpacing: "0.05em" }}>
                      Product ID
                    </Typography>
                    {/* <Typography level="body-xs" sx={{ color: "#2ED47A", fontWeight: 800, fontSize: "0.55rem", textTransform: "uppercase", lineHeight: 1.1, letterSpacing: "0.05em" }}>
                      ID
                    </Typography> */}
                  </div>
                  <Typography level="body-xs" sx={{ color: "rgba(162, 167, 180, 0.8)", fontFamily: "monospace", fontSize: "0.75rem", whiteSpace: "nowrap", flex: 1, pt: "1px" }}>
                    {currentProductId}
                  </Typography>
                  <button
                    onClick={handleCopy}
                    className={cn(
                      "p-1 rounded-md transition-colors",
                      copied ? "text-[#2ED47A]" : "text-gray-500 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {copied ? (
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                    ) : (
                      <HugeiconsIcon icon={Copy01Icon} size={14} />
                    )}
                  </button>
                </div>

                {/* Account / Subscription Box (Moved to Sidebar Profile Dropdown) */}
                {/* 
                <div className="flex items-center gap-2 px-3 py-1 bg-[#1E2028]/50 border border-[#2ED47A]/20 rounded-full">
                  <div className="flex items-center gap-1.5">
                    <Typography level="body-xs" sx={{ color: "#2ED47A", fontWeight: 700, fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Credits
                    </Typography>
                    <Typography level="body-sm" sx={{ color: "#F2F5FA", fontWeight: 800, whiteSpace: "nowrap" }}>
                      {userCredits ?? 0}
                    </Typography>
                  </div>

                  <Separator orientation="vertical" className="h-3 bg-[#2ED47A]/20" />

                  <div className="flex items-center gap-1.5">
                    <Typography level="body-xs" sx={{ color: "#2ED47A", fontWeight: 700, fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Usage
                    </Typography>
                    <Typography level="body-sm" sx={{ color: "#F2F5FA", fontWeight: 800, whiteSpace: "nowrap", display: "flex", alignItems: "baseline", gap: 0.5 }}>
                      {subscription?.interactionsUsed ?? 0}
                      <span className="text-gray-500 font-medium text-[0.7rem]">
                        / {plan?.interactionLimit ?? '∞'}
                      </span>
                    </Typography>
                  </div>

                  <Separator orientation="vertical" className="h-3 bg-[#2ED47A]/20" />

                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "px-1.5 py-0.5 rounded text-[0.6rem] font-bold uppercase tracking-wider",
                      subscription?.tier === 'pro_max' ? "bg-purple-500/10 text-purple-400" :
                        subscription?.tier === 'pro' ? "bg-blue-500/10 text-blue-400" :
                          "bg-[#2ED47A]/10 text-[#2ED47A]"
                    )}>
                      {subscription?.tier?.replace('_', ' ') || 'Free'}
                    </div>
                    {subscription?.tier === 'free' && trialDaysRemaining !== null && (
                      <Typography level="body-xs" sx={{ color: trialDaysRemaining <= 1 ? "#F35B64" : "rgba(162, 167, 180, 0.6)", fontWeight: 500, fontSize: '0.65rem' }}>
                        {trialDaysRemaining}d left
                      </Typography>
                    )}
                  </div>
                </div> 
                */}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {actions}
          </div>
        </div>
      </div>
    </header>
  )
}
