"use client";

import dynamic from "next/dynamic";
import { Box } from "@mui/joy";
import { motion } from "framer-motion";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
});

export default function SplineHeroBackground() {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.4 }}
      transition={{ duration: 2.5, ease: "easeOut" }}
      sx={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, transparent 0%, rgba(13, 15, 20, 0.4) 50%, #0D0F14 100%), linear-gradient(to bottom, transparent 60%, #0D0F14 100%)",
          zIndex: 1,
        },
      }}
    >
      <Spline scene="https://prod.spline.design/q9GedPxQslETH1QV/scene.splinecode" />
    </Box>
  );
}
