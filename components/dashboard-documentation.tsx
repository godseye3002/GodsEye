"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, Chip, Stack } from "@mui/joy"
import {
    BookOpen02Icon,
    ArrowRight01Icon,
    PieChartIcon,
    MapsIcon,
    Analytics01Icon,
    Shield01Icon,
    Target02Icon,
    DatabaseIcon,
    ArrowDown01Icon
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

export function DashboardDocumentation() {
    return (
        <Card className="@container/card flex flex-col mb-8 border-[#2ED47A]/30 bg-[#0D0F14] shadow-[0_4px_20px_rgba(46,212,122,0.05)]">
            <CardHeader className="px-4 lg:px-6 border-b border-white/5 pb-6">
                <div className="flex items-center gap-3">
                    <Box sx={{
                        p: 1.5,
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(46, 212, 122, 0.1) 0%, rgba(46, 212, 122, 0.02) 100%)',
                        border: '1px solid rgba(46, 212, 122, 0.2)'
                    }}>
                        <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={2} className="text-[#2ED47A]" />
                    </Box>
                    <div className="flex flex-col gap-1">
                        <CardTitle className="text-2xl font-bold text-white">Understand Your Dashboard</CardTitle>
                        <CardDescription className="text-[#A2A7B4]">
                            A simple guide to what the numbers, graphs, and tables are telling you about your brand's presence in AI answers.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="flex flex-col gap-10">
                    {/* The Story Section */}
                    <Box>
                        <Typography level="title-lg" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HugeiconsIcon icon={Analytics01Icon} strokeWidth={2} className="size-5 text-[#8b5cf6]" />
                            The Strategic Story
                        </Typography>
                        <Typography level="body-md" sx={{ color: '#A2A7B4', lineHeight: 1.7 }}>
                            Your dashboard is a <span className="font-bold text-white">Battle Map</span> for AI visibility. It tracks how AI engines (Perplexity, ChatGPT, Google) interpret your brand's value.
                            The data answers three critical questions:
                            <span style={{ color: '#fff', fontWeight: 600 }}> "Are we visible?"</span>,
                            <span style={{ color: '#fff', fontWeight: 600 }}> "Are we trusted?"</span>, and
                            <span style={{ color: '#2ED47A', fontWeight: 600 }}> "Are we winning the sale?"</span>
                        </Typography>
                    </Box>

                    {/* Core Metrics Section */}
                    <Box>
                        <Typography level="title-md" sx={{ color: 'white', mb: 3, opacity: 0.8 }}>
                            Core Success Metrics
                        </Typography>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Metric 1: Brand Coverage */}
                            <Card className="bg-[#161922] border-none shadow-none p-5">
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                    <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'rgba(46, 212, 122, 0.1)' }}>
                                        <HugeiconsIcon icon={MapsIcon} strokeWidth={2} className="size-5 text-[#2ED47A]" />
                                    </Box>
                                    <Typography level="title-md" sx={{ color: 'white' }}>Brand Coverage</Typography>
                                </Stack>
                                <Typography level="body-sm" sx={{ color: '#A2A7B4', mb: 2 }}>
                                    The percentage of <span style={{ color: '#fff' }}>analyzed queries showing your brand</span>. This represents your current snapshot coverage in the AI's mind.
                                </Typography>
                                <Chip size="sm" variant="soft" color="neutral" sx={{ color: '#2ED47A', fontWeight: 600 }}>
                                    Story: Top-of-Mind Presence
                                </Chip>
                            </Card>

                            {/* Metric 2: Mentions */}
                            <Card className="bg-[#161922] border-none shadow-none p-5">
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                    <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'rgba(139, 92, 246, 0.1)' }}>
                                        <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={2} className="size-5 text-[#8b5cf6]" />
                                    </Box>
                                    <Typography level="title-md" sx={{ color: 'white' }}>Mentions</Typography>
                                </Stack>
                                <Typography level="body-sm" sx={{ color: '#A2A7B4', mb: 2 }}>
                                    The <span style={{ color: '#fff' }}>total brand references found</span>, aggregated across all queries. This shows the raw volume of how often the AI talks about you.
                                </Typography>
                                <Chip size="sm" variant="soft" color="neutral" sx={{ color: '#8b5cf6', fontWeight: 600 }}>
                                    Story: Market Loudness
                                </Chip>
                            </Card>

                            {/* Metric 3: Visibility Rate */}
                            <Card className="bg-[#161922] border-none shadow-none p-5">
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                    <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'rgba(6, 182, 212, 0.1)' }}>
                                        <HugeiconsIcon icon={Target02Icon} strokeWidth={2} className="size-5 text-[#06b6d4]" />
                                    </Box>
                                    <Typography level="title-md" sx={{ color: 'white' }}>Visibility Rate</Typography>
                                </Stack>
                                <Typography level="body-sm" sx={{ color: '#A2A7B4', mb: 2 }}>
                                    Your <span style={{ color: '#fff' }}>semantic alignment score</span>. It measures how relevant your brand is mapped to the underlying user intent.
                                </Typography>
                                <Chip size="sm" variant="soft" color="neutral" sx={{ color: '#06b6d4', fontWeight: 600 }}>
                                    Story: Relevance & Intent
                                </Chip>
                            </Card>

                            {/* Metric 4: Avg. Dominance Rate */}
                            <Card className="bg-[#161922] border-none shadow-none p-5">
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                    <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'rgba(232, 140, 48, 0.1)' }}>
                                        <HugeiconsIcon icon={PieChartIcon} strokeWidth={2} className="size-5 text-[#e88c30]" />
                                    </Box>
                                    <Typography level="title-md" sx={{ color: 'white' }}>Avg. Dominance Rate</Typography>
                                </Stack>
                                <Typography level="body-sm" sx={{ color: '#A2A7B4', mb: 2 }}>
                                    Your <span style={{ color: '#fff' }}>dominance in search results</span> compared to the relative frequency of all competitors combined.
                                </Typography>
                                <Chip size="sm" variant="soft" color="neutral" sx={{ color: '#e88c30', fontWeight: 600 }}>
                                    Story: Competitive Lead
                                </Chip>
                            </Card>

                            {/* Metric 5: Avg. Conv. Prob. */}
                            <Card className="bg-[#161922] border-none shadow-none p-5">
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                    <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'rgba(243, 201, 91, 0.1)' }}>
                                        <HugeiconsIcon icon={Analytics01Icon} strokeWidth={2} className="size-5 text-[#F3C95B]" />
                                    </Box>
                                    <Typography level="title-md" sx={{ color: 'white' }}>Avg. Conv. Prob.</Typography>
                                </Stack>
                                <Typography level="body-sm" sx={{ color: '#A2A7B4', mb: 2 }}>
                                    Your overall <span style={{ color: '#fff' }}>conversion probability</span>. This is the predicted purchase intent score from the AI's recommendations.
                                </Typography>
                                <Chip size="sm" variant="soft" color="neutral" sx={{ color: '#F3C95B', fontWeight: 600 }}>
                                    Story: Revenue Impact
                                </Chip>
                            </Card>

                            {/* Metric 6: Citation Score */}
                            <Card className="bg-[#161922] border-none shadow-none p-5">
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                    <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'rgba(46, 184, 138, 0.1)' }}>
                                        <HugeiconsIcon icon={DatabaseIcon} strokeWidth={2} className="size-5 text-[#2eb88a]" />
                                    </Box>
                                    <Typography level="title-md" sx={{ color: 'white' }}>Citation Score</Typography>
                                </Stack>
                                <Typography level="body-sm" sx={{ color: '#A2A7B4', mb: 2 }}>
                                    The <span style={{ color: '#fff' }}>total citations found</span> for your brand across all trusted source analysis. The holy grail of AI trust.
                                </Typography>
                                <Chip size="sm" variant="soft" color="neutral" sx={{ color: '#2eb88a', fontWeight: 600 }}>
                                    Story: Proven Truth
                                </Chip>
                            </Card>
                        </div>
                    </Box>

                    {/* The Visuals Section */}
                    <Box>
                        <Typography level="title-lg" sx={{ color: 'white', mb: 4, fontSize: '1.5rem' }}>
                            Mastering the Matrices
                        </Typography>

                        <div className="flex flex-col gap-6">
                            <Box sx={{ p: 4, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <Typography level="h4" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    🛡️ Protection Matrix: Owned Positions
                                </Typography>
                                <Typography level="body-lg" sx={{ color: '#A2A7B4', mb: 3 }}>
                                    This chart identifies where you are currently winning and needs to be protected.
                                </Typography>
                                <ul className="list-disc pl-6 space-y-3 text-[16px] text-[#A2A7B4]">
                                    <li>
                                        <span className="text-[#2ED47A] font-semibold text-white">Green Bars (Cited):</span>
                                        The Gold Standard. AI gave your brand name AND provided a direct link to your site.
                                    </li>
                                    <li>
                                        <span className="text-[#FFD166] font-semibold text-white">Yellow Bars (Mentioned):</span>
                                        The AI knows you but didn't link to you. You are visible but not yet "verified" by a citation.
                                    </li>
                                    <li>
                                        <span className="text-[#8b5cf6] font-semibold text-white">The Purple Line:</span>
                                        How much conversion power you have for that specific query. High bars with low lines mean you are popular but not persuasive.
                                    </li>
                                    <li>
                                        <span className="text-[#F35B64] font-bold text-white">The Red Arrow (▼):</span>
                                        <span className="font-bold text-white">CRITICAL ALERT.</span> Your dominance on this topic has dropped since the last scan. Competitors are likely outmaneuvering you here.
                                    </li>
                                </ul>
                            </Box>

                            <Box sx={{ p: 4, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <Typography level="h4" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    🎯 Threat Levels Matrix
                                </Typography>
                                <Typography level="body-lg" sx={{ color: '#A2A7B4', mb: 3 }}>
                                    A competitive landscape showing who is stealing your customers.
                                </Typography>
                                <ul className="list-disc pl-6 space-y-3 text-[16px] text-[#A2A7B4]">
                                    <li>
                                        <span className="text-[#ef4444] font-bold text-white uppercase">DESTROY FIRST:</span>
                                        <span className="text-white">High Frequency / High Steal.</span> These are your biggest threats. They appear often and are very good at stealing your customers. Focus your primary resources here.
                                    </li>
                                    <li>
                                        <span className="text-[#f97316] font-bold text-white uppercase">SNIPE NOW:</span>
                                        <span className="text-white">Low Frequency / High Steal.</span> Competitors who appear rarely but are highly persuasive. These are vulnerable targets—if you improve your presence, you can easily "snipe" their share.
                                    </li>
                                    <li>
                                        <span className="text-[#eab308] font-bold text-white uppercase">MONITOR:</span>
                                        <span className="text-white">High Frequency / Low Steal.</span> These brands are highly visible but not very persuasive yet. Keep an eye on them; if their conversion rate increases, they move to "Destroy First."
                                    </li>
                                    <li>
                                        <span className="text-[#6b7280] font-bold text-white uppercase">IGNORE:</span>
                                        <span className="text-white">Low Frequency / Low Steal.</span> Background noise. These brands rarely show up and rarely win conversions. Do not waste energy competing with them.
                                    </li>
                                    <li>
                                        <span className="text-white font-medium">Bubble Size:</span>
                                        The bigger the bubble, the higher the <span className="font-bold text-white">Capture Score</span> (a single number from 0-100 representing the total threat to your revenue).
                                    </li>
                                </ul>
                            </Box>

                            <Box sx={{ p: 4, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <Typography level="h4" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    📊 Data Insight Tables
                                </Typography>
                                <Typography level="body-lg" sx={{ color: '#A2A7B4', mb: 3 }}>
                                    The raw proof behind the matrices.
                                </Typography>
                                <ul className="list-disc pl-6 space-y-3 text-[16px] text-[#A2A7B4]">
                                    <li>
                                        <span className="text-white font-medium">Top Prompts:</span>
                                        Reveals the <span className="font-bold text-white">exact questions</span> users are asking and the <span className="font-bold text-white">AI's internal reasoning</span> for why it recommended (or rejected) your brand.
                                    </li>
                                    <li>
                                        <span className="text-white font-medium">Citations Rank:</span>
                                        A list of high-authority websites the AI "trusts." If you want more Green Bars in the Protection Matrix, you must get mentioned on these specific sites.
                                    </li>
                                    <li>
                                        <span className="text-white font-medium">Your Brand Citations Rank:</span>
                                        The specific scoreboard for URLs that are <span className="font-bold text-white">already linking to your brand</span>. It shows which specific pages are your strongest supporters in the eyes of the AI.
                                    </li>
                                    <li>
                                        <span className="text-white font-medium">Brand Ranking:</span>
                                        The high-level scoreboard of total Share of Voice across your entire project.
                                    </li>
                                </ul>
                            </Box>
                        </div>
                    </Box>
                </div>
            </CardContent>
        </Card>
    )
}
