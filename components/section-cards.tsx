"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import { ChartUpIcon, ChartDownIcon } from "@hugeicons/core-free-icons"

import { TopCardsData } from "@/lib/store"

function formatTrend(value: number | null | undefined, suffix: string = "%"): { text: string; isPositive: boolean; hasTrend: boolean } {
  if (value === null || value === undefined) {
    return { text: `N/A`, isPositive: true, hasTrend: false }
  }
  const sign = value >= 0 ? "+" : ""
  return { text: `${sign}${value}${suffix}`, isPositive: value >= 0, hasTrend: true }
}

export function SectionCards({ data }: { data: TopCardsData | null }) {
  const brandCoverage = (data?.brand_coverage != null && parseFloat(String(data.brand_coverage)) > 0) ? `${data.brand_coverage}%` : "0%"
  const totalMentions = (data?.total_mentions != null && parseFloat(String(data.total_mentions)) > 0) ? data.total_mentions.toLocaleString() : "0"
  const visibilityRate = (data?.visibility_rate != null && parseFloat(String(data.visibility_rate)) > 0) ? `${data.visibility_rate}%` : "0%"
  const avgDominance = (data?.avg_dominance_rate != null && parseFloat(String(data.avg_dominance_rate)) > 0) ? `${data.avg_dominance_rate}%` : "0%"
  const avgConvProb = (data?.avg_conversion_probability != null && parseFloat(String(data.avg_conversion_probability)) > 0) ? `${data.avg_conversion_probability}%` : "0%"
  const citationScore = (data?.citation_score != null && parseFloat(String(data.citation_score)) > 0) ? data.citation_score.toLocaleString() : "0"

  const coverageTrend = formatTrend(data?.brand_coverage_trend, "%")
  const mentionsTrend = formatTrend(data?.total_mentions_trend, "")
  const visibilityTrend = formatTrend(data?.visibility_rate_trend, "%")
  const dominanceTrend = formatTrend(data?.avg_dominance_rate_trend, "%")
  const convProbTrend = formatTrend(data?.avg_conversion_probability_trend, "%")
  const citationTrend = formatTrend(data?.citation_score_trend, "")

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader className="px-4 lg:px-6">
          <CardDescription>Brand Coverage</CardDescription>
          <div className="flex items-baseline gap-2">
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {brandCoverage}
            </CardTitle>
            <div className="flex flex-col ml-1">
              {data?.prev_brand_coverage != null && (
                <span className="text-xs text-muted-foreground/60 font-medium whitespace-nowrap">
                  vs {data.prev_brand_coverage}%
                </span>
              )}
              {data?.best_brand_coverage != null && (
                <span className="text-[10px] text-emerald-500/80 font-bold whitespace-nowrap leading-none mt-0.5" title="All-time Best Performance">
                  Best: {data.best_brand_coverage}%
                </span>
              )}
            </div>
          </div>
          <CardAction>
            <Badge variant="outline" className={coverageTrend.hasTrend ? (coverageTrend.isPositive ? "text-green-600" : "text-red-600") : ""}>
              <HugeiconsIcon icon={coverageTrend.isPositive ? ChartUpIcon : ChartDownIcon} strokeWidth={2} />
              {coverageTrend.text}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Analyzed queries showing your brand
          </div>
          <div className="text-muted-foreground">
            Current snapshot coverage
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="px-4 lg:px-6">
          <CardDescription>Mentions</CardDescription>
          <div className="flex items-baseline gap-2">
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {totalMentions}
            </CardTitle>
            <div className="flex flex-col ml-1">
              {data?.prev_total_mentions != null && (
                <span className="text-xs text-muted-foreground/60 font-medium whitespace-nowrap">
                  vs {data.prev_total_mentions.toLocaleString()}
                </span>
              )}
              {data?.best_total_mentions != null && (
                <span className="text-[10px] text-emerald-500/80 font-bold whitespace-nowrap leading-none mt-0.5" title="All-time Best Performance">
                  Best: {data.best_total_mentions.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <CardAction>
            <Badge variant="outline" className={mentionsTrend.hasTrend ? (mentionsTrend.isPositive ? "text-green-600" : "text-red-600") : ""}>
              <HugeiconsIcon icon={mentionsTrend.isPositive ? ChartUpIcon : ChartDownIcon} strokeWidth={2} />
              {mentionsTrend.text}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total brand references found
          </div>
          <div className="text-muted-foreground leading-tight">
            Total across all queries (incl. citations)
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="px-4 lg:px-6">
          <CardDescription>Visibility Rate</CardDescription>
          <div className="flex items-baseline gap-2">
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {visibilityRate}
            </CardTitle>
            <div className="flex flex-col ml-1">
              {data?.prev_visibility_rate != null && (
                <span className="text-xs text-muted-foreground/60 font-medium whitespace-nowrap">
                  vs {data.prev_visibility_rate}%
                </span>
              )}
              {data?.best_visibility_rate != null && (
                <span className="text-[10px] text-emerald-500/80 font-bold whitespace-nowrap leading-none mt-0.5" title="All-time Best Performance">
                  Best: {data.best_visibility_rate}%
                </span>
              )}
            </div>
          </div>
          <CardAction>
            <Badge variant="outline" className={visibilityTrend.hasTrend ? (visibilityTrend.isPositive ? "text-green-600" : "text-red-600") : ""}>
              <HugeiconsIcon icon={visibilityTrend.isPositive ? ChartUpIcon : ChartDownIcon} strokeWidth={2} />
              {visibilityTrend.text}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Semantic alignment score
          </div>
          <div className="text-muted-foreground Brand relevance to intent">Brand relevance to intent</div>
        </CardFooter>
      </Card>

      {/* New Second Row of Cards */}
      <Card className="@container/card">
        <CardHeader className="px-4 lg:px-6">
          <CardDescription>Avg. Dominance Rate</CardDescription>
          <div className="flex items-baseline gap-2">
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {avgDominance}
            </CardTitle>
            <div className="flex flex-col ml-1">
              {data?.prev_avg_dominance_rate != null && (
                <span className="text-xs text-muted-foreground/60 font-medium whitespace-nowrap">
                  vs {data.prev_avg_dominance_rate}%
                </span>
              )}
              {data?.best_avg_dominance_rate != null && (
                <span className="text-[10px] text-emerald-500/80 font-bold whitespace-nowrap leading-none mt-0.5" title="All-time Best Performance">
                  Best: {data.best_avg_dominance_rate}%
                </span>
              )}
            </div>
          </div>
          <CardAction>
            <Badge variant="outline" className={dominanceTrend.hasTrend ? (dominanceTrend.isPositive ? "text-green-600" : "text-red-600") : ""}>
              <HugeiconsIcon icon={dominanceTrend.isPositive ? ChartUpIcon : ChartDownIcon} strokeWidth={2} />
              {dominanceTrend.text}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Dominance in search results
          </div>
          <div className="text-muted-foreground">
            Relative frequency vs competitors
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="px-4 lg:px-6">
          <CardDescription>Avg. Conv. Prob.</CardDescription>
          <div className="flex items-baseline gap-2">
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {avgConvProb}
            </CardTitle>
            <div className="flex flex-col ml-1">
              {data?.prev_avg_conversion_probability != null && (
                <span className="text-xs text-muted-foreground/60 font-medium whitespace-nowrap">
                  vs {data.prev_avg_conversion_probability}%
                </span>
              )}
              {data?.best_avg_conversion_probability != null && (
                <span className="text-[10px] text-emerald-500/80 font-bold whitespace-nowrap leading-none mt-0.5" title="All-time Best Performance">
                  Best: {data.best_avg_conversion_probability}%
                </span>
              )}
            </div>
          </div>
          <CardAction>
            <Badge variant="outline" className={convProbTrend.hasTrend ? (convProbTrend.isPositive ? "text-green-600" : "text-red-600") : ""}>
              <HugeiconsIcon icon={convProbTrend.isPositive ? ChartUpIcon : ChartDownIcon} strokeWidth={2} />
              {convProbTrend.text}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Conversion probability
          </div>
          <div className="text-muted-foreground">
            Predicted purchase intent score
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="px-4 lg:px-6">
          <CardDescription>Citation Score</CardDescription>
          <div className="flex items-baseline gap-2">
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {citationScore}
            </CardTitle>
            <div className="flex flex-col ml-1">
              {data?.prev_citation_score != null && (
                <span className="text-xs text-muted-foreground/60 font-medium whitespace-nowrap">
                  vs {data.prev_citation_score.toLocaleString()}
                </span>
              )}
              {data?.best_citation_score != null && (
                <span className="text-[10px] text-emerald-500/80 font-bold whitespace-nowrap leading-none mt-0.5" title="All-time Best Performance">
                  Best: {data.best_citation_score.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <CardAction>
            <Badge variant="outline" className={citationTrend.hasTrend ? (citationTrend.isPositive ? "text-green-600" : "text-red-600") : ""}>
              <HugeiconsIcon icon={citationTrend.isPositive ? ChartUpIcon : ChartDownIcon} strokeWidth={2} />
              {citationTrend.text}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total citations found
          </div>
          <div className="text-muted-foreground">
            Across trusted source analysis
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
