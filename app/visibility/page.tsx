"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, Button, Tooltip } from "@mui/joy";
import { useProductStore } from "../optimize/store";

export default function VisibilityLandingPage() {
  const router = useRouter();
  const { processedSources, products } = useProductStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  // Prefer explicit store slice; if empty (e.g., after reload), fall back to most recent product
  const visibleSources = useMemo(() => {
    if (!hydrated) return [] as any[];
    if (processedSources && processedSources.length > 0) return processedSources;
    const latest = products && products.length > 0 ? products[0] : null;
    return (latest?.processedSources as any[]) || [];
  }, [hydrated, processedSources, products]);

  // Debug logging
  useEffect(() => {
    console.log('[Visibility] visibleSources:', visibleSources);
  }, [visibleSources]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('[data-animate="fade-in-up"]')
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fade-in-up-visible");
            observer.unobserve(entry.target as Element);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -40px 0px" }
    );
    elements.forEach((el, index) => {
      el.classList.add("fade-in-up");
      el.style.setProperty("--fade-delay", `${index * 0.08}s`);
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", width: "100%", backgroundColor: "transparent", position: "relative", overflow: "hidden" }}>
      {/* Minimal Top Controls */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          px: { xs: 2, md: 4 },
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(to bottom, rgba(13,15,20,0.55), rgba(13,15,20,0))",
          borderBottom: "1px solid rgba(46, 212, 122, 0.08)",
          backdropFilter: "blur(6px)",
        }}
      >
        <Button
          size="sm"
          variant="outlined"
          onClick={() => router.back()}
          sx={{
            borderColor: "rgba(46, 212, 122, 0.36)",
            color: "#F2F5FA",
            "&:hover": { borderColor: "rgba(46, 212, 122, 0.55)", backgroundColor: "rgba(46, 212, 122, 0.12)" },
          }}
        >
          Back
        </Button>
        <Button
          size="sm"
          variant="solid"
          onClick={() => router.push("/products")}
          sx={{ backgroundColor: "#2ED47A", color: "#0D0F14", fontWeight: 600, px: 2.5, "&:hover": { backgroundColor: "#26B869" } }}
        >
          Go to Dashboard
        </Button>
      </Box>

      {/* Hero Section */}
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, pt: { xs: 4, md: 8 }, pb: { xs: 4, md: 6 }, textAlign: "center" }} data-animate="fade-in-up">
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, px: 2.5, py: 1, borderRadius: "50px", backgroundColor: "rgba(46, 212, 122, 0.1)", border: "1px solid rgba(46, 212, 122, 0.2)", mb: 4 }}>
          <Box sx={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: "#2ED47A" }} />
          <Typography level="body-sm" sx={{ color: "#2ED47A", fontWeight: 600, fontSize: "0.875rem" }}>
            Coming Soon
          </Typography>
        </Box>
        <Typography level="h1" sx={{ fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4.2rem" }, fontWeight: 800, mb: 3, color: "#F2F5FA", letterSpacing: "-0.03em", lineHeight: 1.1, maxWidth: 980, mx: "auto" }}>
          Improve your product's discoverability in AI search
        </Typography>
        <Typography level="body-sm" sx={{ color: "#2ED47A", fontWeight: 600, letterSpacing: "0.02em", mb: 1.5 }}>
          AI Visibility via High‑Trust Sources
        </Typography>
        <Typography level="body-lg" sx={{ fontSize: { xs: "1.1rem", md: "1.25rem" }, color: "#A2A7B4", maxWidth: 780, mx: "auto", mb: 3, lineHeight: 1.6 }}>
          Partner with high‑trust third‑party websites frequently surfaced by AI search engines. Align your industry content where AI looks first to boost visibility and credibility.
        </Typography>
        <Box sx={{ display: "flex", gap: { xs: 1.25, sm: 2 }, justifyContent: "center", flexWrap: "wrap" }}>
          <Button onClick={() => router.push("/results")} size="lg" variant="outlined" sx={{ borderColor: "rgba(46, 212, 122, 0.4)", color: "#F2F5FA", fontWeight: 600, fontSize: { xs: "1rem", md: "1.05rem" }, px: { xs: 2, md: 4 }, py: { xs: 1.1, md: 1.5 }, width: { xs: "100%", sm: "auto" }, backdropFilter: "blur(6px)", backgroundColor: "rgba(15, 18, 24, 0.65)", display: "flex", alignItems: "center", gap: 1, "&:hover": { backgroundColor: "rgba(15, 18, 24, 0.85)", borderColor: "rgba(46, 212, 122, 0.6)", transform: "translateY(-2px)" }, transition: "all 0.2s ease" }}>
            Back to Results
          </Button>
        </Box>
      </Box>

      {/* Features Grid */}
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 4, md: 6 } }} data-animate="fade-in-up">
        <Typography level="h2" sx={{ fontSize: { xs: "2rem", md: "2.75rem" }, fontWeight: 700, mb: 1.5, color: "#F2F5FA", textAlign: "center" }}>
          Build presence where AI already trusts
        </Typography>
        <Typography level="body-lg" sx={{ color: "#A2A7B4", textAlign: "center", maxWidth: 640, mx: "auto", mb: 4 }}>
          Leverage citations and high‑authority sites to increase inclusion in AI overviews and answers.
        </Typography>
        {(() => {
          // Loading/skeleton state: before hydration or when deriving sources
          if (!hydrated) {
            return (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Box key={`skel-pre-${i}`} sx={{ p: { xs: 1.75, md: 2.25 }, borderRadius: "16px", backgroundColor: "rgba(17,19,24,0.6)", border: "1px solid rgba(46,212,122,0.12)" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box className="shimmer-bg" sx={{ width: { xs: 28, md: 36 }, height: { xs: 28, md: 36 }, borderRadius: "50%", overflow: "hidden", position: "relative", background: "linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.12) 37%, rgba(255,255,255,0.06) 63%)" }} />
                      <Box sx={{ flex: 1 }}>
                        <Box className="shimmer-bg" sx={{ height: 12, width: "40%", mb: 1, borderRadius: 999, background: "linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.12) 37%, rgba(255,255,255,0.06) 63%)" }} />
                        <Box className="shimmer-bg" sx={{ height: 10, width: "70%", mb: 1, borderRadius: 999, background: "linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 37%, rgba(255,255,255,0.05) 63%)" }} />
                        <Box className="shimmer-bg" sx={{ height: 10, width: "55%", borderRadius: 999, background: "linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 37%, rgba(255,255,255,0.05) 63%)" }} />
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            );
          }

          if (!visibleSources || visibleSources.length === 0) {
            // Empty state
            return (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography level="body-lg" sx={{ color: "#A2A7B4" }}>
                  Run an analysis to discover high-trust third-party sites relevant to your product.
                </Typography>
                <Button
                  onClick={() => router.push("/optimize")}
                  variant="outlined"
                  sx={{ mt: 2, borderColor: "rgba(46, 212, 122, 0.36)", color: "#F2F5FA", "&:hover": { borderColor: "rgba(46, 212, 122, 0.55)", backgroundColor: "rgba(46, 212, 122, 0.12)" } }}
                >
                  Start Analysis
                </Button>
              </Box>
            );
          }

          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {visibleSources.map((s, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexDirection: { xs: "column", md: "row" },
                    p: { xs: 1.75, md: 2.25 },
                    borderRadius: "16px",
                    backgroundColor: "rgba(17, 19, 24, 0.6)",
                    border: "1px solid rgba(46, 212, 122, 0.18)",
                    boxShadow: "0 10px 26px rgba(0,0,0,0.25)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2.25, minWidth: 0, flex: 1, width: "100%" }}>
                    {/* Favicon or First Letter */}
                    <Box 
                      sx={{ 
                        width: { xs: 28, md: 36 }, 
                        height: { xs: 28, md: 36 }, 
                        flexShrink: 0, 
                        borderRadius: "50%", 
                        backgroundColor: s.Website_Icon_Url ? "transparent" : "rgba(46, 212, 122, 0.15)", 
                        border: "1px solid rgba(255,255,255,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {s.Website_Icon_Url ? (
                        <img 
                          src={s.Website_Icon_Url} 
                          alt={`${s.name} icon`}
                          style={{ 
                            width: "100%", 
                            height: "100%", 
                            objectFit: "cover" 
                          }}
                          onError={(e) => {
                            // Fallback to first letter if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.style.backgroundColor = "rgba(46, 212, 122, 0.15)";
                              parent.innerHTML = `<span style="color: #2ED47A; font-weight: 600; font-size: 1rem;">${(s.name || 'U')[0].toUpperCase()}</span>`;
                            }
                          }}
                        />
                      ) : (
                        <Typography sx={{ color: "#2ED47A", fontWeight: 600, fontSize: "1rem" }}>
                          {(s.name || 'U')[0].toUpperCase()}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, minWidth: 0, flex: 1 }}>
                      <Typography
                        component="a"
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: "#F2F5FA",
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          "&:hover": { color: "#2ED47A", textDecoration: "underline" },
                          fontWeight: 600,
                          fontSize: "1rem",
                        }}
                      >
                        {s.name || "Untitled Source"}
                      </Typography>
                      <Typography
                        component="a"
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={s.url}
                        sx={{
                          color: "#9BA2B0",
                          fontSize: "0.875rem",
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          "&:hover": { color: "#C1C7D4", textDecoration: "underline" },
                        }}
                      >
                        {(() => {
                          try {
                            return new URL(s.url || '').hostname || s.url || 'No URL';
                          } catch {
                            return s.url || 'No URL';
                          }
                        })()}
                      </Typography>
                      <Typography
                        sx={{
                          color: "#8A919E",
                          fontSize: "0.875rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          lineHeight: 1.4,
                        }}
                      >
                        {s.description || "Third-party authority site relevant to your industry"}
                      </Typography>
                    </Box>
                  </Box>
                  <Tooltip
                    placement="top"
                    arrow
                    title={
                      <Box>
                        <Typography level="title-sm" sx={{ color: "#F2F5FA", mb: 0.5 }}>Coming Soon</Typography>
                        <Typography level="body-sm" sx={{ color: "#A2A7B4", lineHeight: 1.5 }}>
                          Add your product to high‑trust, industry‑relevant websites that AI search engines frequently reference to improve discoverability and credibility.
                        </Typography>
                      </Box>
                    }
                  >
                    <span>
                      <Button
                        disabled
                        variant="outlined"
                        sx={{
                          backgroundColor: "rgba(15, 18, 24, 0.65)",
                          borderColor: "rgba(46, 212, 122, 0.36)",
                          color: "#F2F5FA",
                          fontWeight: 600,
                          px: { xs: 2, md: 2.5 },
                          py: { xs: 0.8, md: 1 },
                          minWidth: { xs: "100%", md: 190 },
                          width: { xs: "100%", md: "auto" },
                          borderRadius: "10px",
                          mt: { xs: 1.25, md: 0 },
                        }}
                      >
                        Add Your Product
                      </Button>
                    </span>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          );
        })()}
      </Box>

      {/* How It Works, Final CTA, Footer removed per request to keep page minimal for now */}
    </Box>
  );
}
