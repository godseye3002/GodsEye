"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Box, Typography, Stack, Chip } from "@mui/joy"
import {
    BookOpen02Icon,
    Analytics01Icon,
    Target02Icon,
    ArrowRight01Icon,
    MapsIcon,
    ZapIcon
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

export function ConversionDocumentation() {
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
                        <CardTitle className="text-2xl font-bold text-white">Conversion Dashboard Guide</CardTitle>
                        <CardDescription className="text-[#A2A7B4]">
                            Mastering your Traffic and Conversion metrics to understand how AI users interact with your site.
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
                            The Data Story
                        </Typography>
                        <Typography level="body-md" sx={{ color: '#A2A7B4', lineHeight: 1.7 }}>
                            Your Conversion Dashboard acts as the <span className="font-bold text-white">Bottom of the Funnel</span> tracker. While the Audit Dashboard shows you how often AI engines mention you, this dashboard tells you what actually happens <span className="text-[#2ED47A] font-bold">after the user clicks the link to your website</span>.
                        </Typography>
                    </Box>

                    {/* Global Metrics Section */}
                    <Box>
                        <Typography level="title-md" sx={{ color: 'white', mb: 3, opacity: 0.8 }}>
                            Global Network Metrics
                        </Typography>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Metric 1: Network Conversions */}
                            <Card className="bg-[#161922] border-none shadow-none p-5">
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                    <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'rgba(46, 212, 122, 0.1)' }}>
                                        <HugeiconsIcon icon={ZapIcon} strokeWidth={2} className="size-5 text-[#2ED47A]" />
                                    </Box>
                                    <Typography level="title-md" sx={{ color: 'white' }}>Network Conversions</Typography>
                                </Stack>
                                <Typography level="body-sm" sx={{ color: '#A2A7B4', mb: 2 }}>
                                    Your discovery success number. This counts <span style={{ color: '#fff' }}>every single successful arrival</span> on your website that originated from a tracked AI Engine. It represents the "Handover" from the AI search engine to your domain. 
                                </Typography>
                                <Chip size="sm" variant="soft" color="neutral" sx={{ color: '#2ED47A', fontWeight: 600 }}>
                                    Calculation: Total AI-referral Entry Events
                                </Chip>
                            </Card>

                            {/* Metric 2: Total Reach / Visits */}
                            <Card className="bg-[#161922] border-none shadow-none p-5">
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                    <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'rgba(56, 189, 248, 0.1)' }}>
                                        <HugeiconsIcon icon={Target02Icon} strokeWidth={2} className="size-5 text-[#38BDF8]" />
                                    </Box>
                                    <Typography level="title-md" sx={{ color: 'white' }}>Total Reach (Visits)</Typography>
                                </Stack>
                                <Typography level="body-sm" sx={{ color: '#A2A7B4', mb: 2 }}>
                                    Your total traffic volume. This counts <span style={{ color: '#fff' }}>every single session</span> originating from AI engines, including repeat visits from the same users.
                                </Typography>
                                <Chip size="sm" variant="soft" color="neutral" sx={{ color: '#38BDF8', fontWeight: 600 }}>
                                    Calculation: Total Number of Tracked Sessions
                                </Chip>
                            </Card>

                            {/* Metric 3: Unique Visitors */}
                            <Card className="bg-[#161922] border-none shadow-none p-5">
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                    <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'rgba(124, 108, 250, 0.1)' }}>
                                        <HugeiconsIcon icon={MapsIcon} strokeWidth={2} className="size-5 text-[#7C6CFA]" />
                                    </Box>
                                    <Typography level="title-md" sx={{ color: 'white' }}>Unique Visitors</Typography>
                                </Stack>
                                <Typography level="body-sm" sx={{ color: '#A2A7B4', mb: 2 }}>
                                    The "Real People" count. This uses IP tracking to identify <span style={{ color: '#fff' }}>individual users</span>. If one person visits your site 5 times from ChatGPT, they count as 5 Reach but 1 Unique Visitor.
                                </Typography>
                                <Chip size="sm" variant="soft" color="neutral" sx={{ color: '#7C6CFA', fontWeight: 600 }}>
                                    Calculation: Distinct IP addresses per Product
                                </Chip>
                            </Card>
                        </div>
                    </Box>

                    {/* Route Specific Analysis Section */}
                    <Box>
                        <Typography level="title-lg" sx={{ color: 'white', mb: 4, fontSize: '1.5rem' }}>
                            Route-Level Intelligence
                        </Typography>
                        
                        <div className="flex flex-col gap-6">
                            <Box sx={{ p: 4, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <Typography level="h4" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    📊 Source Breakdown Table
                                </Typography>
                                <Typography level="body-lg" sx={{ color: '#A2A7B4', mb: 3 }}>
                                    Selecting a specific route (e.g., <code className="text-white text-sm bg-white/10 px-1 py-0.5 rounded">/pricing</code>) shows exactly which AI engines are driving traffic to that page.
                                </Typography>
                                <ul className="list-disc pl-6 space-y-3 text-[16px] text-[#A2A7B4]">
                                    <li>
                                        <span className="text-white font-medium">Traffic Source:</span>
                                        The AI platform (ChatGPT, Perplexity, etc.) where the user clicked the link to your website.
                                    </li>
                                    <li>
                                        <span className="text-[#38BDF8] font-bold">Total Reach:</span>
                                        <span className="text-white"> Top of the Funnel.</span> The total number of sessions initiated from this AI source to this specific page.
                                    </li>
                                    <li>
                                        <span className="text-[#7C6CFA] font-bold">Unique Visitors:</span>
                                        <span className="text-white"> Audience Size.</span> The number of distinct individuals who landed here from the AI engine (filtered by IP address).
                                    </li>
                                    <li>
                                        <span className="text-[#2ED47A] font-bold">Converted:</span>
                                        <span className="text-white"> Direct Acquisition.</span> The number of visitors who successfully entered your site through this page via an AI link.
                                    </li>
                                    <li>
                                        <span className="text-[#7C6CFA] font-bold">Navigation Conv. (Depth):</span>
                                        <span className="text-white"> Engagement Level.</span> The number of additional pages the visitor looked at *after* landing. A high number here proves the AI is sending high-intent researchers who are exploring your site.
                                    </li>
                                </ul>
                            </Box>

                            <Box sx={{ p: 4, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <Typography level="h4" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    🗺️ Visitor Journeys
                                </Typography>
                                <Typography level="body-lg" sx={{ color: '#A2A7B4', mb: 3 }}>
                                    A visual session replay mapping exactly how AI-referred traffic flows through your site.
                                </Typography>
                                <ul className="list-disc pl-6 space-y-3 text-[16px] text-[#A2A7B4]">
                                    <li>
                                        <span className="text-white font-medium">Journey Overlapping:</span>
                                        We group identical navigation paths together. If 40 people do the exact same sequence of clicks, they are collapsed into one clean card showing <span className="font-bold text-white">"40 visitors took this specific journey"</span>.
                                    </li>
                                    <li>
                                        <span className="text-[#2ED47A] font-bold">Entry Page (Solid Block):</span>
                                        The specific door they used to enter your site from the AI platform.
                                    </li>
                                    <li>
                                        <span className="text-[#F4604A] font-bold">Exit Page (Red Outline):</span>
                                        The final page they looked at before leaving your site (or converting). This is crucial for identifying drop-off holes in your funnel.
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
