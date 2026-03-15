import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useProductStore } from "@/app/optimize/store"
import { Box, Typography } from "@mui/joy"
import { HugeiconsIcon } from "@hugeicons/react"
import { Copy01Icon, CheckmarkCircle02Icon, SidebarLeftIcon } from "@hugeicons/core-free-icons"
import * as React from "react"
import { cn } from "@/lib/utils"

export function SiteHeader({ title = "Overview", actions }: { title?: string; actions?: React.ReactNode }) {
  const currentProductId = useProductStore((state) => state.currentProductId)
  const products = useProductStore((state) => state.products)
  const [copied, setCopied] = React.useState(false)

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
              <div className="flex items-center gap-2 ml-4 px-3 py-1 bg-[#1E2028]/50 border border-[#2ED47A]/20 rounded-full">
                <Typography level="body-xs" sx={{ color: "#2ED47A", fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Product
                </Typography>
                <Typography level="body-sm" sx={{ color: "#F2F5FA", fontWeight: 500 }}>
                  {currentProduct.name}
                </Typography>
                <Separator orientation="vertical" className="h-3 bg-[#1E2028]" />
                <Typography level="body-xs" sx={{ color: "rgba(162, 167, 180, 0.6)", fontFamily: "monospace", fontSize: "0.7rem" }}>
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
