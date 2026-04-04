"use client";

import React from "react";
import {
  Box,
  Typography,
  Chip,
  CircularProgress,
  Stack,
  Card,
} from "@mui/joy";
import { keyframes } from "@mui/system";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

export interface AnalysisProgressUIProps {
  isPerplexityScraping?: boolean;
  isGoogleScraping?: boolean;
  isChatgptScraping?: boolean;
}

export function AnalysisProgressUI({
  isPerplexityScraping = false,
  isGoogleScraping = false,
  isChatgptScraping = false,
}: AnalysisProgressUIProps) {
  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        animation: `${fadeIn} 0.6s ease-out`,
        textAlign: 'center',
        py: 6,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 700,
          p: { xs: 3, md: 6 },
          borderRadius: '32px',
          background: 'linear-gradient(145deg, rgba(13, 15, 20, 0.4), rgba(20, 25, 35, 0.6))',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(46, 212, 122, 0.2)',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(46, 212, 122, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {/* Animated Progress Ring */}
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress
            size="lg"
            thickness={4}
            sx={{
              '--CircularProgress-size': '140px',
              '--CircularProgress-trackColor': 'rgba(46, 212, 122, 0.05)',
              color: '#2ED47A',
              filter: 'drop-shadow(0 0 15px rgba(46, 212, 122, 0.4))',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography
              sx={{
                color: '#2ED47A',
                fontWeight: 900,
                fontSize: '0.7rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                opacity: 0.8,
              }}
            >
              Analyzing
            </Typography>
          </Box>
        </Box>

        <Box>
          <Typography
            level="h3"
            sx={{
              color: '#FFFFFF',
              mb: 2,
              fontWeight: 800,
              fontSize: { xs: '1.5rem', md: '2rem' },
              letterSpacing: '-0.02em',
            }}
          >
            GodsEye Engine Analysis
          </Typography>
          <Typography
            level="body-md"
            sx={{
              color: 'rgba(162, 167, 180, 0.8)',
              maxWidth: 500,
              mx: 'auto',
              lineHeight: 1.6,
              mb: 4,
            }}
          >
            Your brand's visibility state in AI search engines will take approximately
            <strong> 10-15 minutes</strong> to analyze.
          </Typography>

          {/* Engine Status Tracker */}
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 4, flexWrap: 'wrap', gap: 1.5 }}>
            {[
              { label: 'Perplexity', active: isPerplexityScraping },
              { label: 'Google AI', active: isGoogleScraping },
              { label: 'ChatGPT', active: isChatgptScraping }
            ].map((engine) => (
              <Chip
                key={engine.label}
                variant="soft"
                size="md"
                startDecorator={engine.active && (
                  <CircularProgress size="sm" sx={{ '--CircularProgress-size': '14px', color: '#2ED47A' }} />
                )}
                sx={{
                  backgroundColor: engine.active ? 'rgba(46, 212, 122, 0.1)' : 'rgba(255,255,255,0.03)',
                  color: engine.active ? '#2ED47A' : 'rgba(255,255,255,0.2)',
                  fontWeight: 700,
                  px: 2,
                  py: 1,
                  borderRadius: '12px',
                  border: engine.active ? '1px solid rgba(46, 212, 122, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                  transition: 'all 0.3s ease',
                }}
              >
                {engine.label}
              </Chip>
            ))}
          </Stack>

          {/* User Tip */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: '20px',
              backgroundColor: 'rgba(46, 212, 122, 0.05)',
              border: '1px dashed rgba(46, 212, 122, 0.2)',
              maxWidth: 450,
              mx: 'auto',
            }}
          >
            <Typography
              level="body-xs"
              sx={{
                color: '#2ED47A',
                fontWeight: 600,
                lineHeight: 1.5,
                opacity: 0.9,
              }}
            >
              ✨ <strong>Safe to Navigate Away:</strong> You don't need to stay on this screen. GodsEye will finalize your analysis in the background and update the dashboard automatically.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
