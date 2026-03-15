"use client"

import * as React from "react"
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { BrandCoverageGraphPoint, BrandInfo } from "@/lib/store"

// Generate colors for brands dynamically
const BRAND_COLORS = [
  "#2ED47A", // Vibrant Emerald
  "#2eb88a",
  "#e88c30",
  "#e54666",
  "#8b5cf6",
  "#06b6d4",
  "#f59e0b",
  "#ec4899",
]

interface ChartAreaInteractiveProps {
  data: (BrandCoverageGraphPoint | any)[]
  brands: BrandInfo[]
}

export function ChartAreaInteractive({ data, brands }: ChartAreaInteractiveProps) {
  const [timeRange, setTimeRange] = React.useState("7d")
  const [brandFilterMode, setBrandFilterMode] = React.useState<"top" | "all">("top")
  const isHistoricalTrendMode = !brands || brands.length === 0

  // Calculate top 5 competitor brands based on the latest data point (today)
  const top5Competitors = React.useMemo(() => {
    if (!data || !brands || data.length === 0) return new Set<string>()

    const latestPoint = data[data.length - 1] // Today's data

    const competitorScores = brands
      .filter(b => !b.isClient)
      .map(b => ({
        key: b.key,
        score: typeof latestPoint[b.key] === 'number' ? latestPoint[b.key] as number : 0
      }))
      .sort((a, b) => b.score - a.score)

    return new Set(competitorScores.slice(0, 5).map(b => b.key))
  }, [data, brands])


  // Debug logging
  React.useEffect(() => {
    console.log('[ChartAreaInteractive] Props:', {
      dataLength: data?.length,
      brandsLength: brands?.length,
      firstDataItem: data?.[0],
      firstBrand: brands?.[0],
    })
  }, [data, brands])

  // Initialize active brands state based on available brands
  const [activeBrands, setActiveBrands] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    brands.forEach((brand, index) => {
      if (brandFilterMode === "top") {
        // In top mode, default to true if it's the client or in top 5 competitors
        initial[brand.key] = top5Competitors.has(brand.key) || !!brand.isClient
      } else {
        // Prioritize client brand, otherwise default to first 6
        initial[brand.key] = !!brand.isClient || index < 6
      }
    })
    return initial
  })

  // Handle mode switches
  React.useEffect(() => {
    if (brandFilterMode === "top") {
      setActiveBrands(prev => {
        const updated = { ...prev }
        brands.forEach(brand => {
          updated[brand.key] = top5Competitors.has(brand.key) || !!brand.isClient
        })
        return updated
      })
    }
  }, [brandFilterMode, top5Competitors, brands])

  // Update active brands when brands list changes
  React.useEffect(() => {
    setActiveBrands(prev => {
      const updated: Record<string, boolean> = {}
      brands.forEach((brand, index) => {
        // Preserve existing selection or default to client/first 4
        updated[brand.key] = prev[brand.key] !== undefined ? prev[brand.key] : (brand.isClient || index < 4)
      })
      return updated
    })
  }, [brands])

  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return []

    // Find the most recent date in the data to use as reference
    // This ensures we show the most recent analyses regardless of when they were done
    const dates = data.map(d => new Date(d.date).getTime())
    const maxDate = Math.max(...dates)
    const referenceDate = new Date(maxDate)

    let daysToSubtract = 90
    if (timeRange === "30d") daysToSubtract = 30
    else if (timeRange === "7d") daysToSubtract = 7

    const startDate = new Date(referenceDate)
    startDate.setDate(referenceDate.getDate() - daysToSubtract)

    return data.filter((item) => {
      const date = new Date(item.date)
      return date >= startDate
    })
  }, [data, timeRange])

  // Generate chart config dynamically based on brands
  const chartConfig = React.useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {}
    if (isHistoricalTrendMode) {
      config["brand_coverage"] = { label: "Brand Coverage", color: "#2ED47A" }
      config["avg_dominance_rate"] = { label: "Avg Dominance Rate", color: "#2eb88a" }
      config["avg_conversion_probability"] = { label: "Avg Conversion Probability", color: "#e88c30" }
    } else {
      brands.forEach((brand, index) => {
        config[brand.key] = {
          label: brand.name,
          color: BRAND_COLORS[index % BRAND_COLORS.length],
        }
      })
    }
    return config
  }, [brands, isHistoricalTrendMode])

  return (
    <Card className="@container/card flex flex-col">
      <CardHeader className="px-4 lg:px-6">
        <div className="flex flex-col gap-1">
          <CardTitle>Brand Analysis</CardTitle>
          <CardDescription>
            {isHistoricalTrendMode
              ? "Brand visibility and conversion potential over time (%)"
              : "Competitor Share of Voice over time (%)"}
          </CardDescription>
        </div>
        <CardAction className="flex items-center gap-3">
          {!isHistoricalTrendMode && (
            <Select
              value={brandFilterMode}
              onValueChange={(val) => setBrandFilterMode(val as "top" | "all")}
            >
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Display Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top">Top Brands</SelectItem>
                <SelectItem value="all">All Brands</SelectItem>
              </SelectContent>
            </Select>
          )}
          <ToggleGroup
            multiple={false}
            value={timeRange ? [timeRange] : []}
            onValueChange={(value) => {
              setTimeRange(value[0] ?? "90d")
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0 pt-4 sm:pt-6 flex-1">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[350px] w-full"
        >
          <LineChart data={filteredData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(val) => `${val}%`}
              domain={[0, 100]}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            {isHistoricalTrendMode ? (
              <>
                <Line
                  key="brand_coverage"
                  dataKey="brand_coverage"
                  type="monotone"
                  stroke="#2ED47A"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                  name="Brand Coverage"
                  connectNulls
                />
                <Line
                  key="avg_dominance_rate"
                  dataKey="avg_dominance_rate"
                  type="monotone"
                  stroke="#2eb88a"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                  name="Avg Dominance Rate"
                  connectNulls
                />
                <Line
                  key="avg_conversion_probability"
                  dataKey="avg_conversion_probability"
                  type="monotone"
                  stroke="#e88c30"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                  name="Avg Conversion Probability"
                  connectNulls
                />
              </>
            ) : (
              brands.map((brand, index) => (
                activeBrands[brand.key] && (
                  <Line
                    key={brand.key}
                    dataKey={brand.key}
                    type="monotone"
                    stroke={BRAND_COLORS[index % BRAND_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    name={brand.name}
                  />
                )
              ))
            )}
          </LineChart>
        </ChartContainer>
      </CardContent>
      {!isHistoricalTrendMode && (
        <CardFooter className="px-4 py-4 lg:px-6 flex flex-col items-center justify-center border-t">
          {/* Client Brand (Always visible, bolded, separated) */}
          <div className="flex flex-wrap items-center justify-center w-full mb-3 pb-3 border-b">
            {brands
              .filter(brand => brand.isClient)
              .map((brand) => (
                <div key={brand.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brand-${brand.key}`}
                    checked={activeBrands[brand.key] || false}
                    onCheckedChange={(checked) => setActiveBrands(prev => ({ ...prev, [brand.key]: !!checked }))}
                  />
                  <Label htmlFor={`brand-${brand.key}`} className="text-sm font-bold leading-none cursor-pointer flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: BRAND_COLORS[brands.indexOf(brand) % BRAND_COLORS.length] }}></span>
                    {brand.name} (You)
                  </Label>
                </div>
              ))}
          </div>

          {/* Competitor Brands */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {brands
              .filter(brand => !brand.isClient && (brandFilterMode === "all" || top5Competitors.has(brand.key)))
              .map((brand) => (
                <div key={brand.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brand-${brand.key}`}
                    checked={activeBrands[brand.key] || false}
                    onCheckedChange={(checked) => setActiveBrands(prev => ({ ...prev, [brand.key]: !!checked }))}
                  />
                  <Label htmlFor={`brand-${brand.key}`} className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2 text-muted-foreground">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: BRAND_COLORS[brands.indexOf(brand) % BRAND_COLORS.length] }}></span>
                    {brand.name}
                  </Label>
                </div>
              ))}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
