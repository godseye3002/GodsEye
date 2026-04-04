"use client";

import { Box, Container, Stack, Typography, Card, Divider, Button, Chip } from "@mui/joy";
import { testimonials } from "@/app/data/testimonials";
import { TestimonialCarousel } from "@/components/TestimonialCarousel";
import ReactMarkdown from "react-markdown";

export default function BrochurePage() {
    const accent = "#2ED47A";
    const primary = "#F2F5FA";
    const secondary = "rgba(242, 245, 250, 0.55)";
    const danger = "#F35B64";
    const cardBg = "rgba(17, 19, 24, 0.95)";
    const border = "rgba(46, 212, 122, 0.14)";
    const warnBg = "rgba(255, 193, 7, 0.08)";
    const warnBorder = "rgba(255, 193, 7, 0.35)";

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "#0D0F14" }}>
            {/* ── HERO ───────────────────────────────────────────── */}
            <Box sx={{ borderBottom: `1px solid ${border}` }}>
                <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 }, textAlign: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, mb: 5 }}>
                        <Box component="img" src="/GodsEye.png" alt="GodsEye" sx={{ width: 36, height: 36 }} />
                        <Typography sx={{ color: primary, fontWeight: 800, fontSize: "1.6rem", letterSpacing: "-0.02em" }}>GodsEye</Typography>
                    </Box>

                    <Typography
                        level="h1"
                        sx={{
                            color: primary,
                            fontSize: { xs: "2.2rem", md: "3.4rem" },
                            fontWeight: 800,
                            lineHeight: 1.15,
                            letterSpacing: "-0.03em",
                            mb: 3,
                        }}
                    >
                        Your customers are asking AI who to trust.
                        <Box component="span" sx={{ color: accent, display: "block" }}>
                            Is your brand the answer?
                        </Box>
                    </Typography>

                    <Typography level="body-lg" sx={{ color: secondary, maxWidth: 640, mx: "auto", lineHeight: 1.75, mb: 5 }}>
                        GodsEye turns AI search visibility into measurable revenue — by making sure AI engines recommend
                        your brand, and then tracking exactly how those recommendations convert into real customers.
                    </Typography>

                    {/* 3-Part Punch Line */}
                    <Box sx={{
                        display: "flex", flexWrap: "wrap", justifyContent: "center",
                        mb: 5, maxWidth: 860, mx: "auto",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "16px",
                        overflow: "hidden",
                        backdropFilter: "blur(8px)",
                        backgroundColor: "rgba(17,19,24,0.6)",
                    }}>
                        {[
                            { icon: "◎", label: "Track", desc: "See exactly where you rank in AI answers — across every engine.", color: "#38BDF8" },
                            { icon: "⚡", label: "Fix", desc: "Get the precise reason and implementation-ready steps to win.", color: "#2ED47A" },
                            { icon: "$", label: "Measure", desc: "Prove AI is driving real conversions — not just impressions.", color: "#A78BFA" },
                        ].map((item, i) => (
                            <Box key={item.label} sx={{
                                flex: "1 1 200px",
                                px: { xs: 3, md: 4 }, py: { xs: 2.5, md: 3 },
                                borderRight: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none",
                                textAlign: "center",
                            }}>
                                <Typography sx={{ fontSize: "1.35rem", color: item.color, mb: 0.75, fontWeight: 800, letterSpacing: "-0.01em" }}>
                                    {item.icon} {item.label}
                                </Typography>
                                <Typography sx={{ fontSize: "0.95rem", color: secondary, lineHeight: 1.6 }}>
                                    {item.desc}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    <Button
                        component="a"
                        href="mailto:santoshpatil@godseyes.world"
                        size="lg"
                        variant="solid"
                        sx={{ backgroundColor: accent, color: "#000", fontWeight: 700, px: 5, py: 1.5, fontSize: "1rem", "&:hover": { backgroundColor: "#26B869" } }}
                    >
                        Get a Free Audit
                    </Button>
                    <Typography level="body-xs" sx={{ color: secondary, mt: 1.5 }}>
                        No cost. No commitment. Just clarity.
                    </Typography>
                </Container>
            </Box>

            {/* ── SECTION 1: THE SHIFT ───────────────────────────── */}
            <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
                <Chip variant="soft" sx={{ bgcolor: "rgba(46,212,122,0.1)", color: accent, fontWeight: 700, mb: 3, letterSpacing: "0.1em" }}>
                    THE SHIFT
                </Chip>
                <Typography level="h2" sx={{ color: primary, fontWeight: 800, fontSize: { xs: "1.9rem", md: "2.8rem" }, lineHeight: 1.2, mb: 4 }}>
                    The way people search has quietly changed.
                    <Box component="span" sx={{ color: danger, display: "block" }}>Most companies haven't noticed.</Box>
                </Typography>

                <Stack spacing={4}>
                    <Typography level="body-lg" sx={{ color: secondary, lineHeight: 1.8 }}>
                        A few years ago, someone looking for a JEE coaching center, a SaaS tool, or a D2C skincare brand would open Google,
                        see ten links, and click. That's how the game worked.
                    </Typography>
                    <Typography level="body-lg" sx={{ color: secondary, lineHeight: 1.8 }}>
                        Today, the same person opens ChatGPT or Perplexity, asks a question, and gets <strong style={{ color: primary }}>one answer</strong>.
                        They read it. They trust it. They act on it. They don't scroll through links.
                    </Typography>
                    <Card sx={{ bgcolor: warnBg, border: `1px solid ${warnBorder}`, p: 3, borderRadius: "16px" }}>
                        <Typography level="title-lg" sx={{ color: "#FFF", fontWeight: 700, mb: 1 }}>
                            80% of AI users never click a single link when AI gives them a direct answer.
                        </Typography>
                        <Typography level="body-md" sx={{ color: secondary }}>
                            If your brand isn't named in that answer, you simply do not exist to that buyer. It doesn't matter how good your product is.
                        </Typography>
                    </Card>
                </Stack>
            </Container>

            <Divider sx={{ opacity: 0.07 }} />

            {/* ── SECTION 2: THE BLACK BOX ──────────────────────── */}
            <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
                <Chip variant="soft" sx={{ bgcolor: "rgba(243,91,100,0.1)", color: danger, fontWeight: 700, mb: 3, letterSpacing: "0.1em" }}>
                    THE PROBLEM
                </Chip>
                <Typography level="h2" sx={{ color: primary, fontWeight: 800, fontSize: { xs: "1.9rem", md: "2.8rem" }, lineHeight: 1.2, mb: 4 }}>
                    Some brands are trying to get into AI answers.
                    <Box component="span" sx={{ color: danger, display: "block" }}>But they're flying blind.</Box>
                </Typography>

                <Stack spacing={4}>
                    <Typography level="body-lg" sx={{ color: secondary, lineHeight: 1.8 }}>
                        Here's what we see all the time: a marketing team pays for content, hires an SEO agency, and tries to get into AI responses.
                        Maybe they start showing up occasionally. But then the real question hits them:
                    </Typography>

                    <Card sx={{ bgcolor: cardBg, border: `1px solid ${border}`, p: 4, borderRadius: "16px" }}>
                        <Typography level="h4" sx={{ color: primary, fontWeight: 700, fontStyle: "italic", textAlign: "center", lineHeight: 1.6 }}>
                            "We think AI is mentioning us. But is it actually driving any revenue?
                            Are those visitors clicking our buttons? Are they converting?"
                        </Typography>
                    </Card>

                    <Typography level="body-lg" sx={{ color: secondary, lineHeight: 1.8 }}>
                        Right now, <strong style={{ color: primary }}>AI search is a black box for most businesses</strong>. Your Google Analytics will not tell you
                        a ChatGPT user visited your site. It will label them "Direct Traffic" and the story ends there.
                    </Typography>
                    <Typography level="body-lg" sx={{ color: secondary, lineHeight: 1.8 }}>
                        You could be getting hundreds of AI-referred visitors every week and have no idea. You wouldn't know which AI engine sent them,
                        what page they landed on, or whether they clicked your "Book a Call" button.
                    </Typography>
                    <Typography level="title-lg" sx={{ color: danger }}>
                        Visibility without measurement is not a business strategy. It's just hope.
                    </Typography>
                </Stack>
            </Container>

            <Divider sx={{ opacity: 0.07 }} />

            {/* ── SECTION 3: THE VISION ─────────────────────────── */}
            <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
                <Chip variant="soft" sx={{ bgcolor: "rgba(46,212,122,0.1)", color: accent, fontWeight: 700, mb: 3, letterSpacing: "0.1em" }}>
                    THE VISION
                </Chip>
                <Typography level="h2" sx={{ color: primary, fontWeight: 800, fontSize: { xs: "1.9rem", md: "2.8rem" }, lineHeight: 1.2, mb: 4 }}>
                    Imagine knowing exactly where your next customer came from.
                </Typography>

                <Stack spacing={3}>
                    <Typography level="body-lg" sx={{ color: secondary, lineHeight: 1.8 }}>
                        Not just "someone visited our website." But the full story:
                    </Typography>

                    <Box sx={{ pl: 2 }}>
                        {[
                            "A user typed a question into Perplexity.",
                            "Perplexity mentioned your brand as the answer.",
                            "That user clicked your link and landed on your homepage.",
                            "They scrolled to your pricing section and clicked \"Book a Demo.\"",
                            "That click is now sitting in your GodsEye dashboard, attributed to Perplexity, timestamped, tracked.",
                        ].map((step, i) => (
                            <Box key={i} sx={{ display: "flex", gap: 2, mb: 2, alignItems: "flex-start" }}>
                                <Box sx={{
                                    minWidth: 28, height: 28, borderRadius: "50%",
                                    bgcolor: "rgba(46,212,122,0.12)", border: `1px solid rgba(46,212,122,0.3)`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: accent, fontWeight: 700, fontSize: "0.8rem", mt: 0.3
                                }}>{i + 1}</Box>
                                <Typography level="body-lg" sx={{ color: i === 4 ? primary : secondary, lineHeight: 1.7, fontWeight: i === 4 ? 600 : 400 }}>
                                    {step}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    <Card sx={{ bgcolor: "rgba(46,212,122,0.04)", border: `1px solid rgba(46,212,122,0.2)`, p: 3.5, borderRadius: "16px" }}>
                        <Typography level="title-lg" sx={{ color: accent, fontWeight: 700, mb: 1 }}>
                            That is not brand awareness. That is engineered revenue.
                        </Typography>
                        <Typography level="body-md" sx={{ color: secondary, lineHeight: 1.7 }}>
                            The difference between a brand that "hopes AI is helping" and a brand that knows AI is generating
                            $47,000 in pipeline this month is measurement.
                        </Typography>
                    </Card>
                </Stack>
            </Container>

            <Divider sx={{ opacity: 0.07 }} />

            {/* ── SECTION 4: THE PRODUCT ────────────────────────── */}
            <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
                <Chip variant="soft" sx={{ bgcolor: "rgba(46,212,122,0.1)", color: accent, fontWeight: 700, mb: 3, letterSpacing: "0.1em" }}>
                    THE SOLUTION
                </Chip>
                <Typography level="h2" sx={{ color: primary, fontWeight: 800, fontSize: { xs: "1.9rem", md: "2.8rem" }, lineHeight: 1.2, mb: 2 }}>
                    That is why we built GodsEye.
                </Typography>
                <Typography level="body-lg" sx={{ color: secondary, lineHeight: 1.8, mb: 6 }}>
                    GodsEye has two jobs. First, it makes sure AI engines recommend your brand. Second — and this is the part other tools skip —
                    it proves that recommendation is actually driving revenue.
                </Typography>

                <Stack spacing={3}>
                    {[
                        {
                            num: "01",
                            title: "AI Visibility Audit",
                            color: "#38BDF8",
                            bg: "rgba(56,189,248,0.07)",
                            bdr: "rgba(56,189,248,0.2)",
                            body: "We run your brand through hundreds of real queries on ChatGPT, Perplexity, and Google AI. You get a clear score: how often you're mentioned, how prominently, and what AI engines think of you right now. No guessing.",
                        },
                        {
                            num: "02",
                            title: "Competitor Gap Analysis",
                            color: "#A78BFA",
                            bg: "rgba(167,139,250,0.07)",
                            bdr: "rgba(167,139,250,0.2)",
                            body: "We show you exactly which competitors AI is recommending instead of you, and — more importantly — why. We look at their pages structurally, so you know precisely what to fix. Not vague advice. A specific list.",
                        },
                        {
                            num: "03",
                            title: "The Conversion & CTA Tracker",
                            color: accent,
                            bg: "rgba(46,212,122,0.07)",
                            bdr: "rgba(46,212,122,0.25)",
                            body: "This is our secret weapon. We install a lightweight, invisible tracking script on your site. From that moment, every time an AI-referred visitor lands on your site, we capture it. We tell you which AI sent them, which page they hit, which buttons they clicked, and when.",
                            highlight: "This is the part that closes B2B deals. Because now, AI isn't a \"marketing experiment\" anymore — it's a channel with a measurable return.",
                        },
                        {
                            num: "04",
                            title: "Professional GEO Analyst via MCP",
                            color: "#FBBF24",
                            bg: "rgba(251,191,36,0.07)",
                            bdr: "rgba(251,191,36,0.2)",
                            body: "After tracking is done, the **GodsEye MCP Agent** turns your developer workflow into a strategic hub. Using MCP with **Claude AI** gives you a professional **GEO Analyst** who tells you exactly what to do to improve visibility. It plugs directly into your IDE, allowing your team to implement fixes instantly with an AI co-pilot that understands your conversion goals and writes the optimized code on the spot.",
                        },
                        {
                            num: "05",
                            title: "Frequent Monitoring — Set It and Forget It",
                            color: accent,
                            bg: "rgba(46,212,122,0.07)",
                            bdr: "rgba(46,212,122,0.25)",
                            body: "AI answers aren't static. They shift as models update. GodsEye monitors your AI visibility daily and alerts you when something changes — so you're always the first to know if a competitor is gaining ground on your territory.",
                        },
                    ].map((item) => (
                        <Card key={item.num} sx={{ bgcolor: item.bg, border: `1px solid ${item.bdr}`, p: { xs: 3, md: 4 }, borderRadius: "20px" }}>
                            <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
                                <Box sx={{
                                    minWidth: 44, height: 44, borderRadius: "12px",
                                    bgcolor: `${item.color}18`, border: `1px solid ${item.bdr}`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: item.color, fontWeight: 800, fontSize: "0.85rem",
                                    flexShrink: 0
                                }}>{item.num}</Box>
                                <Box>
                                    <Typography level="title-lg" sx={{ color: item.color, fontWeight: 700, mb: 1 }}>{item.title}</Typography>
                                    <Typography level="body-md" component="div" sx={{
                                        color: secondary,
                                        lineHeight: 1.75,
                                        '& p': { m: 0 },
                                        '& strong': { color: primary, fontWeight: 600 }
                                    }}>
                                        <ReactMarkdown>{item.body}</ReactMarkdown>
                                    </Typography>
                                    {item.highlight && (
                                        <Typography level="body-md" component="div" sx={{
                                            color: primary,
                                            fontWeight: 600,
                                            mt: 1.5,
                                            lineHeight: 1.7,
                                            '& p': { m: 0 },
                                            '& strong': { color: accent, fontWeight: 700 }
                                        }}>
                                            <ReactMarkdown>{item.highlight}</ReactMarkdown>
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </Card>
                    ))}
                </Stack>
            </Container>

            <Divider sx={{ opacity: 0.07 }} />

            {/* ── SECTION 4.5: THE GODSEYEAGENT (THE FIX) ────────── */}
            <Box sx={{ background: "linear-gradient(180deg, rgba(56,189,248,0.04) 0%, transparent 100%)", borderTop: "1px solid rgba(56,189,248,0.12)" }}>
                <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
                    <Chip variant="soft" sx={{ bgcolor: "rgba(56,189,248,0.1)", color: "#38BDF8", fontWeight: 700, mb: 3, letterSpacing: "0.1em" }}>
                        THE GODSEYEAGENT
                    </Chip>
                    <Typography level="h2" sx={{ color: primary, fontWeight: 800, fontSize: { xs: "1.9rem", md: "2.8rem" }, lineHeight: 1.2, mb: 2 }}>
                        We don&apos;t just show you the score.
                        <Box component="span" sx={{ color: "#38BDF8", display: "block" }}>We give you the exact playbook to win.</Box>
                    </Typography>
                    <Typography level="body-lg" sx={{ color: secondary, lineHeight: 1.8, mb: 6 }}>
                        Most AEO tools stop at telling you that you&apos;re invisible. GodsEye goes three steps further — it finds out <strong style={{ color: primary }}>why</strong> your competitor won, generates the <strong style={{ color: primary }}>precise fix</strong>, and deploys it directly in your IDE through our MCP Agent.
                    </Typography>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
                        {[
                            {
                                step: "01", color: danger, tag: "TRACK",
                                title: "We Find the Gap",
                                body: "GodsEye runs your brand through hundreds of real AI queries and highlights exactly which searches you're losing — and to whom.",
                            },
                            {
                                step: "02", color: "#38BDF8", tag: "FIX",
                                title: "We Diagnose the Why",
                                body: "Our Agent analyzes the winning competitor's content, structure, and citations to extract precisely why AI prefers them — not guesswork, exact signals.",
                            },
                            {
                                step: "03", color: accent, tag: "MEASURE",
                                title: "We Ship the Fix",
                                body: "Through our VS Code MCP integration, the Agent pushes implementation-ready edits and then re-audits to confirm the revenue improvement.",
                            },
                        ].map((item) => (
                            <Card key={item.step} sx={{
                                bgcolor: `${item.color}08`,
                                border: `1px solid ${item.color}28`,
                                p: { xs: 3, md: 4 }, borderRadius: "20px",
                                position: "relative", overflow: "hidden",
                                "&:hover": { borderColor: `${item.color}55`, transform: "translateY(-4px)" },
                                transition: "border-color 0.3s ease, transform 0.3s ease",
                            }}>
                                <Typography sx={{
                                    position: "absolute", top: -8, right: 16,
                                    fontSize: "5rem", fontWeight: 900,
                                    color: `${item.color}10`, lineHeight: 1,
                                    fontStyle: "italic", userSelect: "none",
                                }}>{item.step}</Typography>
                                <Chip variant="soft" sx={{ bgcolor: `${item.color}18`, color: item.color, fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.1em", mb: 2 }}>
                                    {item.tag}
                                </Chip>
                                <Typography level="title-lg" sx={{ color: primary, fontWeight: 800, mb: 1.5 }}>{item.title}</Typography>
                                <Typography level="body-md" sx={{ color: secondary, lineHeight: 1.75 }}>{item.body}</Typography>
                            </Card>
                        ))}
                    </Box>

                    <Card sx={{ mt: 4, bgcolor: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.18)", p: { xs: 3, md: 4 }, borderRadius: "16px", textAlign: "center" }}>
                        <Typography level="title-lg" sx={{ color: primary, fontWeight: 700 }}>
                            &quot;We don&apos;t just tell you there&apos;s a problem. We track it, fix it, and prove it with revenue.&quot;
                        </Typography>
                    </Card>
                </Container>
            </Box>

            <Divider sx={{ opacity: 0.07 }} />

            {/* ── SECTION 5: WHO IT'S FOR ────────────────────────── */}
            <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
                <Typography level="h2" sx={{ color: primary, fontWeight: 800, fontSize: { xs: "1.9rem", md: "2.8rem" }, lineHeight: 1.2, mb: 2 }}>
                    Who is this for?
                </Typography>
                <Typography level="body-lg" sx={{ color: secondary, lineHeight: 1.8, mb: 5 }}>
                    If your customers use the internet to research before they buy, GodsEye is for you.
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2.5 }}>
                    {[
                        {
                            sector: "SaaS",
                            color: "#A78BFA",
                            bg: "rgba(167,139,250,0.06)",
                            bdr: "rgba(167,139,250,0.15)",
                            story: "A founder asks ChatGPT: \"Best tool for managing client onboarding.\" If it recommends your competitor, you never even get a trial signup. GodsEye fixes that."
                        },
                        {
                            sector: "EdTech",
                            color: "#38BDF8",
                            bg: "rgba(56,189,248,0.06)",
                            bdr: "rgba(56,189,248,0.15)",
                            story: "A parent asks Perplexity: \"Best JEE coaching for 2025.\" If your institute isn't the answer, that enrollment goes to someone else. GodsEye makes sure you're the answer."
                        },
                        {
                            sector: "D2C Brands",
                            color: accent,
                            bg: "rgba(46,212,122,0.06)",
                            bdr: "rgba(46,212,122,0.15)",
                            story: "A shopper asks Google AI: \"Best protein powder for beginners.\" If your brand isn't named, the sale is gone before it started. GodsEye puts you in that answer."
                        },
                    ].map((item) => (
                        <Card key={item.sector} sx={{ bgcolor: item.bg, border: `1px solid ${item.bdr}`, p: 3, borderRadius: "16px" }}>
                            <Typography level="title-md" sx={{ color: item.color, fontWeight: 700, mb: 1.5 }}>{item.sector}</Typography>
                            <Typography level="body-sm" sx={{ color: secondary, lineHeight: 1.75 }}>{item.story}</Typography>
                        </Card>
                    ))}
                </Box>
            </Container>

            <Divider sx={{ opacity: 0.07 }} />

            {/* ── SECTION 6: TESTIMONIALS ────────────────────────── */}
            <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
                <Typography level="body-sm" sx={{ color: accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", mb: 1.5 }}>
                    Social Proof
                </Typography>
                <Typography level="h2" sx={{ color: primary, fontWeight: 800, fontSize: { xs: "1.9rem", md: "2.5rem" }, mb: 6 }}>
                    What our clients are saying
                </Typography>
                <TestimonialCarousel testimonials={testimonials} variant="brochure" />
            </Container>

            <Divider sx={{ opacity: 0.07 }} />

            {/* ── SECTION 7: URGENCY ─────────────────────────────── */}
            <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
                <Typography level="h2" sx={{ color: primary, fontWeight: 800, fontSize: { xs: "1.9rem", md: "2.8rem" }, lineHeight: 1.2, mb: 4 }}>
                    This window will not be open forever.
                </Typography>
                <Stack spacing={3}>
                    <Typography level="body-lg" sx={{ color: secondary, lineHeight: 1.8 }}>
                        Right now, most of your competitors are not doing this. They are still in SEO mode while their customers have moved to AI search.
                        The brands that move first win the most ground — and get to hold it.
                    </Typography>
                    <Typography level="body-lg" sx={{ color: secondary, lineHeight: 1.8 }}>
                        Early SEO adopters in 2009 held page-one rankings for years. This is that same moment, but for AI search.
                        The question is whether you act on it now, or watch someone else claim your space.
                    </Typography>
                    <Card sx={{ bgcolor: "rgba(46,212,122,0.04)", border: `1px solid rgba(46,212,122,0.2)`, p: 3.5, borderRadius: "16px" }}>
                        <Typography level="title-md" sx={{ color: accent, fontWeight: 700, mb: 0.5 }}>Our Current Stage: Free Pilot</Typography>
                        <Typography level="body-md" sx={{ color: secondary, lineHeight: 1.75 }}>
                            We are working with a small group of early clients on a completely free pilot. You get the full audit, full access to the conversion tracker,
                            and a complete fix plan — at zero cost. We do this because we want proof of what GodsEye can do, and you deserve to see value before you spend anything.
                        </Typography>
                        <Typography level="body-sm" sx={{ color: secondary, mt: 1.5 }}>
                            What's included in the pilot:
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, mt: 1, color: secondary }}>
                            <li><Typography level="body-sm" sx={{ color: secondary }}>Full AI Visibility Audit across Perplexity and Google AI</Typography></li>
                            <li><Typography level="body-sm" sx={{ color: secondary }}>7 days of live Conversion & CTA Tracking on your website</Typography></li>
                            <li><Typography level="body-sm" sx={{ color: secondary }}>A prioritized, specific fix plan for your team</Typography></li>
                        </Box>
                    </Card>
                </Stack>
            </Container>

            {/* ── CTA BLOCK ──────────────────────────────────────── */}
            <Box sx={{ borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`, bgcolor: "rgba(46,212,122,0.03)" }}>
                <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 }, textAlign: "center" }}>
                    <Typography level="h2" sx={{ color: primary, fontWeight: 800, fontSize: { xs: "2rem", md: "2.8rem" }, lineHeight: 1.2, mb: 2 }}>
                        One conversation. That's the ask.
                    </Typography>
                    <Typography level="body-lg" sx={{ color: secondary, maxWidth: 560, mx: "auto", lineHeight: 1.8, mb: 5 }}>
                        Let us show you how AI currently views your brand — and exactly how much revenue you are leaving on the table. If you see value, we continue. If not, you keep the audit.
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" alignItems="center">
                        <Button
                            component="a"
                            href="mailto:santoshpatil@godseyes.world"
                            size="lg"
                            variant="solid"
                            sx={{ backgroundColor: accent, color: "#000", fontWeight: 700, px: 5, py: 1.5, fontSize: "1rem", "&:hover": { backgroundColor: "#26B869" } }}
                        >
                            Email Santosh Patil
                        </Button>
                        <Button
                            component="a"
                            href="/auth"
                            size="lg"
                            variant="outlined"
                            sx={{
                                borderColor: "rgba(46,212,122,0.4)", color: primary, fontWeight: 600,
                                px: 5, py: 1.5, fontSize: "1rem",
                                "&:hover": { borderColor: accent, bgcolor: "rgba(46,212,122,0.06)" }
                            }}
                        >
                            Try the Platform
                        </Button>
                    </Stack>
                    <Typography level="body-xs" sx={{ color: secondary, mt: 2 }}>
                        santoshpatil@godseyes.world
                    </Typography>
                </Container>
            </Box>

            {/* ── FOOTER ─────────────────────────────────────────── */}
            <Container maxWidth="lg" sx={{ py: 4, textAlign: "center" }}>
                <Typography level="body-sm" sx={{ color: "rgba(242,245,250,0.25)" }}>
                    © 2025 GodsEye — AI Visibility & Conversion Intelligence
                </Typography>
            </Container>
        </Box>
    );
}
