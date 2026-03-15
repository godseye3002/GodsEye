"use client"

import * as React from "react"
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine,
    Label,
    Legend
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Box, Typography } from "@mui/joy"
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface ShivaGraphData {
    competitor: string;
    win_count: number;
    avg_steal_pct: number;
    capture_score: number;
    isClient: boolean;
}

interface ShivaGraphProps {
    data: ShivaGraphData[];
    isLoading: boolean;
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload as ShivaGraphData;
        return (
            <Box
                sx={{
                    backgroundColor: 'rgba(13, 15, 20, 0.95)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    p: 2,
                    borderRadius: '8px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    maxWidth: '350px'
                }}
            >
                <Typography level="title-sm" sx={{ color: data.isClient ? '#F3C95B' : '#fff', mb: 1, fontWeight: 600 }}>
                    {data.competitor} {data.isClient && '(Your Brand)'}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography level="body-xs" sx={{ color: '#A2A7B4' }}>Win Frequency (Queries):</Typography>
                    <Typography level="body-xs" sx={{ color: '#fff', fontWeight: 600 }}>
                        {data.win_count}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography level="body-xs" sx={{ color: '#A2A7B4' }}>Avg Steal %:</Typography>
                    <Typography level="body-xs" sx={{ color: '#F35B64', fontWeight: 600 }}>
                        {data.avg_steal_pct}%
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Typography level="body-xs" sx={{ color: '#A2A7B4' }}>Capture Score:</Typography>
                    <Typography level="body-xs" sx={{ color: '#8b5cf6', fontWeight: 600 }}>
                        {data.capture_score}
                    </Typography>
                </Box>
            </Box>
        );
    }
    return null;
};

export function ShivaGraph({ data, isLoading }: ShivaGraphProps) {
    if (isLoading) {
        return (
            <Card className="w-full bg-[#0D0F14] border-[#1f2937] mb-6">
                <CardContent className="h-[400px] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <div className="w-8 h-8 rounded-full border-4 border-t-[#8b5cf6] border-r-transparent border-b-[#8b5cf6] animate-spin" />
                        <p>Loading The Matrix data...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data || data.length === 0 || data.length === 1 && data[0].isClient) {
        // Handle no competitor data case
        return (
            <Card className="w-full bg-[#0D0F14] border-[#1f2937] border-dashed mb-6">
                <CardContent className="h-[300px] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground/60 text-center">
                        <InfoOutlinedIcon sx={{ color: '#6c757d', fontSize: 32, mb: 1, opacity: 0.5 }} />
                        <p className="text-[#A2A7B4] font-medium">No conversion steal data to analyze.</p>
                        <p className="text-sm text-[#A2A7B4]/60 max-w-sm">No competitors are currently stealing your conversions in the scanned queries.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Determine Quadrant Dividers
    // For Y (Steal %), max is 100. We can set it dynamically based on max value or force fixed at median/mean
    // For X (Win Frequency), dynamic based on max wins
    const validCompetitors = data.filter(d => !d.isClient);

    // Default fallback if logic fails
    let maxX = 10;
    let maxY = 100;

    if (validCompetitors.length > 0) {
        maxX = Math.max(...data.map(d => d.win_count));
    }

    // Round to slightly higher for better boundary display
    const domainMaxX = Math.ceil(maxX * 1.1) > 1 ? Math.ceil(maxX * 1.1) : 2;

    // Set fixed dividing lines - median of X and 50% for Y is a good matrix split
    const midX = domainMaxX / 2;
    const midY = 50;

    // Minimum bubble size and range - Reduced for cleaner look
    const maxZ = Math.max(...data.map(d => d.capture_score));
    const zRange = [30, 400]; // areas reduced from [80, 1000]

    // Professional deterministic jitter based on string hash
    // This prevents dots from moving on every render while still separating them
    const getHash = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    };

    const jitterAmountX = Math.max(0.05, domainMaxX * 0.02);
    const jitterAmountY = 2;

    // Smart jitter: Only apply if there's a collision at the exact same coordinates
    const coordinateCounts: Record<string, number> = {};

    const processedData = data.map(d => {
        const coordKey = `${d.win_count}-${d.avg_steal_pct}`;
        const indexAtCoord = coordinateCounts[coordKey] || 0;
        coordinateCounts[coordKey] = indexAtCoord + 1;

        // If it's the first time we see these coordinates, no jitter
        if (indexAtCoord === 0) {
            return { ...d, jitterX: d.win_count, jitterY: d.avg_steal_pct };
        }

        // Only offset subsequent items at the same spot using deterministic seeds
        const hash = getHash(d.competitor + indexAtCoord);
        const seedX = ((hash % 100) / 100) - 0.5;
        const seedY = (((hash >> 8) % 100) / 100) - 0.5;

        return {
            ...d,
            jitterX: Math.max(0, d.win_count + seedX * jitterAmountX),
            jitterY: Math.max(0, Math.min(100, d.avg_steal_pct + seedY * jitterAmountY))
        };
    });

    const clientData = processedData.filter(d => d.isClient);
    const competitorData = processedData.filter(d => !d.isClient);

    // Optimized professional diamond shape for client
    const renderDiamond = (props: any) => {
        const { cx, cy, fill } = props;
        return (
            <path
                d={`M${cx},${cy - 10} L${cx + 10},${cy} L${cx},${cy + 10} L${cx - 10},${cy} Z`}
                fill={fill}
                stroke="#fff"
                strokeWidth={2}
                style={{ filter: 'drop-shadow(0 0 4px rgba(243, 201, 91, 0.6))' }}
            />
        );
    };

    return (
        <Card className="@container/card flex flex-col">
            <CardHeader className="px-4 lg:px-6">
                <div className="flex flex-col gap-1">
                    <CardTitle>Conversion Capture Matrix: Threat Levels</CardTitle>
                    <CardDescription>
                        Evaluate competitors by conversion impact vs. win frequency.
                        Larger bubbles indicate higher total threat to your revenue potential.
                    </CardDescription>
                </div>
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                            sx={{
                                width: 10,
                                height: 10,
                                backgroundColor: '#F3C95B',
                                transform: 'rotate(45deg)',
                                border: '1px solid #fff'
                            }}
                        />
                        <Typography level="body-xs" sx={{ color: 'hsl(var(--muted-foreground))' }}>Your Brand</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, backgroundColor: '#F35B64', borderRadius: '2px' }} />
                        <Typography level="body-xs" sx={{ color: 'hsl(var(--muted-foreground))' }}>High Threat</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, backgroundColor: '#4b5563', borderRadius: '2px' }} />
                        <Typography level="body-xs" sx={{ color: 'hsl(var(--muted-foreground))' }}>Low Threat</Typography>
                    </Box>
                </Box>
            </CardHeader>
            <CardContent>
                <div className="h-[500px] w-full mt-4 relative">
                    {/* Quadrant background Labels - Rendered as absolute elements over the chart area */}
                    <div className="absolute inset-0 pointer-events-none flex" style={{ padding: '20px 20px 30px 60px' }}>
                        <div className="absolute top-[8%] left-[10%] opacity-30 pointer-events-none">
                            <span className="text-base font-bold text-gray-400">SNIPE NOW</span>
                            <div className="text-xs text-gray-500">Low Freq / High Steal</div>
                        </div>
                        <div className="absolute top-[8%] right-[10%] opacity-30 pointer-events-none text-right">
                            <span className="text-base font-bold text-[#F35B64]">DESTROY FIRST</span>
                            <div className="text-xs text-red-500/70">High Freq / High Steal</div>
                        </div>
                        <div className="absolute bottom-[10%] left-[10%] opacity-30 pointer-events-none">
                            <span className="text-base font-bold text-gray-500">IGNORE</span>
                            <div className="text-xs text-gray-600">Background Noise</div>
                        </div>
                        <div className="absolute bottom-[10%] right-[10%] opacity-30 pointer-events-none text-right">
                            <span className="text-base font-bold text-yellow-500/70">MONITOR</span>
                            <div className="text-xs text-yellow-600/70">High Freq / Low Steal</div>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                type="number"
                                dataKey="jitterX"
                                name="Win Frequency"
                                tick={{ fill: '#A2A7B4', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                                domain={[0, domainMaxX]}
                                label={{ value: 'Win Frequency (Enemy Appearances)', position: 'insideBottom', offset: -10, fill: '#A2A7B4' }}
                            />
                            <YAxis
                                type="number"
                                dataKey="jitterY"
                                name="Avg Steal %"
                                tickFormatter={(val) => `${val}%`}
                                tick={{ fill: '#A2A7B4', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                                domain={[0, 100]}
                                ticks={[0, 25, 50, 75, 100]}
                                label={{ value: 'Avg Conversion Steal %', angle: -90, position: 'insideLeft', fill: '#A2A7B4', dx: -10 }}
                            />
                            <ZAxis type="number" dataKey="capture_score" range={zRange} name="Capture Score" />

                            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }} />

                            {/* Matrix dividers */}
                            <ReferenceLine x={midX} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
                            <ReferenceLine y={midY} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />

                            <Scatter name="Competitors" data={competitorData}>
                                {competitorData.map((entry, index) => {
                                    // Color intensity based on 'danger zone'
                                    let fill = '#4b5563'; // Gray base
                                    if (entry.avg_steal_pct > midY && entry.win_count > midX) {
                                        fill = '#ef4444'; // Red (Destroy First)
                                    } else if (entry.avg_steal_pct > midY) {
                                        fill = '#f97316'; // Orange (Snipe Now)
                                    } else if (entry.win_count > midX) {
                                        fill = '#eab308'; // Yellow (Monitor)
                                    }

                                    return (
                                        <Cell key={`cell-${index}`} fill={fill} opacity={0.8} />
                                    );
                                })}
                            </Scatter>

                            <Scatter name="Client" data={clientData} fill="#F3C95B" opacity={1} shape={renderDiamond} />

                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
