"use client";

import { Box, Card, Skeleton, Typography, Chip, Avatar } from "@mui/joy";

export function ProductCardSkeleton() {
  return (
    <Card
      variant="outlined"
      sx={{
        width: "100%",
        minHeight: { xs: 172, sm: 192, md: 208 },
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "rgba(15, 17, 22, 0.92)",
        border: "1px solid rgba(46, 212, 122, 0.12)",
        borderRadius: "12px",
        p: { xs: 1.5, sm: 2, md: 2.4 },
        gap: { xs: 1, md: 1.25 },
      }}
    >
      <Skeleton variant="text" sx={{ width: "60%", mb: 1 }} />
      <Skeleton variant="text" sx={{ width: "95%", mb: 0.75 }} />
      <Skeleton variant="text" sx={{ width: "88%", mb: 0.75 }} />
      <Skeleton variant="text" sx={{ width: "70%" }} />
    </Card>
  );
}

export function UserBadgeSkeleton() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        background: "rgba(17, 19, 24, 0.82)",
        border: "1px solid rgba(46, 212, 122, 0.18)",
        borderRadius: "999px",
        padding: "10px 18px",
        boxShadow: "0 18px 44px rgba(0, 0, 0, 0.35)",
        position: "absolute",
        right: 0,
        top: "50%",
        transform: "translateY(-50%)",
        width: "25%",
      }}
    >
      <Avatar sx={{ width: 40, height: 40 }} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" sx={{ width: "60%", mb: 0.5 }} />
        <Skeleton variant="text" sx={{ width: "80%" }} />
      </Box>
      <Chip size="sm" variant="soft" sx={{ height: 28 }}>
        <Skeleton variant="text" sx={{ width: 60 }} />
      </Chip>
    </Box>
  );
}

export function InlineChipSkeleton({ width = 60 }: { width?: number }) {
  return (
    <Chip size="sm" variant="soft" sx={{ height: 28 }}>
      <Skeleton variant="text" sx={{ width }} />
    </Chip>
  );
}
