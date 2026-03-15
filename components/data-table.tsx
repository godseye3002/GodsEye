"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
} from "@/components/ui/tabs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  LeftToRightListBulletIcon,
  ArrowDown01Icon,
  Add01Icon,
  Globe02Icon,
} from "@hugeicons/core-free-icons"
import { getWebsiteIcon } from "@/lib/favicon"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"

import { BrandRankingItem, TopPromptItem, CitationRankingItem, ClientCitationItem } from "@/lib/store"
import { ArrowUp01Icon, ArrowDown01Icon as ArrowDownIcon, MinusSignIcon } from "@hugeicons/core-free-icons"

const TrendIndicator = ({ value, isRank = false, suffix = "" }: { value?: number | null, isRank?: boolean, suffix?: string }) => {
  if (value === undefined || value === null || value === 0) {
    return (
      <span className="inline-flex items-center text-muted-foreground/40 ml-1">
        <HugeiconsIcon icon={MinusSignIcon} size={12} strokeWidth={3} />
      </span>
    );
  }

  // For rank, positive change (previous - current) means rank improved (it decreased)
  // But our backend sends (prevRank - currentRank), so if prev was 5 and current is 2, value is 3 (Improved).
  // If value is positive -> Improved (Up arrow)
  // If value is negative -> Declined (Down arrow)

  const isImproved = isRank ? value > 0 : value > 0;
  const absValue = Math.abs(value);

  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-[0.7rem] font-bold ml-2 px-1 rounded animate-in fade-in zoom-in duration-300",
      isImproved ? "text-emerald-500" : "text-rose-500"
    )}>
      <HugeiconsIcon
        icon={isImproved ? ArrowUp01Icon : ArrowDownIcon}
        size={10}
        strokeWidth={4}
      />
      {absValue}{suffix}
    </span>
  );
};

export function DataTable({
  brandRanking,
  topPrompts,
  citationRanking,
  clientCitations
}: {
  brandRanking: BrandRankingItem[],
  topPrompts: TopPromptItem[],
  citationRanking: CitationRankingItem[],
  clientCitations: ClientCitationItem[]
}) {
  const [activeTab, setActiveTab] = React.useState("brandRanking")

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full flex-col justify-start gap-1"
    >
      <div className="flex items-center justify-between mt-8 pb-4">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select
          value={activeTab}
          onValueChange={(val: string | null) => {
            if (val !== null) setActiveTab(val)
          }}
        >
          <SelectTrigger
            className="flex w-64 h-10! flex-row items-center justify-between px-4 text-sm"
            size="default"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="brandRanking">Brand Ranking</SelectItem>
              <SelectItem value="topPrompts">Top Prompts</SelectItem>
              <SelectItem value="citationsRank">Citations Rank</SelectItem>
              <SelectItem value="brandCitations">Your Brands Citations Rank</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          {/* 
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="default" className="h-10! px-4" />}
            >
              <HugeiconsIcon icon={LeftToRightListBulletIcon} strokeWidth={2} data-icon="inline-start" />
              Columns
              <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuCheckboxItem checked>Mentions</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>Share of Voice</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>Brand Coverage</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="default" className="h-10! px-4">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            <span className="hidden lg:inline">Add Section</span>
          </Button>
          */}
        </div>
      </div>

      <TabsContent
        value="brandRanking"
        className="relative flex flex-col gap-4 overflow-auto"
      >
        <div className="overflow-hidden rounded-lg border max-h-[400px] overflow-y-auto scroller-subtle">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                <TableHead>Brand Name</TableHead>
                <TableHead className="text-right">Mentions</TableHead>
                <TableHead className="text-right">Share of Voice (%)</TableHead>
                <TableHead className="text-right">Brand Coverage (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brandRanking.length > 0 ? (
                brandRanking.map((row, idx) => (
                  <TableRow key={`${row.brand_name}-${idx}`}>
                    <TableCell className="font-medium max-w-[200px] truncate" title={row.brand_name}>{row.brand_name}</TableCell>
                    <TableCell className="text-right">
                      {row.total_mentions.toLocaleString()}
                      <TrendIndicator value={row.mentions_trend} />
                    </TableCell>
                    <TableCell className="text-right">
                      {row.sov_percentage}%
                      <TrendIndicator value={row.sov_trend} suffix="%" />
                    </TableCell>
                    <TableCell className="text-right">
                      {row.brand_coverage}%
                      <TrendIndicator value={row.coverage_trend} suffix="%" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">No data found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent
        value="topPrompts"
        className="relative flex flex-col gap-4 overflow-auto"
      >
        <div className="overflow-hidden rounded-lg border max-h-[400px] overflow-y-auto scroller-subtle">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                <TableHead className="w-16 text-center">Rank</TableHead>
                <TableHead>Prompt / Query</TableHead>
                <TableHead className="text-right">Number of Runs</TableHead>
                <TableHead className="text-right">Dominance (%)</TableHead>
                <TableHead className="text-right">Occurrence (%)</TableHead>
                <TableHead className="text-right">Conv. Prob (%)</TableHead>
                <TableHead className="min-w-[200px]">Text Snippet</TableHead>
                <TableHead className="min-w-[200px]">Conv. Reasoning</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topPrompts.length > 0 ? (
                topPrompts.map((row, idx) => (
                  <TableRow key={`${row.rank}-${idx}`}>
                    <TableCell className="text-center font-medium text-muted-foreground">{row.rank}</TableCell>
                    <TableCell className="font-medium max-w-[250px] truncate" title={row.query}>{row.query}</TableCell>
                    <TableCell className="text-right font-semibold text-blue-400">
                      {row.run_count}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.dominance_rate}%
                      <TrendIndicator value={row.dominance_trend} suffix="%" />
                    </TableCell>
                    <TableCell className="text-right">
                      {row.visibility_occurrence_rate}%
                    </TableCell>
                    <TableCell className="text-right">
                      {row.conversion_probability !== null ? `${row.conversion_probability}%` : "-"}
                      <TrendIndicator value={row.conversion_trend} suffix="%" />
                    </TableCell>
                    <TableCell className="max-w-[400px] truncate text-sm text-muted-foreground italic" title={row.text_snippet || ""}>
                      {row.text_snippet || "Your brand is not mentioned"}
                    </TableCell>
                    <TableCell className="max-w-[400px] truncate text-xs text-muted-foreground" title={row.conversion_reasoning || ""}>
                      {row.conversion_reasoning || "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">No data found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent
        value="citationsRank"
        className="relative flex flex-col gap-4 overflow-auto"
      >
        <div className="overflow-hidden rounded-lg border max-h-[400px] overflow-y-auto scroller-subtle">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                <TableHead className="w-16 text-center">Rank</TableHead>
                <TableHead>Citation URL</TableHead>
                <TableHead className="text-right">Citation Share (%)</TableHead>
                <TableHead className="text-right">Number of citation mentioned in total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {citationRanking.length > 0 ? (
                citationRanking.map((row, idx) => (
                  <TableRow key={`${row.rank}-${idx}`}>
                    <TableCell className="text-center font-medium text-muted-foreground">
                      <div className="flex flex-col items-center">
                        {row.rank}
                        <TrendIndicator value={row.rank_change} isRank={true} />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-blue-500 hover:underline cursor-pointer max-w-[400px] truncate" title={row.url}>
                      <div className="flex items-center gap-3">
                        <div className="flex size-6 items-center justify-center shrink-0 rounded bg-muted/20 overflow-hidden border border-white/5">
                          <img
                            src={getWebsiteIcon(row.url, 48)}
                            alt=""
                            className="size-4 object-contain px-[1px]"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent) {
                                const iconContainer = document.createElement('div');
                                iconContainer.className = 'text-muted-foreground/40';
                                iconContainer.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
                                parent.appendChild(iconContainer);
                              }
                            }}
                          />
                        </div>
                        <a href={row.url} target="_blank" rel="noopener noreferrer" className="truncate">{row.url}</a>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{row.citation_share}%</TableCell>
                    <TableCell className="text-right">
                      {row.total_mentions}
                      <TrendIndicator value={row.mentions_trend} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">No data found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent
        value="brandCitations"
        className="relative flex flex-col gap-4 overflow-auto"
      >
        <div className="overflow-hidden rounded-lg border max-h-[400px] overflow-y-auto scroller-subtle">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                <TableHead className="w-16 text-center">Rank</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="text-right">Number of citation mentioned in total</TableHead>
                <TableHead className="min-w-[300px]">Text Snippet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientCitations.length > 0 ? (
                clientCitations.map((row, idx) => (
                  <TableRow key={`${row.rank}-${idx}`}>
                    <TableCell className="text-center font-medium text-muted-foreground">
                      <div className="flex flex-col items-center">
                        {row.rank}
                        <TrendIndicator value={row.rank_change} isRank={true} />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-blue-500 hover:underline cursor-pointer max-w-[400px] truncate" title={row.url}>
                      <div className="flex items-center gap-3">
                        <div className="flex size-6 items-center justify-center shrink-0 rounded bg-muted/20 overflow-hidden border border-white/5">
                          <img
                            src={getWebsiteIcon(row.url, 48)}
                            alt=""
                            className="size-4 object-contain px-[1px]"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent) {
                                const iconContainer = document.createElement('div');
                                iconContainer.className = 'text-muted-foreground/40';
                                iconContainer.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
                                parent.appendChild(iconContainer);
                              }
                            }}
                          />
                        </div>
                        <a href={row.url} target="_blank" rel="noopener noreferrer" className="truncate">{row.url}</a>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{row.total_mentions}</TableCell>
                    <TableCell className="max-w-[500px] truncate text-sm text-muted-foreground italic" title={row.text_snippet || ""}>
                      {row.text_snippet || "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No owned-media citations yet (no rows where is_client_url = true).
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  )
}
