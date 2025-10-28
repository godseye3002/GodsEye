"use client";

import { CssVarsProvider, extendTheme } from "@mui/joy/styles";
import { CssBaseline } from "@mui/joy";
import type { ReactNode } from "react";
import { CacheProvider } from "@emotion/react";
import { useState } from "react";
import { createEmotionCache } from "@/lib/create-emotion-cache";

const accentColor = '#2ED47A';
const accentHover = '#36E08A';
const neutralButtonBg = '#FFFFFF';
const neutralButtonHover = '#F2F4F7';
const neutralButtonBorder = 'rgba(255, 255, 255, 0.18)';
const darkText = '#050506';
const secondaryText = '#A2A7B4';
const surfaceSoft = 'rgba(17, 19, 24, 0.82)';
const surfaceSoftHover = 'rgba(20, 23, 29, 0.9)';
const dangerColor = '#F35B64';
const dangerHover = '#FF7078';
const warningColor = '#F7B731';
const warningHover = '#FFC653';

const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          50: '#defce9',
          100: '#b5f5d0',
          200: '#8aebb6',
          300: '#5fe19c',
          400: '#3dd989',
          500: '#2ED47A',
          600: '#27b767',
          700: '#1f9654',
          800: '#177442',
          900: '#0f5230',
        },
      },
    },
    dark: {
      palette: {
        background: {
          body: '#050506',
          surface: '#111318',
        },
        text: {
          primary: '#F2F5FA',
          secondary: '#A2A7B4',
          tertiary: '#636671',
        },
        primary: {
          50: '#defce9',
          100: '#b5f5d0',
          200: '#8aebb6',
          300: '#5fe19c',
          400: '#3dd989',
          500: '#2ED47A',
          600: '#27b767',
          700: '#1f9654',
          800: '#177442',
          900: '#0f5230',
          solidBg: '#2ED47A',
          solidColor: '#050506',
          plainColor: '#2ED47A',
          outlinedBorder: 'rgba(46, 212, 122, 0.4)',
          outlinedColor: '#2ED47A',
          softBg: 'rgba(46, 212, 122, 0.12)',
          softColor: '#2ED47A',
        },
        divider: '#1D1F24',
        neutral: {
          plainBorder: '#1D1F24',
          outlinedBorder: '#1D1F24',
          plainColor: '#A2A7B4',
          outlinedColor: '#A2A7B4',
        },
        success: {
          solidBg: '#2ED47A',
          solidColor: '#050506',
          plainColor: '#2ED47A',
          outlinedColor: '#2ED47A',
          softBg: 'rgba(46, 212, 122, 0.12)',
          softColor: '#2ED47A',
        },
        warning: {
          solidBg: '#F7B731',
          solidColor: '#050506',
          plainColor: '#F7B731',
          outlinedColor: '#F7B731',
          softBg: 'rgba(247, 183, 49, 0.14)',
          softColor: '#F7B731',
        },
        danger: {
          solidBg: '#F35B64',
          solidColor: '#050506',
          plainColor: '#F35B64',
          outlinedColor: '#F35B64',
          softBg: 'rgba(243, 91, 100, 0.14)',
          softColor: '#F35B64',
        },
      },
    },
  },
  components: {
    JoyButton: {
      defaultProps: {
        color: 'neutral',
        variant: 'solid',
        size: 'md',
      },
      styleOverrides: {
        root: ({ ownerState }) => {
          const isSolid = ownerState.variant === 'solid';
          const isOutlined = ownerState.variant === 'outlined';
          const isSoft = ownerState.variant === 'soft' || ownerState.variant === 'plain';

          const sizeStyles = ownerState.size === 'sm'
            ? { minHeight: 32, paddingInline: 14, fontSize: '0.8rem' }
            : ownerState.size === 'lg'
              ? { minHeight: 52, paddingInline: 28, fontSize: '1rem' }
              : { minHeight: 42, paddingInline: 22, fontSize: '0.9rem' };

          const baseStyles = {
            borderRadius: '999px',
            fontWeight: 600,
            letterSpacing: '0.01em',
            textTransform: 'none',
            transition: 'background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
            boxShadow: '0 12px 32px rgba(5, 8, 11, 0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            ...sizeStyles,
          } as const;

          const disabledStyles = ownerState.disabled
            ? {
                opacity: 0.45,
                cursor: 'not-allowed',
                boxShadow: 'none',
              }
            : undefined;

          if (isSolid) {
            if (ownerState.color === 'primary' || ownerState.color === 'success') {
              return {
                ...baseStyles,
                backgroundColor: accentColor,
                color: darkText,
                border: `1px solid ${accentColor}`,
                boxShadow: '0 16px 40px rgba(46, 212, 122, 0.35)',
                '&:hover': {
                  backgroundColor: accentHover,
                  borderColor: accentHover,
                  boxShadow: '0 18px 46px rgba(46, 212, 122, 0.4)',
                },
                ...disabledStyles,
              };
            }

            if (ownerState.color === 'danger') {
              return {
                ...baseStyles,
                backgroundColor: dangerColor,
                color: darkText,
                border: `1px solid ${dangerColor}`,
                '&:hover': {
                  backgroundColor: dangerHover,
                  borderColor: dangerHover,
                },
                ...disabledStyles,
              };
            }

            if (ownerState.color === 'warning') {
              return {
                ...baseStyles,
                backgroundColor: warningColor,
                color: darkText,
                border: `1px solid ${warningColor}`,
                '&:hover': {
                  backgroundColor: warningHover,
                  borderColor: warningHover,
                },
                ...disabledStyles,
              };
            }

            return {
              ...baseStyles,
              backgroundColor: neutralButtonBg,
              color: darkText,
              border: `1px solid ${neutralButtonBorder}`,
              '&:hover': {
                backgroundColor: neutralButtonHover,
                borderColor: accentColor,
                color: darkText,
                boxShadow: '0 16px 42px rgba(5, 8, 11, 0.48)',
              },
              ...disabledStyles,
            };
          }

          if (isOutlined) {
            if (ownerState.color === 'danger') {
              return {
                ...baseStyles,
                backgroundColor: 'transparent',
                color: dangerColor,
                border: `1px solid rgba(243, 91, 100, 0.45)`,
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: 'rgba(243, 91, 100, 0.1)',
                  borderColor: dangerColor,
                },
                ...disabledStyles,
              };
            }

            if (ownerState.color === 'primary' || ownerState.color === 'success') {
              return {
                ...baseStyles,
                backgroundColor: 'transparent',
                color: accentColor,
                border: `1px solid rgba(46, 212, 122, 0.4)`,
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: 'rgba(46, 212, 122, 0.1)',
                  borderColor: accentColor,
                },
                ...disabledStyles,
              };
            }

            return {
              ...baseStyles,
              backgroundColor: surfaceSoft,
              color: secondaryText,
              border: `1px solid ${neutralButtonBorder}`,
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: surfaceSoftHover,
                borderColor: accentColor,
                color: '#E6E9EF',
              },
              ...disabledStyles,
            };
          }

          if (isSoft) {
            return {
              ...baseStyles,
              backgroundColor: 'transparent',
              color: secondaryText,
              border: 'none',
              boxShadow: 'none',
              '&:hover': {
                color: accentColor,
                backgroundColor: 'rgba(46, 212, 122, 0.08)',
              },
              ...disabledStyles,
            };
          }

          return {
            ...baseStyles,
            ...disabledStyles,
          };
        },
      },
    },
  },
  // Ensure required tokens exist for CssBaseline and components
  breakpoints: {
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
  },
  radius: {
    sm: '10px',
    md: '14px',
    lg: '18px',
  },
  shadow: {
    sm: '0 1px 3px rgba(2, 4, 7, 0.35)',
    md: '0 10px 30px rgba(2, 4, 7, 0.45)',
    lg: '0 24px 60px rgba(2, 4, 7, 0.55)',
  },
  focus: {
    thickness: '2px',
    default: {
      outlineColor: 'rgba(46, 212, 122, 0.45)',
    },
  },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [emotionCache] = useState(createEmotionCache);
  return (
    <CacheProvider value={emotionCache}>
      <CssVarsProvider
        defaultMode="dark"
        defaultColorScheme="dark"
        theme={theme}
      >
        <CssBaseline />
        {children}
      </CssVarsProvider>
    </CacheProvider>
  );
}
