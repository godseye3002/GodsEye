"use client";

import { useState } from "react";
import {
  Button,
  Modal,
  ModalClose,
  ModalDialog,
  Stack,
  Typography,
  Box,
  LinearProgress,
  Chip,
} from "@mui/joy";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import axios from 'axios';

interface AnalysisReplacerProps {
  analysisId: string;
  query: string;
  pipeline: 'perplexity' | 'google_overview';
  onComplete?: () => void;
  onError?: (error: string) => void;
}

type AnalysisStep = 'idle' | 'scraper' | 'analysis' | 'saving' | 'complete' | 'error';

interface StepInfo {
  label: string;
  description: string;
}

const stepInfo: Record<AnalysisStep, StepInfo> = {
  idle: { label: 'Ready', description: 'Waiting to start' },
  scraper: { label: 'Scraping', description: 'Gathering fresh data from search sources' },
  analysis: { label: 'Analyzing', description: 'Processing data with AI analysis' },
  saving: { label: 'Saving', description: 'Replacing analysis with new results' },
  complete: { label: 'Complete', description: 'Analysis successfully replaced' },
  error: { label: 'Error', description: 'Something went wrong' },
};

export default function AnalysisReplacer({
  analysisId,
  query,
  pipeline,
  onComplete,
  onError,
}: AnalysisReplacerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const resetState = () => {
    setCurrentStep('idle');
    setError(null);
    setProgress(0);
  };

  const handleClose = () => {
    if (currentStep === 'scraper' || currentStep === 'analysis' || currentStep === 'saving') {
      // Don't allow closing during active processes
      return;
    }
    setOpen(false);
    resetState();
  };

  const callPerplexityScraper = async (query: string, location: string = 'India') => {
    const response = await axios.post('http://127.0.0.1:8001/scrape', {
      query,
      location,
      keep_open: false,
    });
    return response.data;
  };

  const callGoogleOverviewScraper = async (query: string, location: string = 'India') => {
    const response = await axios.post('http://127.0.0.1:8000/scrape_google', {
      query,
      location,
      keep_open: false,
    });
    return response.data;
  };

  const prepareDataForAI = (productData: any) => {
    return {
      product_name: productData.product_name || '',
      url: productData.url || '',
      description: productData.description || '',
      specifications: productData.specifications || {},
      features: productData.features || [],
      targeted_market: productData.targeted_market || '',
      problem_product_is_solving: productData.problem_product_is_solving || '',
      general_product_type: productData.general_product_type || '',
      specific_product_type: productData.specific_product_type || '',
    };
  };

  const handleReplace = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setError(null);
      setCurrentStep('scraper');
      setProgress(20);

      // Step 1: Run scraper
      let scraperResponse: any = null;
      try {
        if (pipeline === 'perplexity') {
          scraperResponse = await callPerplexityScraper(query);
        } else {
          scraperResponse = await callGoogleOverviewScraper(query);
        }

        if (scraperResponse.success === false) {
          throw new Error('Scraper service encountered an issue');
        }
      } catch (scraperError: any) {
        throw new Error('Failed to gather fresh data. Please try again.');
      }

      setCurrentStep('analysis');
      setProgress(40);

      // Step 2: Run strategic analysis
      let analysisResponse: any = null;
      try {
        // First fetch the product data
        const productResponse = await fetch(`/api/product-analyses/${analysisId}`);
        if (!productResponse.ok) {
          throw new Error('Failed to fetch product data');
        }
        
        const productData = await productResponse.json();
        
        const analysisData = {
          aiSearchJson: scraperResponse,
          clientProductJson: productData.productData || {},
          analysisId,
          pipeline,
        };

        const response = await fetch('/api/strategic-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(analysisData),
        });

        if (!response.ok) {
          throw new Error('Analysis service failed');
        }

        analysisResponse = await response.json();
      } catch (analysisError: any) {
        throw new Error('Failed to analyze the gathered data');
      }

      setCurrentStep('saving');
      setProgress(60);

      // Step 3: Replace analysis in backend
      try {
        const replaceData = {
          user_id: user.id,
          optimization_query: pipeline === 'perplexity' ? query : null,
          google_search_query: pipeline === 'google_overview' ? query : null,
          optimization_analysis: pipeline === 'perplexity' ? analysisResponse : null,
          google_overview_analysis: pipeline === 'google_overview' ? analysisResponse : null,
          perplexity_raw_serp_results: pipeline === 'perplexity' ? scraperResponse : null,
          google_raw_serp_results: pipeline === 'google_overview' ? scraperResponse : null,
        };

        if (process.env.NODE_ENV !== 'production') {
          console.log('[AnalysisReplacer] Sending replace data:', replaceData);
        }

        const response = await fetch(`/api/product-analyses/${analysisId}/replace`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(replaceData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to replace analysis');
        }

        setProgress(80);
      } catch (replaceError: any) {
        throw new Error('Failed to save the new analysis');
      }

      setCurrentStep('complete');
      setProgress(100);

      // Wait a moment before closing
      setTimeout(() => {
        setOpen(false);
        resetState();
        onComplete?.();
      }, 1500);

    } catch (error: any) {
      console.error('Analysis replacement error:', error);
      setError(error.message || 'Failed to replace analysis');
      setCurrentStep('error');
      onError?.(error.message);
    }
  };

  const getStepColor = (step: AnalysisStep) => {
    switch (step) {
      case 'complete': return 'success';
      case 'error': return 'danger';
      case 'scraper':
      case 'analysis':
      case 'saving': return 'primary';
      default: return 'neutral';
    }
  };

  const getProgressValue = () => {
    switch (currentStep) {
      case 'idle': return 0;
      case 'scraper': return 25;
      case 'analysis': return 50;
      case 'saving': return 75;
      case 'complete': return 100;
      case 'error': return progress;
      default: return 0;
    }
  };

  return (
    <>
      <Button
        variant="plain"
        onClick={() => setOpen(true)}
        sx={{
          color: "#F35B64",
          fontWeight: 600,
          "&:hover": {
            backgroundColor: "rgba(243, 91, 100, 0.1)",
          },
        }}
      >
        Re-Do Analysis?
      </Button>

      <Modal open={open} onClose={handleClose}>
        <ModalDialog
          sx={{
            backgroundColor: "#0D0F14",
            border: "1px solid rgba(46, 212, 122, 0.14)",
            maxWidth: 500,
          }}
        >
          {currentStep === 'idle' && (
            <Box>
              <ModalClose />
              <Typography level="h2" sx={{ color: "#F2F5FA", mb: 2 }}>
                Replace Analysis?
              </Typography>
              <Typography level="body-md" sx={{ color: "rgba(162, 167, 180, 0.88)", mb: 4 }}>
                This will replace your current analysis with updated results using the same query: 
                <Box component="span" sx={{ color: "#2ED47A", fontWeight: 600, mx: 1 }}>
                  "{query}"
                </Box>
                <br /><br />
                <strong>Warning:</strong> Your previous analysis will be permanently deleted and replaced with new results.
              </Typography>
              <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  onClick={handleClose}
                  sx={{ minWidth: 120 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="solid"
                  color="warning"
                  onClick={handleReplace}
                  sx={{ minWidth: 140 }}
                >
                  Replace Analysis
                </Button>
              </Box>
            </Box>
          )}

          {(currentStep === 'scraper' || currentStep === 'analysis' || currentStep === 'saving') && (
            <Stack>
              <Typography level="h2" sx={{ color: "#F2F5FA", mb: 3 }}>
                Replacing Analysis...
              </Typography>
              
              <Stack spacing={3}>
                <Box>
                  <Typography level="title-md" sx={{ color: "#F2F5FA", mb: 1 }}>
                    {stepInfo[currentStep].label}
                  </Typography>
                  <Typography level="body-sm" sx={{ color: "rgba(162, 167, 180, 0.88)" }}>
                    {stepInfo[currentStep].description}
                  </Typography>
                </Box>

                <LinearProgress
                  value={getProgressValue()}
                  color={getStepColor(currentStep)}
                  sx={{ height: 8, borderRadius: 4 }}
                />

                <Typography level="body-sm" sx={{ color: "rgba(162, 167, 180, 0.88)", textAlign: "center" }}>
                  {getProgressValue()}% Complete
                </Typography>
              </Stack>
            </Stack>
          )}

          {currentStep === 'complete' && (
            <Stack>
              <Typography level="h2" sx={{ color: "#2ED47A", mb: 3, textAlign: "center" }}>
                Analysis Replaced!
              </Typography>
              <Typography level="body-md" sx={{ color: "rgba(162, 167, 180, 0.88)", textAlign: "center" }}>
                Your analysis has been successfully updated with fresh results.
              </Typography>
              <LinearProgress
                value={100}
                color="success"
                sx={{ height: 8, borderRadius: 4, mt: 3 }}
              />
            </Stack>
          )}

          {currentStep === 'error' && (
            <Box>
              <ModalClose />
              <Typography level="h2" sx={{ color: "#F35B64", mb: 2 }}>
                Replacement Failed
              </Typography>
              <Typography level="body-md" sx={{ color: "rgba(162, 167, 180, 0.88)", mb: 4 }}>
                {error || 'An error occurred while replacing your analysis. Please try again.'}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  onClick={handleClose}
                  sx={{ minWidth: 120 }}
                >
                  Close
                </Button>
                <Button
                  variant="solid"
                  color="warning"
                  onClick={handleReplace}
                  sx={{ minWidth: 140 }}
                >
                  Try Again
                </Button>
              </Box>
            </Box>
          )}
        </ModalDialog>
      </Modal>
    </>
  );
}
