"use client"

import React, { useState } from 'react'
import {
  Box,
  Card,
  Typography,
  Stack,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AccordionGroup,
  Grid,
  Sheet
} from "@mui/joy"
import { DM_Mono, DM_Sans, Fraunces } from 'next/font/google'
import { HugeiconsIcon } from "@hugeicons/react"
import ReactMarkdown from 'react-markdown'
import {
  AlertCircleIcon,
  Shield01Icon,
  Target02Icon,
  Search01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ZapIcon,
  CheckCircle,
  CursorIcon,
  UserGroupIcon
} from "@hugeicons/core-free-icons"
import { IconButton } from "@mui/joy"
import { cn } from '@/lib/utils'

const dmMono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-dm-mono' })
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-dm-sans' })
const fraunces = Fraunces({ subsets: ['latin'], weight: ['300', '600'], style: ['normal', 'italic'], variable: '--font-fraunces' })

interface HypothesesItem {
  id: string
  title: string
  conf: number
  impact: 'Critical' | 'High' | 'Medium'
  category: string
  evidence: { label: string; content: string }[]
  reasoning: string
  fix: string
}

interface WebsiteAuditCardProps {
  onBack?: () => void
  auditData: any
}

const WebsiteAuditCard = ({ onBack, auditData }: WebsiteAuditCardProps) => {
  const [index, setIndex] = React.useState<number | null>(null);

  // Map JSON HYPOTHESES to UI format
  const hypotheses: HypothesesItem[] = auditData?.HYPOTHESES?.map((h: any, i: number) => {
    const key = Object.keys(h).find(k => k.startsWith('H')) || 'H1'
    return {
      id: `h${i + 1}`,
      title: h[key],
      conf: parseInt(h.Confidence),
      impact: h.Impact as any,
      category: h.Category,
      evidence: (Array.isArray(h.Evidence_from_input_data) ? h.Evidence_from_input_data : []).map((ev: string) => {
        const parts = ev.split(' — ');
        return {
          label: parts[0] || 'Signal',
          content: parts[1] || ev
        }
      }),
      reasoning: h.Mechanism,
      fix: h.Recommended_fix
    }
  })

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'critical': return 'danger'
      case 'high': return 'warning'
      default: return 'primary'
    }
  }

  const getConfColor = (c: number) => {
    if (c >= 88) return '#f4604a'
    if (c >= 80) return '#f0a04b'
    return '#2ED47A'
  }

  const scoreRaw = auditData.CCC_RISK_SCORE || '0 / 100 — Unknown'
  const scoreValue = parseInt(scoreRaw.split(' / ')[0])
  const scoreLabel = scoreRaw.split(' — ')[1] || 'Unknown'

  return (
    <Box 
      className={cn(dmSans.variable, dmMono.variable, fraunces.variable)}
      sx={{ 
        maxWidth: '1200px', 
        mx: 'auto', 
        p: { xs: 2, md: 4 },
        pt: { xs: 0, md: 0 },
        '& *': { fontFamily: 'var(--font-dm-sans), sans-serif' }
      }}
    >
      
      {/* Header Section */}
      <Stack spacing={4} sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {onBack && (
            <IconButton 
              variant="plain" 
              onClick={onBack}
              sx={{ 
                color: 'rgba(255,255,255,0.4)', 
                '&:hover': { color: '#2ED47A', bgcolor: 'rgba(46, 212, 122, 0.1)' },
                borderRadius: '50%'
              }}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2.5} />
            </IconButton>
          )}
          <Box sx={{ 
            p: 1.5, 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, rgba(46, 212, 122, 0.1), rgba(46, 212, 122, 0.02))',
            border: '1px solid rgba(46, 212, 122, 0.2)'
          }}>
            <HugeiconsIcon icon={Shield01Icon} className="text-[#2ED47A]" />
          </Box>
          <Box>
            <Typography level="h2" sx={{ color: '#fff', mb: 0.5, fontFamily: 'var(--font-fraunces), serif' }}>Website Audit Report</Typography>
            <Typography level="body-sm" sx={{ color: 'rgba(242, 245, 250, 0.5)', fontFamily: 'var(--font-dm-mono), monospace' }}>
              Competitive Content Cannibalization Analysis • {auditData.AUDIT_HEADER.Publishing_brand}
            </Typography>
          </Box>
        </Box>

        <Card variant="outlined" sx={{ 
          background: 'linear-gradient(135deg, rgba(13, 15, 20, 0.8), rgba(10, 12, 16, 0.9))',
          borderColor: 'rgba(46, 212, 122, 0.2)',
          borderRadius: '20px',
          p: 4
        }}>
          <Grid container spacing={4} alignItems="center">
            <Grid xs={12} md={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Box sx={{ 
                  width: 120, 
                  height: 120, 
                  borderRadius: '50%', 
                  p: '3px',
                  background: `conic-gradient(${scoreValue > 70 ? '#f4604a' : '#2ED47A'} ${scoreValue}%, rgba(255,255,255,0.05) 0)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  boxShadow: scoreValue > 70 ? '0 0 20px rgba(244, 96, 74, 0.15)' : '0 0 20px rgba(46, 212, 122, 0.15)'
                }}>
                  <Box sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    bgcolor: '#0D0F14',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Typography sx={{ color: scoreValue > 70 ? '#f4604a' : '#2ED47A', fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-dm-mono), monospace', lineHeight: 1 }}>
                      {scoreValue}
                    </Typography>
                    <Typography level="body-xs" sx={{ color: 'rgba(255,255,255,0.4)', mt: 0, fontFamily: 'var(--font-dm-mono), monospace' }}>/ 100</Typography>
                  </Box>
                </Box>
                <Chip variant="soft" color={scoreValue > 70 ? 'danger' : 'success'} sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '10px' }}>
                  {scoreLabel} Risk
                </Chip>
              </Box>
            </Grid>
            <Grid xs={12} md={9}>
              <Typography level="h3" sx={{ color: '#fff', mb: 1, display: 'flex', alignItems: 'center', gap: 1, fontFamily: 'var(--font-fraunces), serif', fontWeight: 300, fontSize: '1.75rem' }}>
                <HugeiconsIcon icon={AlertCircleIcon} className="text-[#f4604a] size-6" />
                Your page is feeding <em style={{ fontStyle: 'italic', color: '#f4604a' }}>your competitors.</em>
              </Typography>
              <Box sx={{ 
                '& p': { 
                  margin: 0, 
                  color: 'rgba(242, 245, 250, 0.7)', 
                  lineHeight: 1.7, 
                  mb: 3,
                  fontFamily: 'var(--font-dm-sans), sans-serif'
                },
                '& strong': { color: '#fff', fontWeight: 600 }
              }}>
                <ReactMarkdown>{auditData.summary}</ReactMarkdown>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1, p: 2, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Typography level="body-xs" sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', tracking: '0.1em', mb: 1, fontFamily: 'var(--font-dm-mono), monospace' }}>Leak Vectors</Typography>
                  <Typography level="h3" sx={{ color: '#f4604a', fontFamily: 'var(--font-dm-mono), monospace' }}>{auditData.Supporting_metrics.Leak_vectors_found}</Typography>
                </Box>
                <Box sx={{ flex: 1, p: 2, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Typography level="body-xs" sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', tracking: '0.1em', mb: 1, fontFamily: 'var(--font-dm-mono), monospace' }}>Competitors Amplified</Typography>
                  <Typography level="h3" sx={{ color: '#f0a04b', fontFamily: 'var(--font-dm-mono), monospace' }}>{auditData.Supporting_metrics.Competitors_actively_amplified}</Typography>
                </Box>
                <Box sx={{ flex: 1, p: 2, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Typography level="body-xs" sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', tracking: '0.1em', mb: 1, fontFamily: 'var(--font-dm-mono), monospace' }}>3rd-Party Validations</Typography>
                  <Typography level="h3" sx={{ color: '#2ED47A', fontFamily: 'var(--font-dm-mono), monospace' }}>{auditData.Supporting_metrics.Third_party_validations_for_publishing_brand}</Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Card>
      </Stack>

      <Stack spacing={6}>
        {/* Hypotheses Section */}
        <Box>
          <Typography level="title-md" sx={{ color: '#fff', mb: 3, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 1, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11px', fontFamily: 'var(--font-dm-mono), monospace' }}>
            <HugeiconsIcon icon={Target02Icon} className="text-[#2ED47A] size-4" />
            Authority Leak Hypotheses
          </Typography>
          
          <AccordionGroup 
            variant="plain" 
            transition="0.2s"
            sx={{
              '& .MuiAccordion-root': {
                bgcolor: 'rgba(17, 19, 24, 0.4)',
                mb: 1.5,
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.05)',
                overflow: 'hidden',
                '&.Mui-expanded': {
                  borderColor: 'rgba(46, 212, 122, 0.3)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
                }
              }
            }}
          >
            {hypotheses.map((h, i) => (
              <Accordion 
                key={h.id}
                expanded={index === i}
                onChange={(event, expanded) => setIndex(expanded ? i : null)}
              >
                <AccordionSummary 
                  indicator={<HugeiconsIcon icon={ArrowDown01Icon} className="size-4" />}
                  sx={{ p: 2 }}
                >
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                    <Box sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '8px', 
                      bgcolor: 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-dm-mono), monospace'
                    }}>
                      H{i + 1}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ 
                        '& p': { margin: 0, color: '#fff', fontWeight: 500, fontSize: '0.875rem' },
                        '& strong': { fontWeight: 700, color: '#2ED47A' }
                      }}>
                        <ReactMarkdown>{h.title}</ReactMarkdown>
                      </Box>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ width: 80, height: 4, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                          <Box sx={{ width: `${h.conf}%`, height: '100%', bgcolor: getConfColor(h.conf), borderRadius: 2 }} />
                        </Box>
                        <Typography level="body-xs" sx={{ color: getConfColor(h.conf), fontWeight: 700, fontFamily: 'var(--font-dm-mono), monospace' }}>{h.conf}%</Typography>
                        <Chip size="sm" variant="soft" color={getImpactColor(h.impact)} sx={{ fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-dm-mono), monospace' }}>
                          {h.impact}
                        </Chip>
                        <Typography level="body-xs" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>{h.category}</Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <Box sx={{ p: 3, bgcolor: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Typography level="body-xs" sx={{ color: 'rgba(255,255,255,0.4)', mb: 2, textTransform: 'uppercase', tracking: '0.05em', fontFamily: 'var(--font-dm-mono), monospace' }}>Identified Signals</Typography>
                    <Stack spacing={1.5} sx={{ mb: 4 }}>
                      {h.evidence.map((ev, idx) => (
                        <Sheet key={idx} variant="soft" sx={{ 
                          p: 2, 
                          borderRadius: '8px', 
                          bgcolor: 'rgba(255,255,255,0.02)',
                          borderLeft: '3px solid rgba(46, 212, 122, 0.4)'
                        }}>
                          <Typography level="body-xs" sx={{ color: 'rgba(46, 212, 122, 0.8)', fontWeight: 600, mb: 0.5, fontFamily: 'var(--font-dm-mono), monospace' }}>{ev.label}</Typography>
                          <Typography level="body-sm" sx={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-dm-mono), monospace', wordBreak: 'break-all' }}>
                            {ev.content}
                          </Typography>
                        </Sheet>
                      ))}
                    </Stack>

                    <Typography level="body-xs" sx={{ color: 'rgba(255,255,255,0.4)', mb: 1, textTransform: 'uppercase', fontFamily: 'var(--font-dm-mono), monospace' }}>Why this matters</Typography>
                    <Box sx={{ 
                      '& p': { 
                        margin: 0, 
                        color: 'rgba(255,255,255,0.7)', 
                        lineHeight: 1.6,
                        fontFamily: 'var(--font-dm-sans), sans-serif',
                        mb: 4
                      },
                      '& strong': { color: '#fff', fontWeight: 600 }
                    }}>
                      <ReactMarkdown>{h.reasoning}</ReactMarkdown>
                    </Box>

                    <Box sx={{ 
                      p: 2.5, 
                      borderRadius: '12px', 
                      bgcolor: 'rgba(46, 212, 122, 0.05)',
                      border: '1px solid rgba(46, 212, 122, 0.1)'
                    }}>
                      <Typography level="title-sm" sx={{ color: '#2ED47A', mb: 1, display: 'flex', alignItems: 'center', gap: 1, fontFamily: 'var(--font-dm-mono), monospace' }}>
                        <HugeiconsIcon icon={ZapIcon} className="size-4" />
                        Recommended Fix
                      </Typography>
                      <Box sx={{ 
                        '& p': { 
                          margin: 0, 
                          color: 'rgba(46, 212, 122, 0.8)', 
                          lineHeight: 1.6,
                          fontFamily: 'var(--font-dm-sans), sans-serif'
                        },
                        '& strong': { color: '#2ED47A', fontWeight: 700 }
                      }}>
                        <ReactMarkdown>{h.fix}</ReactMarkdown>
                      </Box>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </AccordionGroup>
        </Box>

        {/* Roadmap Section */}
        <Box>
          <Typography level="title-md" sx={{ color: '#fff', mb: 3, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 1, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11px', fontFamily: 'var(--font-dm-mono), monospace' }}>
            <HugeiconsIcon icon={ZapIcon} className="text-[#f0a04b] size-4" />
            Priority Fix Roadmap
          </Typography>

          <Card variant="outlined" sx={{ 
            bgcolor: 'rgba(17, 19, 24, 0.4)',
            borderColor: 'rgba(255,255,255,0.05)',
            p: 3,
            borderRadius: '16px'
          }}>
            <Stack spacing={0}>
              {auditData?.PRIORITY_FIX_ROADMAP?.map((fixObj: any, idx: number) => {
                const title = Object.keys(fixObj)[0]
                const desc = fixObj[title as keyof typeof fixObj]
                
                let color = idx < 3 ? '#f4604a' : idx < 5 ? '#f0a04b' : '#2ED47A'

                return (
                  <Box key={idx} sx={{ 
                    py: 3, 
                    borderBottom: idx === (auditData?.PRIORITY_FIX_ROADMAP?.length || 0) - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    gap: 2
                  }}>
                    <Box sx={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: '50%', 
                      bgcolor: `${color}15`,
                      border: `1px solid ${color}40`,
                      color: color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 800,
                      shrink: 0,
                      mt: 0.5,
                      fontFamily: 'var(--font-dm-mono), monospace'
                    }}>
                      {idx + 1}
                    </Box>
                    <Box>
                      <Box sx={{ 
                        mb: 0.5,
                        '& p': { margin: 0, color: '#fff', fontWeight: 600, fontSize: '0.875rem' },
                        '& strong': { fontWeight: 700, color: '#2ED47A' }
                      }}>
                        <ReactMarkdown>{title}</ReactMarkdown>
                      </Box>
                      <Box sx={{ 
                        '& p': { margin: 0, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, fontSize: '0.75rem' },
                        '& strong': { fontWeight: 600, color: '#fff' }
                      }}>
                        <ReactMarkdown>{desc}</ReactMarkdown>
                      </Box>
                    </Box>
                  </Box>
                )
              })}
            </Stack>
          </Card>
        </Box>
      </Stack>

      {/* Footer */}
      <Divider sx={{ my: 6, opacity: 0.1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.4, pb: 4 }}>
        <Typography level="body-xs" sx={{ letterSpacing: '0.05em', fontFamily: 'var(--font-dm-mono), monospace' }}>CCC AUDIT FRAMEWORK</Typography>
        <Typography level="body-xs" sx={{ fontFamily: 'var(--font-dm-mono), monospace' }}>
          {auditData.AUDIT_HEADER.Publishing_brand} • {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Typography>
      </Box>
    </Box>
  )
}

export default WebsiteAuditCard
