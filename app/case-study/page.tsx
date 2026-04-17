"use client";

import { Box, Typography, Button, Container, Divider, Sheet } from "@mui/joy";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const markdownContent = `# GodsEye: The Infrastructure for Brand Reputation in the Age of AI

**Case Study · 2026**

> The platform that identified the real value hidden beneath the AI visibility gold rush - and why brands that miss this window will spend 10x more to catch up.

---

## The Opportunity at a Glance

| Metric | Value |
|--------|-------|
| Projected AI-PR market by 2027 | $4.2B |
| B2B buyers who consult AI before contacting a vendor | 73% |
| Platforms solving AI reputation (not just visibility) today | 0 |
| GodsEye pilot period | Q4 2025 – Q1 2026 |

---

## Part 01 · The Market Thesis

### Everyone is optimizing for the wrong layer

The market is chasing AEO and GEO - getting brands to *appear* in AI responses. That is the entry-level problem. The harder, more valuable problem is controlling what AI *says* once a brand appears.

Visibility without reputation is not an asset. It is a liability.

> **The core risk:** If AI mentions your brand alongside negative Reddit threads, outdated controversies, or a competitor comparison that favors someone else - that single response does more damage than not appearing at all. Millions of users receive that verdict in seconds, treat it as fact, and move on.

The real opportunity is not the visibility layer. It is the narrative layer above it.

### Where GodsEye Sits

| Layer | What It Solves |
|-------|---------------|
| **AI-PR & Narrative Engineering** | What AI says about you - GodsEye's core |
| Sentiment Monitoring | How AI sentiment shifts over time |
| AEO / GEO | Whether you appear - where the market is today |

---

## Part 02 · Why This Moment Matters

### AI is the new narrator - and people believe it

People have always trusted the most authoritative voice in the room. Before, that was media. Today, it is AI. Users are not cross-checking AI responses the way they skim search results. They ask, receive an answer, and act on it.

Brands are no longer just selling to customers. They are selling to AI - and AI is selling to customers on their behalf. The brands that build a strong AI reputation in the next 18–24 months will compound that advantage for years. The ones that wait will pay a correction premium that grows over time.

> *"If people see AI recommending a brand, they trust that brand. If AI surfaces something negative, they act on it - faster than any press cycle could move."*

---

## Part 03 · This Is a PR Problem, Not a Tech Problem

Reputation management has always been non-negotiable for serious brands. When a CEO controversy emerges, the response is immediate - because leaving perception unmanaged destroys value faster than almost any operational failure.

AI is now a full participant in that ecosystem. It forms opinions, holds them, and communicates them to every user who asks - simultaneously, at scale, with the authority of a trusted advisor. GodsEye treats AI as what it actually is: the most influential PR channel that has ever existed.

---

## Part 04 · Pilot Results

*The following results are from GodsEye's pilot period (Q4 2025 – Q1 2026) across four early clients. Sample sizes are small and results will vary - but the directional signal is consistent.*

---

### B2B Services Firm

**Problem:** Strong offline reputation, near-zero positive AI presence. Competitors were being recommended in their category.

**After 60 days with GodsEye:**

| Metric | Change |
|--------|--------|
| Positive AI mentions in category queries | +55% |
| Inbound leads citing AI as discovery channel | +18% |
| Sales cycle length | −12% |

*"We didn't know AI was hurting us until GodsEye showed us what it was actually saying."*

---

### D2C Consumer Brand

**Problem:** A 2-year-old product issue kept surfacing in AI responses. The brand had moved on - AI hadn't.

**After 45 days with GodsEye:**

| Metric | Change |
|--------|--------|
| Unprompted negative sentiment citations | −68% |
| Neutral-to-positive shift in AI brand descriptions | Confirmed across 4 major models |
| Customer support queries referencing AI misinformation | −30% |

---

### Regional Retail Chain (Expansion Phase)

**Problem:** Expanding from one city to three. No AI presence in new markets. Larger competitors had established reputations.

**After 90 days with GodsEye:**

| Metric | Change |
|--------|--------|
| Brand mentions in new-market AI queries | 0 → present in 6 of 10 category queries |
| Franchise inquiry volume | +22% |
| Time to first AI recommendation in new markets | 5 weeks |

---

### Founder / Personal Brand

**Problem:** An old legal mention kept appearing when prospects and investors researched the founder's name via AI.

**After 30 days with GodsEye:**

| Metric | Change |
|--------|--------|
| Negative association in founder-name queries | Dropped from primary result to absent in most responses |
| Investor meeting conversion rate (warm intros) | +15% |
| Founder's own assessment | "Noticeably cleaner across the board" |

---

### What the Pilot Tells Us

These are early numbers from a small sample. What they confirm is the mechanism - that AI sentiment is malleable, that it directly affects downstream business outcomes, and that brands respond urgently once they see what AI is saying about them. The conversion tracker exists precisely to make this link measurable over time, not just anecdotal.

---

## Part 05 · The Market Ahead

### Brands, startups, and personal brands - all the same problem

The TAM is wider than it looks. Every serious brand - regardless of size or sector - has a reputation it needs to protect in AI. That includes:

- **Enterprises** running procurement, partnerships, and hiring through AI-assisted research
- **Growth startups** where a founder's AI reputation directly affects fundraising and hiring
- **Local brands going national**, who have a rare first-mover window before incumbents wake up
- **Celebrity and personal brands** - especially in India, where reputation spend is enormous and AI is already shaping public perception at scale

The personal brand angle alone is a multi-hundred-million dollar market. Celebrities, athletes, and public figures already spend heavily on traditional PR. AI-PR is the natural next line item - and no one is selling it to them yet.

### Why Startups Have the Advantage Right Now

Established brands have not optimized their AI reputation. The gap between a well-funded incumbent and a smart regional startup is smaller in AI-PR than it has ever been in any other marketing channel. That window is open today. It will not stay open.

---

## Closing

### GodsEye is not selling visibility. It is selling the outcome of being believed.

The AEO/GEO market is real. But it is the floor, not the ceiling. The brands that win the next decade will not just appear in AI - they will be trusted by it. GodsEye is the infrastructure that makes that possible.

---

> *"It doesn't matter if the clients come from the internet or not. If founders care about the reputation of what they're building, they will invest in this. And every serious founder cares."*
>
> - **Santosh Patil, Founder - GodsEye**

---

*GodsEye · godseyes.world · All pilot metrics tracked from Q4 2025 – Q1 2026. Results are directional and based on a limited pilot cohort. Individual outcomes will vary.*`;

export default function CaseStudyPage() {
  const router = useRouter();

  return (
    <Box sx={{ 
      minHeight: "100vh", 
      backgroundColor: "#0D0F14", 
      color: "#F2F5FA",
      py: { xs: 4, md: 6 },
      px: { xs: 2, md: 3 },
      position: "relative",
      overflowX: "hidden"
    }}>
      {/* Background Sheen */}
      <Box sx={{
        position: "fixed", top: "-10%", left: "50%", transform: "translateX(-50%)",
        width: "100vw", height: "50vh",
        background: "radial-gradient(circle at center, rgba(46,212,122,0.08) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          <Button
            variant="plain"
            onClick={() => router.push("/")}
            startDecorator={<HugeiconsIcon icon={ArrowLeft02Icon} size={20} />}
            sx={{ 
                mb: 4, 
                color: "rgba(242, 245, 250, 0.45)",
                fontWeight: 600,
                fontSize: "0.95rem",
                letterSpacing: "0.02em",
                fontFamily: "var(--font-khand)",
                "&:hover": { color: "#2ED47A", backgroundColor: "rgba(46,212,122,0.05)" },
                transition: "all 0.2s ease"
            }}
          >
            Back to Home
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.99, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        >
          <Sheet sx={{
            bgcolor: "rgba(17,19,24,0.4)",
            border: "1px solid rgba(46,212,122,0.12)",
            borderRadius: "24px",
            p: { xs: 4, md: 5 },
            boxShadow: "0 40px 100px -20px rgba(0,0,0,0.5)",
            backdropFilter: "blur(20px)",
          }}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <Typography level="h1" sx={{ 
                      fontSize: { xs: "2.75rem", md: "4.2rem" }, 
                      fontWeight: 900, 
                      mb: 2, 
                      lineHeight: 1.05,
                      fontFamily: "var(--font-array)",
                      letterSpacing: "-0.04em",
                      background: "linear-gradient(to bottom, #F2F5FA 0%, rgba(242, 245, 250, 0.5) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                  }}>
                    {children}
                  </Typography>
                ),
                h2: ({ children }) => (
                    <Box sx={{ mt: 10, mb: 4 }}>
                        <Typography level="h2" sx={{ 
                            fontSize: { xs: "1.85rem", md: "2.5rem" }, 
                            fontWeight: 800, 
                            color: "#2ED47A",
                            fontFamily: "var(--font-khand)",
                            letterSpacing: "0.03em",
                            lineHeight: 1.1,
                            textTransform: "uppercase"
                        }}>
                        {children}
                        </Typography>
                        <Divider sx={{ mt: 2, opacity: 0.1, bgcolor: "#2ED47A" }} />
                    </Box>
                ),
                h3: ({ children }) => (
                  <Typography level="h3" sx={{ 
                      fontSize: "1.6rem", 
                      fontWeight: 700, 
                      mt: 6, 
                      mb: 2.5, 
                      color: "#F2F5FA",
                      fontFamily: "var(--font-khand)",
                      letterSpacing: "0.01em"
                  }}>
                    {children}
                  </Typography>
                ),
                p: ({ children }) => (
                  <Typography sx={{ 
                      fontSize: "1.1rem", 
                      lineHeight: 1.85, 
                      mb: 3, 
                      color: "rgba(242, 245, 250, 0.75)",
                      fontFamily: "var(--font-khand)",
                      fontWeight: 400
                  }}>
                    {children}
                  </Typography>
                ),
                blockquote: ({ children }) => (
                  <Box sx={{ 
                      my: 6, 
                      pl: 4, 
                      py: 1.5,
                      borderLeft: "4px solid #2ED47A", 
                      bgcolor: "rgba(46,212,122,0.04)",
                      borderRadius: "0 16px 16px 0",
                      fontStyle: "italic"
                  }}>
                    {children}
                  </Box>
                ),
                table: ({ children }) => (
                  <div style={{ margin: '3rem 0', overflowX: 'auto' }}>
                    <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        fontFamily: 'var(--font-khand)'
                    }}>
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {children}
                  </thead>
                ),
                th: ({ children }) => (
                  <th style={{ 
                      padding: '1.25rem 1.5rem', 
                      textAlign: 'left', 
                      fontWeight: 700, 
                      color: '#2ED47A',
                      fontSize: '0.9rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em'
                  }}>
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td style={{ 
                      padding: '1.25rem 1.5rem', 
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      color: 'rgba(242,245,250,0.85)',
                      fontSize: '1.05rem',
                      lineHeight: '1.4'
                  }}>
                    {children}
                  </td>
                ),
                strong: ({ children }) => (
                  <Typography component="strong" sx={{ fontWeight: 800, color: "#F2F5FA", display: "inline" }}>
                    {children}
                  </Typography>
                ),
                hr: () => (
                    <Divider sx={{ my: 8, opacity: 0.05 }} />
                )
              }}
            >
              {markdownContent}
            </ReactMarkdown>
          </Sheet>
        </motion.div>

        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 1, delay: 0.8 }}
           style={{ textAlign: "center", marginTop: "4rem" }}
        >
             <Typography sx={{ color: "rgba(242,245,250,0.25)", fontSize: "0.85rem", letterSpacing: "0.05em" }}>
                END OF CASE STUDY
             </Typography>
        </motion.div>
      </Container>
    </Box>
  );
}
