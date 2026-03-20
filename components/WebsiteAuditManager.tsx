"use client"

import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Card,
  Typography,
  Stack,
  Input,
  Button,
  Grid,
  Chip,
  IconButton,
  Sheet,
  Table,
  Badge,
  CircularProgress,
  Modal,
  ModalDialog,
  ModalClose,
  Divider,
  Skeleton
} from "@mui/joy"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  GlobalIcon,
  ArrowRight01Icon,
  Time02Icon,
  Shield01Icon,
  AlertCircleIcon,
  CheckCircle,
  ZapIcon,
  Delete02Icon
} from "@hugeicons/core-free-icons"
import WebsiteAuditCard from "./WebsiteAuditCard"
import LandingPageAuditCard from "./LandingPageAuditCard"
import { cn } from "@/lib/utils"
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { useProductStore } from '@/app/optimize/store'

interface AuditRecord {
  id: string
  url: string
  title?: string
  date: string
  score: number
  risk: 'High' | 'Medium' | 'Low'
  engine: string
  pageType: 'blog' | 'landing_page' | 'landing'
  metaData?: {
    leakVectors?: string
    overallScoreRaw?: string
    objective?: string
    audience?: string
    bottleneck?: string
  }
}

const SkeletonRowContent = () => (
  <>
    <td>
      <Stack spacing={1}>
        <Skeleton variant="text" level="body-sm" width={180} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Skeleton variant="text" level="body-xs" width={120} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
      </Stack>
    </td>
    <td>
      <Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: '6px', bgcolor: 'rgba(255,255,255,0.08)' }} />
    </td>
    <td>
      <Stack spacing={1}>
        <Skeleton variant="text" level="body-xs" width={50} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Skeleton variant="text" level="body-xs" width={80} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
      </Stack>
    </td>
    <td>
      <Skeleton variant="text" level="body-xs" width={80} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
    </td>
    <td>
      <Skeleton variant="text" level="body-xs" width={40} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
    </td>
    <td>
      <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: '6px', bgcolor: 'rgba(255,255,255,0.08)' }} />
    </td>
    <td>
      <Skeleton variant="circular" width={24} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.08)', ml: 'auto' }} />
    </td>
  </>
);

const WebsiteAuditManager = () => {
  const [view, setView] = useState<'list' | 'report'>('list')
  const [urlInput, setUrlInput] = useState('')
  const [audits, setAudits] = useState<AuditRecord[]>([])
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [selectedAuditData, setSelectedAuditData] = useState<any>(null)
  const [selectedAuditPageType, setSelectedAuditPageType] = useState<string>('blog')

  const { user } = useAuth()
  const currentProductId = useProductStore((state) => state.currentProductId)

  const fetchAudits = useCallback(async (showLoading = true) => {
    if (!user?.id || !currentProductId) return;
    if (showLoading) setIsLoadingList(true);
    try {
        const { data, error } = await supabase
          .from('seo_audits')
          .select('id, url, created_at, ccc_risk_score, aeo_score, page_type, is_landing_page, overall_score, leak_vectors_found, site_summary')
          .eq('user_id', user.id)
          .eq('product_id', currentProductId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const formatted = data.map((row: any) => {
            const isLanding = row.is_landing_page === true || row.page_type === 'landing' || row.page_type === 'landing_page';
            let scoreVal = 0;
            let riskStr: 'High'|'Medium'|'Low' = 'Medium';
            let finalOverallScore = row.overall_score;

            if (isLanding) {
              // Priority 1: Use `overall_score` text column directly if it has a slash
              if (finalOverallScore && finalOverallScore.toString().includes('/')) {
                const parts = finalOverallScore.toString().split('/');
                const passed = parseInt(parts[0]?.trim()) || 0;
                const total = parseInt(parts[1]?.trim()) || 15;
                scoreVal = Math.round((passed / total) * 100);
              } 
              // Priority 2: Fallback to aeo_score (numeric 0-100) and reconstruct string
              else if (row.aeo_score != null) {
                scoreVal = Math.round(parseFloat(row.aeo_score)) || 0;
                const passedNum = Math.round((scoreVal / 100) * 15);
                if (!finalOverallScore) finalOverallScore = `${passedNum} / 15`;
              }
              
              riskStr = scoreVal >= 60 ? 'Low' : scoreVal >= 35 ? 'Medium' : 'High';
            } else {
              // Blog: parse ccc_risk_score (e.g. "72 / 100 — High")
              if (row.ccc_risk_score) {
                const parts = row.ccc_risk_score.split(' / ');
                scoreVal = parseInt(parts[0]) || 0;
                const riskPart = row.ccc_risk_score.split(' — ')[1];
                if (riskPart) {
                  const r = riskPart.trim().toLowerCase();
                  if (r === 'high' || r === 'critical') riskStr = 'High';
                  else if (r === 'low') riskStr = 'Low';
                } else {
                  riskStr = scoreVal > 70 ? 'High' : scoreVal > 30 ? 'Medium' : 'Low';
                }
              }
            }

            let bottleneck = '';
            if (isLanding && row.dimension_scores) {
              const entries = Object.entries(row.dimension_scores);
              if (entries.length > 0) {
                const sorted = entries.sort((a: any, b: any) => {
                  const sA = a[1] && typeof a[1] === 'object' ? (a[1] as any).score : a[1];
                  const sB = b[1] && typeof b[1] === 'object' ? (b[1] as any).score : b[1];
                  return sA - sB;
                });
                const minKey = sorted[0][0];
                const minVal = sorted[0][1];
                const minScore = minVal && typeof minVal === 'object' ? (minVal as any).score : minVal;
                
                if (minScore >= 80) {
                  bottleneck = 'Optimized';
                } else {
                  const labels: Record<string, string> = {
                    'qa_surface': 'Q&A',
                    'entity_clarity': 'Entities',
                    'structured_data': 'Schema',
                    'citation_signals': 'Authority',
                    'topical_authority': 'Topicality',
                    'technical_crawlability': 'Technical'
                  };
                  bottleneck = labels[minKey] || minKey.split('_')[0].charAt(0).toUpperCase() + minKey.split('_')[0].slice(1);
                }
              }
            }

            return {
              id: row.id,
              url: row.url || row.page_audited || 'Unknown URL',
              title: isLanding ? row.site_summary?.title : row.publishing_brand,
              date: new Date(row.created_at).toISOString().split('T')[0],
              score: scoreVal,
              risk: riskStr,
              engine: 'GodsEye AI',
              pageType: isLanding ? 'landing_page' : 'blog',
              metaData: {
                leakVectors: row.leak_vectors_found?.toString() || '0',
                overallScoreRaw: finalOverallScore || (isLanding ? '0 / 15' : '0 / 100'),
                objective: isLanding ? row.site_summary?.objective : undefined,
                bottleneck: bottleneck
              }
            } as AuditRecord;
          });
          setAudits(formatted);
        }
    } catch (err) {
      console.error('Failed to fetch audits:', err);
    } finally {
      if (showLoading) setIsLoadingList(false);
    }
  }, [user?.id, currentProductId]);

  useEffect(() => {
    fetchAudits();

    if (!user?.id || !currentProductId) return;

    const channel = supabase
      .channel('realtime_audits')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'seo_audits', filter: `user_id=eq.${user.id}` },
        () => {
          fetchAudits(false); // Refetch data in the background without triggering loading skeleton
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAudits, user?.id, currentProductId]);

  const [isAuditing, setIsAuditing] = useState(false)

  const products = useProductStore((state) => state.products)
  const currentProduct = products.find(p => p.id === currentProductId)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [auditToDelete, setAuditToDelete] = useState<string | null>(null)

  const handleAudit = async () => {
    if (!urlInput || !user?.id || !currentProductId) return
    
    setIsAuditing(true)
    
    const payload = {
      url: urlInput,
      product_name: currentProduct?.name || "GodsEye Product", 
      user_id: user.id,
      product_id: currentProductId
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log("\n=== TRIGGER: /audit (AI Analysis) ===")
      console.log(`URL: ${payload.url}`)
      console.log("Note: Calling Gemini 2.5 Flash from Bridge...")
    }

    try {
      const auditUrl = process.env.NEXT_PUBLIC_AUDIT_API_URL || 'https://godseye-bridge-scraper-production.up.railway.app/audit'
      
      const response = await fetch(auditUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (process.env.NODE_ENV !== 'production') {
        const resultText = await response.clone().text()
        console.log("API Response:", resultText)
      }

      if (response.status === 200) {
        setUrlInput('')
        // Automatic update handled by Supabase realtime subscription
      } else if (response.status === 501) {
        alert("Error: Playwright not installed on server.")
      } else {
        const errText = await response.text()
        alert(`Error: ${response.status} - ${errText}`)
      }
    } catch (err) {
      console.error("Audit trigger failed:", err)
      alert("Failed to initiate audit. Check console for details.")
    } finally {
      setIsAuditing(false)
    }
  }

  const handleSelectAudit = async (record: AuditRecord) => {
    setIsLoadingDetails(true);
    try {
      // Fetch core audit
      const { data: auditData, error: auditError } = await supabase
        .from('seo_audits')
        .select('*')
        .eq('id', record.id)
        .single();
      
      if (auditError) throw auditError;

      const isLanding = auditData.is_landing_page === true || auditData.page_type === 'landing' || auditData.page_type === 'landing_page';

      // Fetch hypotheses
      const { data: hypoData, error: hypoError } = await supabase
        .from('audit_hypotheses')
        .select('*')
        .eq('audit_id', record.id);
      
      if (hypoError) throw hypoError;

      if (isLanding) {
        // ─── LANDING PAGE reconstruction ─────────────────────────
        const reconstructedData = {
          page_audited: auditData.page_audited || auditData.url,
          overall_score: auditData.overall_score,
          overall_summary: auditData.summary,
          summary: auditData.summary,
          site_summary: auditData.site_summary || { title: auditData.page_audited || auditData.url },
          dimension_scores: auditData.dimension_scores || {},
          llm_selection_story: auditData.llm_selection_story || [],
          hypotheses: (hypoData || []).map((h: any) => ({
            id: parseInt(h.hypothesis_code?.replace('H', '')) || 0,
            title: h.title,
            confidence: parseInt(h.confidence) || 0,
            tier: h.impact || 'medium',
            category: h.category,
            mechanism_explanation: h.mechanism,
            signals: h.evidence || []
          }))
        };

        setSelectedAuditPageType('landing_page');
        setSelectedAuditData(reconstructedData);
      } else {
        // ─── BLOG reconstruction (existing logic) ────────────────
        // Fetch roadmap (blog-only)
        const { data: roadmapData, error: roadmapError } = await supabase
          .from('audit_roadmap_steps')
          .select('*')
          .eq('audit_id', record.id)
          .order('step_order', { ascending: true });
        if (roadmapError) throw roadmapError;

        const reconstructedData = {
          AUDIT_HEADER: {
            Page_audited: auditData.page_audited || auditData.url,
            Publishing_brand: auditData.publishing_brand,
            Primary_topic: auditData.primary_topic,
            Competitors_identified: auditData.competitors_identified,
            Audit_layers_processed: auditData.audit_layers_processed,
          },
          CCC_RISK_SCORE: auditData.ccc_risk_score,
          summary: auditData.summary,
          Supporting_metrics: {
            Leak_vectors_found: auditData.leak_vectors_found,
            Competitors_actively_amplified: auditData.competitors_actively_amplified,
            Third_party_validations_for_publishing_brand: auditData.third_party_validations,
          },
          HYPOTHESES: (hypoData || []).map((h: any) => ({
            [h.hypothesis_code]: h.title,
            Confidence: h.confidence,
            Impact: h.impact,
            Category: h.category,
            Mechanism: h.mechanism,
            Recommended_fix: h.recommended_fix,
            Evidence_from_input_data: h.evidence || [],
          })),
          PRIORITY_FIX_ROADMAP: (roadmapData || []).map((r: any) => ({
            [r.title]: r.description
          }))
        };

        setSelectedAuditPageType('blog');
        setSelectedAuditData(reconstructedData);
      }

      setView('report');
    } catch (err) {
      console.error('Failed to load audit details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setAuditToDelete(id);
    setDeleteModalOpen(true);
  }

  const handleConfirmDelete = async () => {
    if (!auditToDelete) return;
    
    try {
      const { error } = await supabase
        .from('seo_audits')
        .delete()
        .eq('id', auditToDelete);

      if (error) throw error;

      // Update local state
      setAudits(prev => prev.filter(a => a.id !== auditToDelete));
    } catch (err) {
      console.error('Failed to delete audit:', err);
      alert('Failed to delete audit. Please try again.');
    } finally {
      setDeleteModalOpen(false);
      setAuditToDelete(null);
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'danger'
      case 'Medium': return 'warning'
      case 'Low': return 'success'
      default: return 'neutral'
    }
  }

  if (view === 'report' && selectedAuditData) {
    const handleBackToList = () => { setView('list'); setSelectedAuditData(null); setSelectedAuditPageType('blog'); };
    
    if (selectedAuditPageType === 'landing_page') {
      return <LandingPageAuditCard onBack={handleBackToList} auditData={selectedAuditData} />
    }
    return <WebsiteAuditCard onBack={handleBackToList} auditData={selectedAuditData} />
  }

  return (
    <>
      <Box sx={{ maxWidth: '1200px', mx: 'auto', p: { xs: 2, md: 4 }, pt: { xs: 0, md: 0 } }}>
        {/* Search Header */}
        <Stack spacing={4} sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, rgba(46, 212, 122, 0.1), rgba(46, 212, 122, 0.02))',
              border: '1px solid rgba(46, 212, 122, 0.2)'
            }}>
              <HugeiconsIcon icon={Shield01Icon} className="text-[#2ED47A]" />
            </Box>
            <Box>
              <Typography level="h2" sx={{ color: '#fff', mb: 0.5 }}>Website Audit</Typography>
              <Typography level="body-sm" sx={{ color: 'rgba(242, 245, 250, 0.5)' }}>
                Identify authority leaks and competitive cannibalization markers.
              </Typography>
            </Box>
          </Box>

          <Card variant="outlined" sx={{ 
            background: 'linear-gradient(135deg, rgba(13, 15, 20, 0.8), rgba(10, 12, 16, 0.9))',
            borderColor: 'rgba(46, 212, 122, 0.2)',
            borderRadius: '20px',
            p: { xs: 2, md: 4 }
          }}>
            <Typography level="title-lg" sx={{ color: '#fff', mb: 1 }}>Auditor Tool</Typography>
            <Typography level="body-md" sx={{ color: 'rgba(255,255,255,0.5)', mb: 4 }}>
              Enter a website URL to scan for content that might be inadvertently feeding your competitors' authority.
            </Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Input
                placeholder="Enter URL to analyze (e.g. https://linkrunner.io)"
                startDecorator={<HugeiconsIcon icon={GlobalIcon} className="text-[#2ED47A] size-5" />}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                sx={{
                  flex: 1,
                  bgcolor: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(46, 212, 122, 0.15)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                  transition: 'all 0.25s ease',
                  '--Input-focusedHighlight': '#2ED47A',
                  '&:hover': {
                    borderColor: 'rgba(46, 212, 122, 0.4)',
                    bgcolor: 'rgba(255,255,255,0.03)'
                  },
                  '&.Mui-focused': {
                    bgcolor: 'rgba(46, 212, 122, 0.05)',
                    borderColor: '#2ED47A',
                    boxShadow: '0 0 15px rgba(46, 212, 122, 0.1)'
                  }
                }}
              />
              <Button 
                size="lg"
                onClick={handleAudit}
                loading={isAuditing}
                disabled={isAuditing}
                startDecorator={!isAuditing && <HugeiconsIcon icon={ZapIcon} className="size-4" />}
                sx={{ 
                  bgcolor: '#2ED47A', 
                  color: '#010409',
                  fontWeight: 800,
                  px: 4,
                  borderRadius: '12px',
                  transition: 'all 0.2s',
                  '&:hover': { 
                    bgcolor: '#26B869',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(46, 212, 122, 0.25)'
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.2)'
                  }
                }}
              >
                {isAuditing ? 'Auditing...' : 'Start Audit'}
              </Button>
            </Stack>
          </Card>
        </Stack>

        {/* History List */}
        <Box>
          <Typography level="title-md" sx={{ color: '#fff', mb: 3, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 1, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11px' }}>
            <HugeiconsIcon icon={Time02Icon} className="text-[#2ED47A] size-4" />
            Recent Audit History
          </Typography>

          <Sheet
            variant="outlined"
            sx={{
              background: 'transparent',
              borderColor: 'rgba(255,255,255,0.05)',
              borderRadius: '16px',
              overflow: 'auto'
            }}
          >
            <Table 
              hoverRow
              sx={{ 
                '& tr:hover': { bgcolor: 'rgba(46, 212, 122, 0.05) !important', cursor: 'pointer' },
                '& th': { bgcolor: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.4)', fontSize: '12px', py: 2 },
                '& td': { py: 2, color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.05)' }
              }}
            >
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Target URL</th>
                  <th>Type</th>
                  <th>Key Parameters</th>
                  <th>Date</th>
                  <th>Logic / Focus</th>
                  <th>Status</th>
                  <th style={{ width: '80px' }}></th>
                </tr>
              </thead>
              <tbody>
                {isLoadingList ? (
                  Array.from(new Array(3)).map((_, idx) => (
                    <tr key={`skeleton-${idx}`} style={{ pointerEvents: 'none' }}>
                      <SkeletonRowContent />
                    </tr>
                  ))
                ) : (
                  <>
                    {isAuditing && (
                      <tr style={{ pointerEvents: 'none', animation: 'pulse 1.5s ease-in-out infinite', borderLeft: '2px solid #2ED47A', backgroundColor: 'rgba(46, 212, 122, 0.02)' }}>
                        <SkeletonRowContent />
                      </tr>
                    )}
                    
                    {audits.length === 0 && !isAuditing ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                          <Typography level="body-sm" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                            No audits found for this product yet.
                          </Typography>
                        </td>
                      </tr>
                    ) : (
                      audits.map((record) => (
                    <tr key={record.id} onClick={() => handleSelectAudit(record)}>
                      <td>
                        <Stack spacing={0.5}>
                          <Typography level="body-sm" sx={{ color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {record.title || record.url}
                          </Typography>
                          <Typography level="body-xs" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>
                            {record.url}
                          </Typography>
                        </Stack>
                      </td>
                      <td>
                        <Chip
                          size="sm"
                          variant="soft"
                          sx={{
                            fontSize: '10px',
                            fontWeight: 600,
                            borderRadius: '6px',
                            ...(record.pageType === 'landing_page'
                              ? { bgcolor: 'rgba(124, 108, 250, 0.1)', color: '#7C6CFA' }
                              : { bgcolor: 'rgba(46, 212, 122, 0.1)', color: '#2ED47A' }
                            )
                          }}
                        >
                          {record.pageType === 'landing_page' ? 'Landing' : 'Blog'}
                        </Chip>
                      </td>
                      <td>
                        {record.pageType === 'landing_page' ? (
                          <Stack spacing={0.5}>
                            <Typography level="body-xs" sx={{ color: '#7C6CFA', fontWeight: 700 }}>
                              {record.metaData?.overallScoreRaw || '0 / 15'} Pass
                            </Typography>
                            <Typography level="body-xs" sx={{ fontSize: '10px', opacity: 0.6 }}>
                              AEO Success
                            </Typography>
                          </Stack>
                        ) : (
                          <Stack spacing={0.5}>
                            <Typography level="body-xs" sx={{ color: record.risk === 'High' ? '#f4604a' : record.risk === 'Medium' ? '#f0a04b' : '#2ED47A', fontWeight: 700 }}>
                              {record.score}% Risk
                            </Typography>
                            <Typography level="body-xs" sx={{ fontSize: '10px', opacity: 0.6 }}>
                              {record.metaData?.leakVectors || '0'} Leaks
                            </Typography>
                          </Stack>
                        )}
                      </td>
                      <td>
                        <Typography level="body-xs" sx={{ fontFamily: 'var(--font-dm-mono), monospace' }}>{record.date}</Typography>
                      </td>
                        <td>
                          {record.pageType === 'landing_page' ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography 
                                level="body-xs" 
                                sx={{ 
                                  color: record.score >= 80 ? '#2ED47A' : '#F4604A',
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                  fontSize: '10px'
                                }}
                              >
                                {record.metaData?.bottleneck || 'Analyzed'}
                              </Typography>
                              <Typography level="body-xs" sx={{ opacity: 0.3, fontSize: '9px' }}>
                                (Focus)
                              </Typography>
                            </Box>
                          ) : (
                            <Typography 
                              level="body-xs" 
                              sx={{ 
                                color: getRiskColor(record.risk),
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                fontSize: '10px'
                              }}
                            >
                              {record.risk}
                            </Typography>
                          )}
                        </td>
                      <td>
                        <Chip
                          size="sm"
                          variant="soft"
                          color={getRiskColor(record.risk) as any}
                          startDecorator={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor' }} />}
                        >
                          {record.risk === 'Low' ? 'Health OK' : 'Issues Found'}
                        </Chip>
                      </td>
                      <td>
                        <IconButton
                          size="sm"
                          variant="plain"
                          color="danger"
                          onClick={(e) => handleDeleteClick(e, record.id)}
                          sx={{ '&:hover': { bgcolor: 'rgba(244, 96, 74, 0.1)' } }}
                        >
                          <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                        </IconButton>
                      </td>
                    </tr>
                  ))
                )}
              </>
              )}
              </tbody>
            </Table>
          </Sheet>
        </Box>
      </Box>

      {/* Custom Delete Confirmation Modal */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <ModalDialog
          variant="outlined"
          sx={{
            bgcolor: '#0B0E14',
            borderColor: 'rgba(46, 212, 122, 0.1)',
            borderRadius: '24px',
            maxWidth: 400,
            p: 4,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            '& *': { fontFamily: 'var(--font-dm-sans), sans-serif' }
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textAlign: 'center' }}>
            <Box sx={{ 
              p: 2, 
              borderRadius: '50%', 
              bgcolor: 'rgba(244, 96, 74, 0.1)',
              border: '1px solid rgba(244, 96, 74, 0.2)',
              mb: 1
            }}>
              <HugeiconsIcon icon={AlertCircleIcon} className="text-[#f4604a] size-8" />
            </Box>
            <Typography level="h4" sx={{ color: '#fff' }}>Delete Audit Report?</Typography>
            <Typography level="body-sm" sx={{ color: 'rgba(255,255,255,0.5)', mb: 2 }}>
              This action cannot be undone. All data associated with this audit will be permanently removed.
            </Typography>
            
            <Stack direction="row" spacing={2} sx={{ width: '100%', mt: 1 }}>
              <Button 
                variant="plain" 
                fullWidth 
                onClick={() => setDeleteModalOpen(false)}
                sx={{ 
                  color: 'rgba(255,255,255,0.7)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="solid" 
                fullWidth 
                onClick={handleConfirmDelete}
                sx={{ 
                  bgcolor: '#f4604a',
                  color: '#fff',
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#d64d3b' }
                }}
              >
                Delete Report
              </Button>
            </Stack>
          </Box>
        </ModalDialog>
      </Modal>
    </>
  )
}

export default WebsiteAuditManager
