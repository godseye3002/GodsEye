"use client"

import React, { useState } from 'react'
import {
  Box,
  Typography,
  Stack,
  IconButton,
} from "@mui/joy"
import { DM_Mono, DM_Sans, Fraunces } from 'next/font/google'
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { cn } from '@/lib/utils'

const dmMono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-dm-mono' })
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-dm-sans' })
const fraunces = Fraunces({ subsets: ['latin'], weight: ['300', '600'], style: ['normal', 'italic'], variable: '--font-fraunces' })

// ─── Signal Layer definitions (for Signal Anatomy tab) ──────────────
const SIGNAL_LAYERS = [
  { name: "Layer 1 — Structural signals", color: "#534AB7", items: ["JSON-LD schema markup", "robots.txt AI agent permissions", "sitemap.xml completeness", "Page speed & crawl budget", "SSR vs CSR rendering"] },
  { name: "Layer 2 — Entity signals", color: "#1D9E75", items: ["Product category definition", "Brand disambiguation", "Founder / team identity", "Company registration data", "Pricing transparency"] },
  { name: "Layer 3 — Content signals", color: "#BA7517", items: ["Question-shaped headings", "Answer-in-first-sentence pattern", "FAQ section presence", "Use-case query coverage", "Definitional / glossary content"] },
  { name: "Layer 4 — Authority signals", color: "#D85A30", items: ["Editorial backlink count", "Named source citations", "E-E-A-T indicators", "Verifiable testimonials", "Press mentions"] },
  { name: "Layer 5 — Topical depth signals", color: "#3B3489", items: ["Blog / content volume", "Long-form article count", "Internal linking density", "Topic cluster structure", "Content update frequency"] },
]

interface LandingPageAuditCardProps {
  onBack?: () => void
  auditData: any
}

// ─── Reusable Styled Component ─────────────────────────────────────
const StoryCard = ({ children, sx = {} }: any) => (
  <Box sx={{
    bgcolor: 'rgba(255,255,255,0.04)',
    borderRadius: '12px',
    p: '1rem 1.25rem',
    mb: '10px',
    ...sx
  }}>
    {children}
  </Box>
)

const LandingPageAuditCard = ({ onBack, auditData }: LandingPageAuditCardProps) => {
  const [activeTab, setActiveTab] = useState<'hypotheses' | 'anatomy' | 'story'>('hypotheses')
  const [expandedCard, setExpandedCard] = useState<number | null>(null)

  // ─── Parse data ──────────────────────────────────────────────────
  const hypotheses = auditData?.hypotheses || []
  const dimensionScores = auditData?.dimension_scores || {}
  const llmSelectionStory = auditData?.llm_selection_story || []

  // Parse overall score
  const overallScoreRaw = auditData?.overall_score || '0 / 15'
  let passedCount = 0
  let totalCount = 15
  if (typeof overallScoreRaw === 'string' && overallScoreRaw.includes('/')) {
    const parts = overallScoreRaw.split('/')
    passedCount = parseInt(parts[0].trim()) || 0
    totalCount = parseInt(parts[1].trim()) || 15
  } else {
    passedCount = parseInt(overallScoreRaw) || 0
  }
  const scorePercent = Math.round((passedCount / totalCount) * 100)
  const scoreColor = scorePercent >= 60 ? '#5dcaa5' : scorePercent >= 35 ? '#ef9f27' : '#f09595'
  const scoreLabel = scorePercent >= 60 ? 'Good' : scorePercent >= 35 ? 'Needs work' : 'Critical'

  // ─── Helper functions matching dark theme spec ───────────────────
  const getBarColor = (conf: number) => {
    if (conf >= 80) return "#1D9E75" // pass
    if (conf >= 60) return "#BA7517" // warn
    return "#E24B4A" // fail
  }

  const getTierBadge = (tier: string) => {
    // Expected tiers based on the HTML
    switch (tier?.toLowerCase()) {
      case 'high': return { text: '#5dcaa5', bg: '#04342c', label: 'Critical signal' } // green
      case 'medium': return { text: '#ef9f27', bg: '#412402', label: 'Important signal' } // orange
      default: return { text: '#f09595', bg: '#501313', label: 'Supporting signal' } // red
    }
  }

  const getDotColor = (status: string) => {
    switch (status) {
      case 'pass': return '#5dcaa5'
      case 'fail': return '#f09595'
      case 'warn': return '#ef9f27'
      default: return 'rgba(255,255,255,0.2)'
    }
  }

  // ─── Dimension Score entries ─────────────────────────────────────
  let dimensionEntries = Object.entries(dimensionScores).map(([key, val]: [string, any]) => {
    let score = 0
    if (typeof val === 'number') {
      score = val
    } else if (val && typeof val === 'object' && 'score' in val) {
      score = typeof val.score === 'number' ? val.score : parseInt(val.score) || 0
    } else {
      score = parseInt(val as string) || 0
    }

    // Format label: Replace "_" with space and capitalize each word
    const label = key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    return { label, score }
  })

  // // Provide fallback default if no dimension scores provided from AI
  // if (dimensionEntries.length === 0) {
  //   dimensionEntries = [
  //     { label: "Entity clarity", score: 80 },
  //     { label: "Structured data", score: 10 },
  //     { label: "Q&A surface", score: 20 },
  //     { label: "Topical authority", score: 50 },
  //     { label: "Citation signals", score: 15 },
  //     { label: "Technical crawl", score: 60 },
  //   ]
  // }

  // ─── Tabs ────────────────────────────────────────────────────────
  const tabs = [
    { id: 'hypotheses' as const, label: 'Hypotheses' },
    { id: 'anatomy' as const, label: 'Signal anatomy' },
    { id: 'story' as const, label: 'The LLM selection story' },
  ]

  return (
    <Box
      className={cn(dmSans.variable, dmMono.variable, fraunces.variable)}
      sx={{
        maxWidth: '880px',
        mx: 'auto',
        p: { xs: 2, md: 3 },
        pt: { xs: 0.5, md: 0.5 },
        pb: { xs: 3, md: 6 },
        '& *': { fontFamily: 'var(--font-dm-sans), sans-serif' }
      }}
    >
      {/* ─── Header ───────────────────────────────────────────────── */}
      <Box sx={{ mb: 3, position: 'relative' }}>
        {onBack && (
          <IconButton
            variant="plain"
            onClick={onBack}
            sx={{
              position: 'absolute',
              left: -48,
              top: -4,
              color: 'rgba(255,255,255,0.4)',
              '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
              borderRadius: '50%',
              display: { xs: 'none', md: 'flex' }
            }}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2.5} />
          </IconButton>
        )}
        <Typography sx={{ fontSize: '18px', fontWeight: 500, color: '#e8e6de', mb: '4px' }}>
          AEO Site Audit Framework
        </Typography>
        <Typography sx={{ fontSize: '13px', color: '#9c9a92' }}>
          How well does a website sell itself to AI crawlers? {hypotheses.length || 15} scored hypotheses.
        </Typography>
      </Box>

      {/* ─── Tab Navigation ───────────────────────────────────────── */}
      <Stack direction="row" spacing={1} sx={{ mb: '1.25rem', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <Box
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            sx={{
              px: '14px',
              py: '6px',
              fontSize: '12px',
              border: '0.5px solid',
              borderColor: activeTab === tab.id ? '#e8e6de' : 'rgba(255,255,255,0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              color: activeTab === tab.id ? '#1e1e1c' : '#9c9a92',
              bgcolor: activeTab === tab.id ? '#e8e6de' : 'transparent',
              transition: 'all .15s'
            }}
          >
            {tab.label}
          </Box>
        ))}
      </Stack>

      {/* ═══════════════════════════════════════════════════════════════
          TAB 1 — HYPOTHESES
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'hypotheses' && (
        <Box>
          {/* Score Overview Ring Wrap */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            m: '1rem 0 1.5rem',
            p: '1rem 1.25rem',
            bgcolor: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            flexDirection: { xs: 'column', md: 'row' }
          }}>
            <Box sx={{ minWidth: { md: 140 }, textAlign: { xs: 'center', md: 'left' } }}>
              <Typography sx={{ fontSize: '36px', fontWeight: 500, color: '#e8e6de', lineHeight: 1 }}>
                {passedCount} / {totalCount}
              </Typography>
              <Typography sx={{ fontSize: '12px', color: '#9c9a92', mt: '4px' }}>
                Sample GodsEye.ai score<br />
                <span style={{ color: scoreColor }}>{scoreLabel}</span>
              </Typography>
            </Box>

            <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', width: '100%' }}>
              {dimensionEntries.map((dim, idx) => {
                const dimColor = dim.score >= 60 ? '#2ED47A' : dim.score >= 35 ? '#F59E0B' : '#F4604A'
                return (
                  <Box key={idx} sx={{ fontSize: '12px' }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', mb: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {dim.label}
                    </Typography>
                    <Box sx={{ height: '4px', bgcolor: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <Box sx={{ width: `${dim.score}%`, height: '100%', bgcolor: dimColor, borderRadius: '4px', boxShadow: `0 0 10px ${dimColor}44` }} />
                    </Box>
                  </Box>
                )
              })}
            </Box>
          </Box>

          {/* Hypotheses description */}
          <Typography sx={{ fontSize: '12px', color: '#9c9a92', mb: '1rem' }}>
            Click any card to expand the audit checklist for that signal. Confidence = probability this hypothesis is causal in AI citation selection.
          </Typography>

          {/* Hypotheses Grid */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: '12px',
            alignItems: 'start'
          }}>
            {hypotheses.map((h: any, idx: number) => {
              const conf = parseInt(h.confidence) || parseInt(h.conf) || 0
              const tier = h.tier || h.impact || 'medium'
              const tierInfo = getTierBadge(tier)
              const isExpanded = expandedCard === idx
              const signals = h.signals || h.evidence || []
              const desc = h.mechanism_explanation || h.mechanism || h.desc || ''

              return (
                <Box
                  key={idx}
                  onClick={() => setExpandedCard(isExpanded ? null : idx)}
                  sx={{
                    bgcolor: 'transparent',
                    border: '0.5px solid',
                    borderColor: isExpanded ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    p: '1rem',
                    cursor: 'pointer',
                    transition: 'border-color .15s',
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.32)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', mb: '8px' }}>
                    <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#e8e6de', lineHeight: 1.3 }}>
                      {h.id || idx + 1}. {h.title}
                    </Typography>
                    <Box sx={{
                      fontSize: '11px',
                      px: '8px',
                      py: '3px',
                      borderRadius: '20px',
                      whiteSpace: 'nowrap',
                      fontWeight: 500,
                      flexShrink: 0,
                      bgcolor: tierInfo.bg,
                      color: tierInfo.text
                    }}>
                      {conf}% confidence
                    </Box>
                  </Box>

                  <Box sx={{ m: '6px 0 4px' }}>
                    <Box sx={{ width: `${conf}%`, height: '100%', bgcolor: getBarColor(conf), borderRadius: '2px' }} />
                    <Box sx={{ fontSize: '11px', color: '#9c9a92', mt: '3px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{h.category || 'General'}</span>
                      <span>{tierInfo.label}</span>
                    </Box>
                  </Box>

                  {isExpanded && (
                    <Box sx={{
                      mt: '8px',
                      pt: '8px',
                      borderTop: '0.5px solid rgba(255,255,255,0.1)'
                    }}>
                      {desc && (
                        <Typography sx={{ fontSize: '12px', color: '#9c9a92', lineHeight: 1.6, mb: '8px' }}>
                          {desc}
                        </Typography>
                      )}
                      {Array.isArray(signals) && signals.length > 0 && (
                        <Box sx={{ mt: '8px' }}>
                          {signals.map((s: any, sIdx: number) => {
                            const signalText = typeof s === 'string' ? s : s.text || s.label || ''
                            const signalStatus = typeof s === 'string' ? 'warn' : (s.status || 'warn')
                            return (
                              <Box key={sIdx} sx={{
                                fontSize: '11px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '6px',
                                m: '4px 0',
                                color: '#9c9a92'
                              }}>
                                <Box sx={{
                                  width: '5px',
                                  height: '5px',
                                  borderRadius: '50%',
                                  mt: '4px',
                                  flexShrink: 0,
                                  bgcolor: getDotColor(signalStatus)
                                }} />
                                <span>{signalText}</span>
                              </Box>
                            )
                          })}
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              )
            })}
          </Box>
        </Box>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 2 — SIGNAL ANATOMY
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'anatomy' && (
        <Box>
          <Typography sx={{
            fontSize: '11px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            color: '#6a6960',
            m: '1.25rem 0 .5rem'
          }}>
            How an LLM crawler selects a source
          </Typography>

          <StoryCard>
            <Typography sx={{ fontSize: '13px', color: '#9c9a92', lineHeight: 1.7 }}>
              When a user asks ChatGPT or Perplexity "what is the best tool for X?", the model doesn't browse live. It either (a) uses retrieval from a pre-indexed corpus, or (b) returns training-time knowledge. Either way, your site was judged <strong style={{ color: '#e8e6de', fontWeight: 500 }}>long before the query happened</strong>. The audit asks: at that moment of judgment, was your site a clear, confident, citable answer?
            </Typography>
          </StoryCard>

          <Typography sx={{
            fontSize: '11px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            color: '#6a6960',
            m: '1.25rem 0 .5rem'
          }}>
            The 5 signal layers
          </Typography>

          <Box>
            {SIGNAL_LAYERS.map((layer, idx) => (
              <StoryCard key={idx} sx={{ borderLeft: `3px solid ${layer.color}`, pl: '1rem' }}>
                <Typography sx={{ fontWeight: 500, color: '#e8e6de', mb: '6px', fontSize: '13px' }}>
                  {layer.name}
                </Typography>
                <Box>
                  {layer.items.map((item, iIdx) => (
                    <Box
                      key={iIdx}
                      sx={{
                        display: 'inline-block',
                        bgcolor: 'rgba(255,255,255,0.02)',
                        border: '0.5px solid rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        py: '2px',
                        px: '8px',
                        fontSize: '11px',
                        m: '2px 3px 2px 0',
                        color: '#9c9a92'
                      }}
                    >
                      {item}
                    </Box>
                  ))}
                </Box>
              </StoryCard>
            ))}
          </Box>
        </Box>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 3 — LLM SELECTION STORY
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'story' && (
        <Box>
          <Typography sx={{
            fontSize: '11px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            color: '#6a6960',
            m: '1.25rem 0 .5rem'
          }}>
            The narrative GodsEye should tell every client
          </Typography>

          <Box>
            {(Array.isArray(llmSelectionStory) && llmSelectionStory.length > 0) ? (
              llmSelectionStory.map((paragraph: any, idx: number) => {
                const text = typeof paragraph === 'string' ? paragraph : (paragraph?.text || paragraph?.content || JSON.stringify(paragraph))
                return (
                  <StoryCard key={idx}>
                    <Typography
                      sx={{
                        fontSize: '13px',
                        color: '#9c9a92',
                        lineHeight: 1.7,
                        '& strong': { color: '#e8e6de', fontWeight: 500 }
                      }}
                    >
                      <span dangerouslySetInnerHTML={{ __html: text.replace(new RegExp('\\*\\*(.*?)\\*\\*', 'g'), '<strong>$1</strong>') }} />
                    </Typography>
                  </StoryCard>
                )
              })
            ) : (
              /* Fallback default story content from user's HTML */
              [
                "<strong>Your website is a salesman who never sleeps.</strong> But right now, the biggest buyers — AI search engines like Perplexity, ChatGPT, and Google AI Overviews — can't hear what your salesman is saying. Not because the salesman is quiet, but because they're speaking the wrong language.",
                "AI engines don't browse your site like a human. They scan for <strong>answer-shaped content</strong>. They look for: \"does this page directly answer a question a real human might ask?\". Your home page says \"optimize your products for AI search\". But when someone asks Perplexity \"how do I get my SaaS listed in ChatGPT results?\" — your page never answers that question directly. It describes what it does, not what the user needs to know.",
                "The second problem is <strong>structural silence</strong>. There is no schema markup telling the crawler this is a SaaS product with a defined category, pricing tier, and use case. No FAQ schema. No Organization schema. To the crawler, you're just text on a page — indistinguishable from a blog post written about AEO, not a product that delivers AEO.",
                "The third problem is <strong>citation poverty</strong>. LLMs prefer sources that other credible sources have pointed to. Every backlink is a vote that says \"this source knows what it's talking about\". A site with zero citations in the AI-indexed corpus is like a salesman with no LinkedIn profile, no references, and no Google results. Invisible by default.",
                "<strong>The opportunity</strong>: these gaps are fixable, and most competitors haven't fixed them yet. The window to establish topical authority in AI search for \"AEO\" and \"answer engine optimization\" is still open. The audit tells you exactly which gaps to close, in what order, with what expected return."
              ].map((text, idx) => (
                <StoryCard key={idx}>
                  <Typography
                    sx={{
                      fontSize: '13px',
                      color: '#9c9a92',
                      lineHeight: 1.7,
                      '& strong': { color: '#e8e6de', fontWeight: 500 }
                    }}
                  >
                    <span dangerouslySetInnerHTML={{ __html: text }} />
                  </Typography>
                </StoryCard>
              ))
            )}
          </Box>
        </Box>
      )}

    </Box>
  )
}

export default LandingPageAuditCard
