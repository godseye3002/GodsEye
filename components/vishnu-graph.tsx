"use client"

import * as React from "react"
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    LabelList
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Box, Typography } from "@mui/joy"
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface VishnuGraphData {
    queryText: string;
    dominance_rate: number;
    dominance_delta: number;
    conversion_probability: number;
    citation_status: string;
    sov_score: number;
    mention_count: number;
    text_snippet: string;
}

interface VishnuGraphProps {
    data: VishnuGraphData[];
    isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload as VishnuGraphData;
        return (
            <Box
                sx={{
                    backgroundColor: 'rgba(13, 15, 20, 0.95)',
                    border: '1px solid rgba(46, 212, 122, 0.2)',
                    p: 2,
                    borderRadius: '8px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    maxWidth: '350px'
                }}
            >
                <Typography level="title-sm" sx={{ color: '#fff', mb: 1, fontWeight: 600 }}>
                    {label}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography level="body-xs" sx={{ color: '#A2A7B4' }}>Dominance Rate:</Typography>
                    <Typography level="body-xs" sx={{ color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {data.dominance_rate}%
                        {data.dominance_delta < 0 ? (
                            <span style={{ color: '#F35B64' }}>▼ {Math.abs(data.dominance_delta)}%</span>
                        ) : data.dominance_delta > 0 ? (
                            <span style={{ color: '#2ED47A' }}>▲ {data.dominance_delta}%</span>
                        ) : null}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography level="body-xs" sx={{ color: '#A2A7B4' }}>Conversion Prob:</Typography>
                    <Typography level="body-xs" sx={{ color: '#8b5cf6', fontWeight: 600 }}>
                        {data.conversion_probability}%
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography level="body-xs" sx={{ color: '#A2A7B4' }}>Citation Status:</Typography>
                    <Typography level="body-xs" sx={{ color: data.citation_status === 'Cited' ? '#2ED47A' : '#FFD166', fontWeight: 600 }}>
                        {data.citation_status}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography level="body-xs" sx={{ color: '#A2A7B4' }}>SOV / Mentions:</Typography>
                    <Typography level="body-xs" sx={{ color: '#fff', fontWeight: 600 }}>
                        {Math.round(data.sov_score * 100) / 100} / {data.mention_count}
                    </Typography>
                </Box>

                {data.text_snippet && data.text_snippet !== 'No snippet available' && (
                    <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <Typography level="body-xs" sx={{ color: '#A2A7B4', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            "{data.text_snippet}"
                        </Typography>
                    </Box>
                )}
            </Box>
        );
    }

    return null;
};

const renderCustomBarLabel = (props: any) => {
    const { x, y, width, value, index, data } = props;
    const entry = data[index];

    if (entry.dominance_delta < 0) {
        return (
            <text x={x + width / 2} y={y - 8} fill="#F35B64" fontSize="12" textAnchor="middle">
                ▼
            </text>
        );
    }
    return null;
};

export function VishnuGraph({ data, isLoading }: VishnuGraphProps) {
    if (isLoading) {
        return (
            <Card className="w-full bg-[#0D0F14] border-[#1f2937] mb-6">
                <CardContent className="h-[400px] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <div className="w-8 h-8 rounded-full border-4 border-t-[#22c55e] border-r-transparent border-b-[#22c55e] animate-spin" />
                        <p>Loading The Fortress data...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card className="w-full bg-[#0D0F14] border-[#1f2937] border-dashed mb-6">
                <CardContent className="h-[300px] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground/60 text-center">
                        <InfoOutlinedIcon sx={{ color: '#6c757d', fontSize: 32, mb: 1, opacity: 0.5 }} />
                        <p className="text-[#A2A7B4] font-medium">No winning positions found to protect yet.</p>
                        <p className="text-sm text-[#A2A7B4]/60 max-w-sm">Run analyses where your brand is mentioned or cited to populate The Fortress dashboard.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="@container/card flex flex-col">
            <CardHeader className="px-4 lg:px-6">
                <div className="flex flex-col gap-1">
                    <CardTitle>Protection Matrix: Owned Positions</CardTitle>
                    <CardDescription>
                        Maintain and monitor queries where your brand is already dominant.
                        A red indicator (▼) shows if dominance has decreased since the last scan.
                    </CardDescription>
                </div>
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, backgroundColor: '#2ED47A', borderRadius: '2px' }} />
                        <Typography level="body-xs" sx={{ color: 'hsl(var(--muted-foreground))' }}>Cited</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, backgroundColor: '#FFD166', borderRadius: '2px' }} />
                        <Typography level="body-xs" sx={{ color: 'hsl(var(--muted-foreground))' }}>Mentioned</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 2, backgroundColor: '#8b5cf6' }} />
                        <Typography level="body-xs" sx={{ color: 'hsl(var(--muted-foreground))' }}>Conv. Prob.</Typography>
                    </Box>
                </Box>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={data}
                            margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="queryText"
                                tick={{ fill: '#A2A7B4', fontSize: 12 }}
                                tickMargin={10}
                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                tickLine={false}
                            />
                            <YAxis
                                yAxisId="left"
                                type="number"
                                orientation="left"
                                tickFormatter={(val) => `${val}%`}
                                tick={{ fill: '#A2A7B4', fontSize: 12 }}
                                domain={[0, 100]}
                                ticks={[0, 25, 50, 75, 100]}
                                axisLine={false}
                                tickLine={false}
                                label={{ value: 'Dominance Rate', angle: -90, position: 'insideLeft', fill: '#A2A7B4', fontSize: 13, dx: -10 }}
                            />
                            <YAxis
                                yAxisId="right"
                                type="number"
                                orientation="right"
                                tickFormatter={(val) => `${val}%`}
                                tick={{ fill: '#8b5cf6', fontSize: 12 }}
                                domain={[0, 100]}
                                ticks={[0, 25, 50, 75, 100]}
                                axisLine={false}
                                tickLine={false}
                                label={{ value: 'Conversion Prob.', angle: 90, position: 'insideRight', fill: '#8b5cf6', fontSize: 13, dx: 10 }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />

                            <Bar dataKey="dominance_rate" yAxisId="left" radius={[2, 2, 0, 0]} maxBarSize={60}>
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.citation_status === 'Cited' ? '#2ED47A' : '#FFD166'}
                                    />
                                ))}
                                {/* @ts-ignore */}
                                <LabelList dataKey="dominance_rate" content={(props) => renderCustomBarLabel({ ...props, data })} facOffset={-10} />
                            </Bar>

                            <Line
                                type="monotone"
                                dataKey="conversion_probability"
                                stroke="#8b5cf6"
                                yAxisId="right"
                                strokeWidth={2}
                                dot={{ r: 3, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 1 }}
                                activeDot={{ r: 5, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
