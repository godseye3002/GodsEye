"use client";

import { Box, Typography, IconButton } from "@mui/joy";
import { keyframes } from "@mui/system";

const pulseCore = keyframes`
  0% { transform: scale(0.92); opacity: 0.65; }
  40% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.92); opacity: 0.65; }
`;

const rotateSweep = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const radarSweep = keyframes`
  0% { transform: rotate(0deg); opacity: 0.2; }
  50% { opacity: 0.75; }
  100% { transform: rotate(360deg); opacity: 0.2; }
`;

const flicker = keyframes`
  0%, 100% { opacity: 0.2; }
  50% { opacity: 1; }
`;

const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const softPulse = keyframes`
  0% { transform: scale(0.95); opacity: 0.55; }
  50% { transform: scale(1); opacity: 0.9; }
  100% { transform: scale(0.95); opacity: 0.55; }
`;

type RadarLoadingOverlayProps = {
  title?: string;
  onClose?: () => void;
  zIndex?: number;
};

export function RadarLoadingOverlay({
  title = "Calibrating God's Eye optics",
  onClose,
  zIndex = 1400,
}: RadarLoadingOverlayProps) {
  const overlayBackground = "radial-gradient(circle at 45% 18%, #1a3329, #02050a 68%)";

  const overlaySheenStyles = {
    backgroundImage:
      "linear-gradient(145deg, rgba(46, 212, 122, 0.08) 0%, rgba(14, 20, 27, 0.9) 38%, rgba(4, 7, 12, 0.98) 100%)",
    opacity: 0.8,
  };

  const overlayGridStyles = {
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
    opacity: 0.14,
  };

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        position: "fixed",
        inset: 0,
        zIndex,
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        positionAnchor: "none",
        pointerEvents: "auto",
        background: overlayBackground,
        color: "#F2F5FA",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          ...overlaySheenStyles,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          ...overlayGridStyles,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(circle at center, black 0%, black 55%, transparent 85%)",
          pointerEvents: "none",
        }}
      />

      {onClose && (
        <IconButton
          variant="soft"
          color="neutral"
          onClick={onClose}
          sx={{
            position: "absolute",
            top: { xs: 16, md: 28 },
            right: { xs: 16, md: 32 },
            backdropFilter: "blur(10px)",
            borderRadius: "50%",
            width: 40,
            height: 40,
            color: "rgba(242, 245, 250, 0.9)",
            border: "1px solid rgba(46, 212, 122, 0.3)",
            boxShadow: "0 12px 28px rgba(5, 8, 11, 0.5)",
          }}
        >
          ✕
        </IconButton>
      )}

      <RadarContent title={title} />
    </Box>
  );
}

type ContentProps = {
  title: string;
};

function RadarContent({ title }: ContentProps) {
  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2.5,
        textAlign: "center",
        px: 3,
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: { xs: 110, sm: 130 },
          height: { xs: 110, sm: 130 },
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at center, rgba(18, 34, 43, 0.92) 0%, #020508 78%)",
          border: "1px solid rgba(46, 212, 122, 0.18)",
          boxShadow: "0 22px 48px rgba(2, 5, 8, 0.76)",
          backdropFilter: "blur(10px)",
          animation: `${softPulse} 3.2s ease-in-out infinite`,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: "78%",
            height: "78%",
            borderRadius: "50%",
            border: "1px solid rgba(46, 212, 122, 0.22)",
            animation: `${rotateSweep} 12s linear infinite`,
            opacity: 0.42,
          }}
        />

        <Box
          sx={{
            position: "absolute",
            width: "90%",
            height: "90%",
            borderRadius: "50%",
            border: "1px dashed rgba(46, 212, 122, 0.14)",
            animation: `${rotateSweep} 18s linear infinite`,
            opacity: 0.28,
          }}
        />

        <Box
          sx={{
            position: "absolute",
            width: "88%",
            height: "88%",
            borderRadius: "50%",
            maskImage: "linear-gradient(transparent 38%, black 60%, transparent 82%)",
            background:
              "linear-gradient(90deg, rgba(46, 212, 122, 0.04) 0%, rgba(46, 212, 122, 0.45) 50%, rgba(46, 212, 122, 0.04) 100%)",
            animation: `${radarSweep} 2.6s linear infinite`,
            opacity: 0.46,
          }}
        />

        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(46, 212, 122, 0.6) 0%, #02070b 75%)",
            boxShadow: "0 0 16px rgba(46, 212, 122, 0.48)",
            position: "relative",
            zIndex: 2,
          }}
        />
      </Box>

      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          width: 200,
          maxWidth: 200,
          height: 6,
          borderRadius: 999,
          backgroundColor: "#080d12",
          border: "1px solid rgba(46, 212, 122, 0.22)",
          boxShadow: "0 18px 32px rgba(5, 9, 13, 0.55)",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(120deg, transparent 0%, rgba(46, 212, 122, 0.7) 50%, transparent 100%)",
            animation: `${shimmer} 2.4s ease-in-out infinite`,
          }}
        />
      </Box>

      <Typography
        level="title-md"
        sx={{
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(242, 245, 250, 0.9)",
        }}
      >
        {title}
      </Typography>
    </Box>
  );
}
