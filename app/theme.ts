import { extendTheme } from '@mui/joy/styles';

export const theme = extendTheme({
  colorSchemes: {
    dark: {
      palette: {
        // Background colors
        background: {
          body: '#101113', // Primary Background
          surface: '#1A1B1E', // Secondary Background (Surfaces)
        },
        
        // Text colors
        text: {
          primary: '#F5F5F7', // Primary Text (Headings)
          secondary: '#A0A0A5', // Secondary Text (Body/Labels)
          tertiary: '#6B6B70', // Tertiary Text (Placeholders/Disabled)
        },
        
        // Primary accent color
        primary: {
          50: '#f0e6ff',
          100: '#d9c7ff',
          200: '#c1a6ff',
          300: '#aa85ff',
          400: '#9264ff',
          500: '#8A42FF', // Primary Accent
          600: '#7938e6',
          700: '#682ecc',
          800: '#5724b3',
          900: '#461a99',
          solidBg: '#8A42FF',
          solidColor: '#F5F5F7',
          plainColor: '#8A42FF',
          outlinedBorder: '#8A42FF',
          outlinedColor: '#8A42FF',
          softBg: 'rgba(138, 66, 255, 0.12)',
          softColor: '#8A42FF',
        },
        
        // UI element colors
        divider: '#2C2D31', // Borders & Dividers
        neutral: {
          plainBorder: '#2C2D31',
          outlinedBorder: '#2C2D31',
          plainColor: '#A0A0A5',
          outlinedColor: '#A0A0A5',
        },
        
        // Status colors
        success: {
          solidBg: '#30A46C',
          solidColor: '#F5F5F7',
          plainColor: '#30A46C',
          outlinedColor: '#30A46C',
          softBg: 'rgba(48, 164, 108, 0.12)',
          softColor: '#30A46C',
        },
        
        warning: {
          solidBg: '#F7B32B',
          solidColor: '#101113',
          plainColor: '#F7B32B',
          outlinedColor: '#F7B32B',
          softBg: 'rgba(247, 179, 43, 0.12)',
          softColor: '#F7B32B',
        },
        
        danger: {
          solidBg: '#E5484D',
          solidColor: '#F5F5F7',
          plainColor: '#E5484D',
          outlinedColor: '#E5484D',
          softBg: 'rgba(229, 72, 77, 0.12)',
          softColor: '#E5484D',
        },
      },
    },
  },
  
  // Typography configuration
  typography: {
    
    h1: {
      fontSize: '36px',
      fontWeight: 700,
      letterSpacing: '0.5px',
      lineHeight: 1.2,
    },
    
    h2: {
      fontSize: '24px',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    
    h3: {
      fontSize: '18px',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    
    'body-md': {
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    
    'body-sm': {
      fontSize: '14px',
      fontWeight: 500,
      lineHeight: 1.5,
    },
  },
  
  // Add Joy tokens for consistency
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
    sm: '6px',
    md: '8px',
    lg: '12px',
  },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.24)',
    md: '0 2px 8px rgba(0,0,0,0.28)',
    lg: '0 6px 20px rgba(0,0,0,0.35)',
  },
});
