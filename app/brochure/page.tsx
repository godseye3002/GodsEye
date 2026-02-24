"use client";

import { Box, Container, Stack, Typography, Card, Divider, Button, Chip, Table, Avatar } from "@mui/joy";
import { testimonials } from "@/app/data/testimonials";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BugReportIcon from "@mui/icons-material/BugReport";
import ConstructionIcon from "@mui/icons-material/Construction";

export default function BrochurePage() {
    const accentColor = "#2ED47A";
    const primaryColor = "#F2F5FA";
    const secondaryColor = "rgba(162, 167, 180, 0.88)";
    const dangerColor = "#F35B64";
    const warningColor = "#FFC107";
    const cardBg = "rgba(17, 19, 24, 0.95)";
    const borderColor = "rgba(46, 212, 122, 0.14)";

    const StepCard = ({ number, title, description }: { number: string; title: string; description: React.ReactNode }) => (
        <Card
            variant="outlined"
            sx={{
                backgroundColor: "rgba(13, 15, 20, 0.6)",
                border: `1px solid ${borderColor}`,
                borderRadius: "12px",
                p: 3,
                height: "100%",
                display: 'flex',
                flexDirection: 'column',
                gap: 2
            }}
        >
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: 'rgba(46, 212, 122, 0.1)',
                color: accentColor,
                fontWeight: 'bold',
                fontSize: '1.2rem',
                border: `1px solid rgba(46, 212, 122, 0.3)`
            }}>
                {number}
            </Box>
            <Typography level="title-lg" sx={{ color: primaryColor }}>{title}</Typography>
            <Typography component="div" level="body-md" sx={{ color: secondaryColor, lineHeight: 1.6 }}>{description}</Typography>

        </Card>
    );


    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "#0D0F14", py: { xs: 4, md: 8 } }}>
            <Container maxWidth="lg">

                {/* Page 1: Cover / Hook */}
                <Stack spacing={4} sx={{ alignItems: "center", mb: 0, py: { xs: 4, md: 8 } }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Box component="img" src="/GodsEye.png" alt="GodsEye Logo" sx={{ width: 40, height: 40 }} />
                        <Typography level="h2" sx={{ color: primaryColor, fontWeight: 800, fontSize: '3rem', letterSpacing: '-0.02em' }}>GodsEye</Typography>
                    </Stack>
                    <Typography level="h1" sx={{ textAlign: "center", color: primaryColor, fontSize: { xs: "2rem", md: "3.5rem" }, fontWeight: 800, lineHeight: 1.1 }}>
                        Your customers are asking AI who to trust.<br />
                        <Box component="span" sx={{ color: accentColor }}>Is your brand the answer?</Box>
                    </Typography>

                    <Typography level="title-lg" sx={{ textAlign: "center", color: secondaryColor, maxWidth: "800px", mx: "auto", lineHeight: 1.6 }}>
                        Most companies have invested years in SEO. But SEO gets you ranked on Google.
                        <br />
                        <strong>AEO gets you recommended by AI.</strong>
                        <br />
                        These are two completely different games — and most companies are only playing one.
                    </Typography>

                    <Card variant="soft" color="warning" sx={{ maxWidth: "500px", mx: "auto", mt: 4, backgroundColor: "rgba(255, 193, 7, 0.1)", border: `1px solid ${warningColor}` }}>
                        <Typography level="body-lg" sx={{ color: "#FFF", fontWeight: 600 }}>
                            80% of users never click a single link when AI gives them a direct answer.
                        </Typography>
                        <Typography level="body-sm" sx={{ color: "rgba(255, 255, 255, 0.7)", mt: 1 }}>
                            If you're not named in that answer, you don't exist to that buyer.
                        </Typography>
                    </Card>
                </Stack>

                <Divider sx={{ my: 4, opacity: 0.1 }} />

                {/* Page 2: The Problem */}
                <Stack spacing={4} sx={{ mb: { xs: 4, md: 8 } }}>
                    <Typography level="h2" sx={{ color: primaryColor, fontWeight: 700, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
                        The way people search has changed.<br />
                        <Box component="span" sx={{ color: dangerColor }}>Your visibility strategy hasn't.</Box>
                    </Typography>

                    <Typography level="body-lg" sx={{ color: secondaryColor, lineHeight: 1.7 }}>
                        Two or three years ago, people searched Google, saw 10 links, and clicked. Today, they open ChatGPT, Perplexity, or Google AI Mode and ask a question. They get one answer. They trust it. They act on it.
                    </Typography>

                    <Card variant="outlined" sx={{ backgroundColor: cardBg, borderColor: borderColor, p: { xs: 2.5, md: 4 } }}>
                        <Typography level="title-lg" sx={{ color: primaryColor, mb: 2 }}>
                            Here's what that means for your business:
                        </Typography>

                        {/* Mobile View: Stacked Comparison Cards */}
                        <Stack spacing={2} sx={{ display: { xs: 'flex', md: 'none' }, mb: 4 }}>
                            {[
                                { feature: "Goal", seo: "Ranked in list", aeo: "Recommended as answer" },
                                { feature: "User Action", seo: "Click a link", aeo: "Read and decide" },
                                { feature: "Key Metric", seo: "Traffic Volume", aeo: "Trust & Answer Share" }
                            ].map((item, index) => (
                                <Card key={index} variant="soft" sx={{ backgroundColor: "rgba(13, 15, 20, 0.6)", borderColor: borderColor }}>
                                    <Typography level="title-sm" sx={{ color: secondaryColor, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem' }}>
                                        {item.feature}
                                    </Typography>
                                    <Divider sx={{ opacity: 0.1, my: 1.5 }} />
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                        <Box>
                                            <Typography level="body-xs" sx={{ color: "rgba(255,255,255,0.5)", mb: 0.5 }}>SEO (Google)</Typography>
                                            <Typography level="title-md" sx={{ color: "#FFF" }}>{item.seo}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography level="body-xs" sx={{ color: accentColor, mb: 0.5, opacity: 0.8 }}>AEO (AI Search)</Typography>
                                            <Typography level="title-md" sx={{ color: "#FFF" }}>{item.aeo}</Typography>
                                        </Box>
                                    </Box>
                                </Card>
                            ))}
                        </Stack>

                        {/* Desktop View: Comparison Table */}
                        <Box sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto', mb: 4 }}>
                            <Table
                                aria-label="SEO vs AEO Comparison"
                                size="lg"
                                variant="outlined"
                                sx={{
                                    '--Table-headerUnderlineThickness': '1px',
                                    '--TableCell-headBackground': 'rgba(13, 15, 20, 0.6)',
                                    backgroundColor: 'transparent',
                                    borderRadius: '12px',
                                    borderColor: borderColor,
                                    '& thead th:nth-of-type(1)': { width: '20%' },
                                    '& thead th:nth-of-type(2)': { width: '40%' },
                                    '& thead th:nth-of-type(3)': { width: '40%' },
                                }}
                            >
                                <thead>
                                    <tr>
                                        <th style={{ color: secondaryColor }}>Feature</th>
                                        <th style={{ color: "#FFF", fontWeight: 700 }}>SEO (Google)</th>
                                        <th style={{ color: accentColor, fontWeight: 700 }}>AEO (AI Search)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ color: secondaryColor }}>Goal</td>
                                        <td style={{ color: "#FFF" }}>Ranked in list</td>
                                        <td style={{ color: "#FFF" }}>Recommended as answer</td>
                                    </tr>
                                    <tr>
                                        <td style={{ color: secondaryColor }}>User Action</td>
                                        <td style={{ color: "#FFF" }}>Click a link</td>
                                        <td style={{ color: "#FFF" }}>Read and decide</td>
                                    </tr>
                                    <tr>
                                        <td style={{ color: secondaryColor }}>Key Metric</td>
                                        <td style={{ color: "#FFF" }}>Traffic Volume</td>
                                        <td style={{ color: "#FFF" }}>Trust & Answer Share</td>
                                    </tr>
                                </tbody>
                            </Table>
                        </Box>
                        <Stack spacing={2}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TrendingUpIcon sx={{ color: dangerColor }} />
                                <Box>
                                    <Typography level="title-md" sx={{ color: primaryColor, mb: 0.5 }}>Your Google ranking doesn't matter if AI doesn't mention you.</Typography>
                                    <Typography level="body-md" sx={{ color: secondaryColor }}>
                                        A parent looking for the best JEE coaching, a founder researching a SaaS tool — they're not clicking links anymore. They're reading the AI's answer and deciding.
                                    </Typography>
                                </Box>
                            </Box>
                            <Divider sx={{ opacity: 0.1 }} />
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <BugReportIcon sx={{ color: dangerColor }} />
                                <Box>
                                    <Typography level="title-md" sx={{ color: primaryColor, mb: 0.5 }}>The hidden problem most companies miss:</Typography>
                                    <Typography level="body-md" sx={{ color: secondaryColor }}>
                                        Your website might actually be cited by AI — but the wrong parts are being read. AI crawlers are selective. If your USP is buried, the AI will pull generic content, misrepresent you, and move on.
                                    </Typography>
                                </Box>
                            </Box>
                        </Stack>
                    </Card>
                </Stack>

                {/* Page 3: What GodsEye Does */}
                <Stack spacing={4} sx={{ mb: { xs: 4, md: 8 } }}>
                    <Box>
                        <Chip variant="soft" color="success" sx={{ mb: 2 }}>The Solution</Chip>
                        <Typography level="h2" sx={{ color: primaryColor, fontWeight: 700, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
                            We find exactly where you're losing — and tell you exactly how to fix it.
                        </Typography>
                    </Box>

                    <Typography level="body-lg" sx={{ color: secondaryColor }}>
                        GodsEye audits your AI visibility, identifies the gaps, and gives you a specific plan your team can implement immediately.
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                        <StepCard
                            number="1"
                            title="AI Visibility Audit"
                            description={
                                <>
                                    We run hundreds of queries across Google AI, Perplexity, ChatGPT. We extract every response. You get a <strong>Visibility Score</strong> and <strong>AI Presence Score</strong>.
                                </>
                            }
                        />
                        <StepCard
                            number="2"
                            title="Deep Source Analysis"
                            description="For every query where you're not appearing, we analyze the pages that ARE cited. We reverse-engineer why AI preferred them over you."
                        />
                        <StepCard
                            number="3"
                            title="Your Fix Plan"
                            description={
                                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                    <li>Which HTML elements to restructure</li>
                                    <li>Which pages need content changes</li>
                                    <li>Which queries to target first</li>
                                </Box>
                            }
                        />
                        <StepCard
                            number="4"
                            title="Execute in Workflow"
                            description="GodsEye plugs directly into your team's workflow. It’s like giving your developer an AI co-pilot that knows your strategy. (This allows your tech team to fix things instantly inside their coding environment)."
                        />
                        <StepCard
                            number="5"
                            title="Re-Audit & Track"
                            description="Once changes go live, we re-run the audit. You see immediate movement in your visibility score and AI Presence Score."
                        />
                    </Box>
                </Stack>

                <Divider sx={{ my: { xs: 4, md: 8 }, opacity: 0.1 }} />

                {/* Page 4: Business Impact */}
                <Stack spacing={4} sx={{ mb: { xs: 4, md: 8 } }}>
                    <Typography level="h2" sx={{ color: primaryColor, fontWeight: 700, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
                        If GodsEye were running your AEO — here's what would change.
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4 }}>
                        <Card variant="soft" sx={{ backgroundColor: "rgba(46, 212, 122, 0.05)", p: 3 }}>
                            <Typography level="title-lg" sx={{ color: accentColor, mb: 1 }}>If you're in EdTech</Typography>
                            <Typography level="body-md" sx={{ color: secondaryColor }}>
                                Parents act on AI answers. If a parent asks "best coaching for JEE 2025" and you don't appear, that is a lost admission.
                            </Typography>
                        </Card>
                        <Card variant="soft" sx={{ backgroundColor: "rgba(147, 51, 234, 0.05)", p: 3 }}>
                            <Typography level="title-lg" sx={{ color: "#9333EA", mb: 1 }}>If you're in SaaS</Typography>
                            <Typography level="body-md" sx={{ color: secondaryColor }}>
                                Founders use AI to shortlist tools. If ChatGPT recommends your competitor, you never even get a trial signup.
                            </Typography>
                        </Card>
                        <Card variant="soft" sx={{ backgroundColor: "rgba(59, 130, 246, 0.05)", p: 3 }}>
                            <Typography level="title-lg" sx={{ color: "#3B82F6", mb: 1 }}>If you're in D2C</Typography>
                            <Typography level="body-md" sx={{ color: secondaryColor }}>
                                Shoppers ask "best protein powder" or "top rated skincare". If AI doesn't recommend your brand, you lose the sale instantly.
                            </Typography>
                        </Card>
                    </Box>

                    <Card variant="outlined" sx={{ backgroundColor: cardBg, borderColor: borderColor, p: 3 }}>
                        <Stack direction="row" spacing={2}>
                            <ConstructionIcon sx={{ color: accentColor }} />
                            <Box>
                                <Typography level="title-md" sx={{ color: primaryColor }}>What changes for your team</Typography>
                                <Typography level="body-md" sx={{ color: secondaryColor, mt: 1 }}>
                                    Your SEO person currently optimizes for Google. GodsEye adds a second layer — optimizing for AI algorithms.
                                    <br /><br />
                                    Time investment: <strong>1–2 hours per week</strong>, implementing the changes GodsEye surfaces.
                                </Typography>
                            </Box>
                        </Stack>
                    </Card>
                </Stack>

                {/* Page 5: Why GodsEye */}
                <Stack spacing={4} sx={{ mb: { xs: 4, md: 8 } }}>
                    <Typography level="h2" sx={{ color: primaryColor, fontWeight: 700, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
                        This window is open. It won't be for long.
                    </Typography>
                    <Typography level="body-lg" sx={{ color: secondaryColor }}>
                        AI search is the current behavior of your customers. Companies building AI visibility now are establishing the same first-mover advantage that early SEO adopters held for years.
                    </Typography>

                    <Box sx={{ p: 4, borderRadius: '12px', border: `1px solid ${borderColor}`, backgroundColor: "rgba(46, 212, 122, 0.03)" }}>
                        <Typography level="title-lg" sx={{ color: primaryColor, mb: 2 }}>Why GodsEye?</Typography>
                        <Stack spacing={2}>
                            <Typography level="body-md" sx={{ color: secondaryColor }}>
                                • We scrape and analyze the competing sources AI <em>actually</em> chose.<br />
                                • We compare them structurally against your pages.<br />
                                • We generate a specific, prioritized action plan.<br />
                                • We plug data directly into your team's workflow so fixes happen instantly—no new dashboard to learn.
                            </Typography>
                            <Divider sx={{ opacity: 0.1 }} />
                            <Box>
                                <Typography level="title-md" sx={{ color: accentColor, mb: 0.5 }}>Our Current Stage: Free Pilot</Typography>
                                <Typography level="body-md" sx={{ color: secondaryColor }}>
                                    We are working with early clients on a free pilot basis. <strong>No cost. Full analysis, full access.</strong> If you see value, we continue. If not, you keep the analysis.
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>
                </Stack>

                <Divider sx={{ mt: { xs: 4, md: 8 }, mb: { xs: 2, md: 4 }, opacity: 0.1 }} />

                {/* Page 5.5: Testimonials */}
                <Stack spacing={4} sx={{ mb: { xs: 4, md: 8 } }}>
                    <Box sx={{ textAlign: "center", mb: 0 }}>
                        <Typography level="body-sm" sx={{ color: accentColor, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", mb: 1 }}>
                            Social Proof
                        </Typography>
                        <Typography level="h2" sx={{ color: primaryColor, fontWeight: 700, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
                            What our clients are saying
                        </Typography>
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, width: "100%" }}>
                        {testimonials.map((testimonial) => (
                            <Card
                                key={testimonial.id}
                                variant="outlined"
                                sx={{
                                    backgroundColor: "rgba(17, 19, 24, 0.6)",
                                    borderColor: borderColor,
                                    p: { xs: 3, md: 4 },
                                    borderRadius: "16px",
                                    position: "relative"
                                }}
                            >
                                <Typography
                                    sx={{
                                        color: primaryColor,
                                        fontSize: { xs: "1.05rem", md: "1.15rem" },
                                        lineHeight: 1.7,
                                        mb: 3,
                                        fontStyle: "italic",
                                        fontWeight: 400,
                                        whiteSpace: "pre-wrap"
                                    }}
                                >
                                    "{testimonial.content}"
                                </Typography>

                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <Avatar
                                        src={testimonial.image}
                                        sx={{
                                            width: 56,
                                            height: 56,
                                            border: `2px solid rgba(46, 212, 122, 0.3)`,
                                        }}
                                    />
                                    <Box>
                                        <Typography level="title-md" sx={{ color: primaryColor, fontWeight: 700 }}>
                                            {testimonial.name}
                                        </Typography>
                                        <Typography level="body-sm" sx={{ color: secondaryColor }}>
                                            {testimonial.title} @ <Box component="span" sx={{ color: accentColor }}>{testimonial.company}</Box>
                                        </Typography>
                                    </Box>
                                </Box>
                            </Card>
                        ))}
                    </Box>
                </Stack>

                {/* Page 6: Getting Started */}
                <Card
                    variant="solid"
                    color="success"
                    invertedColors
                    sx={{
                        p: { xs: 4, md: 6 },
                        backgroundColor: "#052e16", // darker green background
                        border: `1px solid ${accentColor}`,
                        boxShadow: "0 0 40px rgba(46, 212, 122, 0.1)"
                    }}
                >
                    <Stack spacing={4} alignItems="center" textAlign="center">
                        <Typography level="h2" sx={{ color: "#FFF" }}>Three steps to know exactly where you stand.</Typography>

                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} sx={{ width: '100%' }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography level="title-lg" sx={{ color: accentColor, mb: 1 }}>Step 1</Typography>
                                <Typography level="body-md" sx={{ color: "rgba(255,255,255,0.8)" }}>Share basic product info & key queries.</Typography>
                            </Box>
                            <Divider orientation="vertical" sx={{ display: { xs: 'none', md: 'block' }, borderColor: "rgba(255,255,255,0.2)" }} />
                            <Box sx={{ flex: 1 }}>
                                <Typography level="title-lg" sx={{ color: accentColor, mb: 1 }}>Step 2</Typography>
                                <Typography level="body-md" sx={{ color: "rgba(255,255,255,0.8)" }}>We run the 24-48h AI Visibility Audit.</Typography>
                            </Box>
                            <Divider orientation="vertical" sx={{ display: { xs: 'none', md: 'block' }, borderColor: "rgba(255,255,255,0.2)" }} />
                            <Box sx={{ flex: 1 }}>
                                <Typography level="title-lg" sx={{ color: accentColor, mb: 1 }}>Step 3</Typography>
                                <Typography level="body-md" sx={{ color: "rgba(255,255,255,0.8)" }}>Implement fixes via GodsEye MCP & see results.</Typography>
                            </Box>
                        </Stack>

                        <Box sx={{ mt: 4, pt: 4, borderTop: "1px solid rgba(255,255,255,0.1)", width: '100%' }}>
                            <Typography level="h3" sx={{ color: "#FFF", mb: 2 }}>The Ask: One conversation. One audit.</Typography>
                            <Button component="a" href="mailto:santoshpatil@godseyes.world" size="lg" variant="solid" sx={{ backgroundColor: accentColor, color: "#000", "&:hover": { backgroundColor: "#26B869" } }}>
                                Contact Santosh Patil
                            </Button>
                            <Typography level="body-sm" sx={{ color: "rgba(255,255,255,0.6)", mt: 2 }}>
                                santoshpatil@godseyes.world
                            </Typography>
                        </Box>
                    </Stack>
                </Card>

                <Box sx={{ textAlign: 'center', mt: { xs: 4, md: 8 }, opacity: 0.6 }}>
                    <Typography level="body-md" sx={{ color: primaryColor, mb: 1, fontWeight: 500 }}>
                        GodsEye: Total visibility into the AI-driven internet.
                    </Typography>
                    <Typography level="body-sm" sx={{ color: secondaryColor }}>
                        © 2025 GodsEye. AI Visibility & Engine Optimization.
                    </Typography>
                </Box>

            </Container>
        </Box >
    );
}
