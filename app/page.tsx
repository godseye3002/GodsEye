"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, Button } from "@mui/joy";
import { useAuth } from "@/lib/auth-context";
import { testimonials } from "@/app/data/testimonials";
import { TestimonialCarousel } from "@/components/TestimonialCarousel";
import { motion, Variants } from "framer-motion";
import SplineHeroBackground from "@/components/SplineHeroBackground";
import { ScrambleText } from "@/components/ScrambleText";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  /* ── refs ─────────────────────────────── */
  const shiftSectionRef = useRef<HTMLDivElement>(null);
  const shiftScenesRef = useRef<HTMLDivElement>(null);
  const shiftIndicatorRef = useRef<HTMLDivElement>(null);
  const gapCardsRef = useRef<HTMLDivElement>(null);
  const jobsRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/products");
      return;
    }
  }, [user, loading, router]);

  /* ── palette ─────────────────────────── */
  const accent = "#2ED47A";
  const primary = "#F2F5FA";
  const secondary = "rgba(242, 245, 250, 0.55)";
  const danger = "#F35B64";
  const border = "rgba(46, 212, 122, 0.12)";
  const cardBg = "rgba(17, 19, 24, 0.85)";
  const strongEaseOut: [number, number, number, number] = [0.23, 1, 0.32, 1];

  /* ── framer variants ─────────────────── */
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.96, y: 12 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.6, ease: strongEaseOut },
    },
  };

  /* ── GSAP setup ──────────────────────── */
  useEffect(() => {
    // Respect reduced motion
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      /* ── ACT 2: "The Shift" scrollytelling pin ── */
      if (shiftSectionRef.current && shiftScenesRef.current) {
        const scenes = shiftScenesRef.current.querySelectorAll("[data-scene]");
        const indicator = shiftIndicatorRef.current;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: shiftSectionRef.current,
            start: "top top",
            end: `+=${window.innerHeight * 3.5}`,
            pin: true,
            scrub: 1.5,
            snap: {
              snapTo: 1 / (scenes.length - 1),
              duration: { min: 0.2, max: 0.6 },
              delay: 0.1,
              ease: "power2.inOut",
            },
          },
        });

        scenes.forEach((scene, i) => {
          if (i === 0) {
            gsap.set(scene, { opacity: 1, y: 0 });
          } else {
            gsap.set(scene, { opacity: 0, y: 30 });
          }

          if (i > 0) {
            const pos = `scene${i}`;
            // Fade out previous scene
            tl.to(scenes[i - 1], { opacity: 0, y: -40, duration: 0.5 }, pos);
            // Fade in current scene
            tl.to(scene, { opacity: 1, y: 0, duration: 0.5 }, pos);
            // Move indicator
            if (indicator) {
              tl.to(indicator, { y: i * 56, duration: 0.5 }, pos);
            }
          }
        });
      }

      /* ── ACT 3: Visibility Gap — stagger cards ── */
      if (gapCardsRef.current) {
        const cards = gapCardsRef.current.querySelectorAll("[data-gap-card]");
        gsap.set(cards, { opacity: 0, y: 40 });

        ScrollTrigger.create({
          trigger: gapCardsRef.current,
          start: "top 80%",
          onEnter: () => {
            gsap.to(cards, {
              opacity: 1,
              y: 0,
              duration: 0.7,
              stagger: 0.12,
              ease: "power3.out",
            });
          },
          once: true,
        });
      }

      /* ── ACT 4: Two Jobs — card reveal ── */
      if (jobsRef.current) {
        const jobCards = jobsRef.current.querySelectorAll("[data-job-card]");
        jobCards.forEach((card) => {
          gsap.set(card, { opacity: 0, y: 50 });
          ScrollTrigger.create({
            trigger: card,
            start: "top 85%",
            onEnter: () => {
              gsap.to(card, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" });
            },
            once: true,
          });

          // Image clip-path reveal
          const img = card.querySelector("[data-job-image]");
          if (img) {
            gsap.set(img, { clipPath: "inset(0 100% 0 0)" });
            ScrollTrigger.create({
              trigger: card,
              start: "top 60%",
              onEnter: () => {
                gsap.to(img, {
                  clipPath: "inset(0 0% 0 0)",
                  duration: 1.2,
                  ease: "power3.inOut",
                });
              },
              once: true,
            });
          }
        });
      }

      /* ── ACT 5: Timeline scrub ── */
      if (timelineRef.current && timelineLineRef.current) {
        gsap.set(timelineLineRef.current, { scaleX: 0, transformOrigin: "left center" });

        gsap.to(timelineLineRef.current, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: timelineRef.current,
            start: "top 70%",
            end: "bottom 50%",
            scrub: 1,
          },
        });

        const steps = timelineRef.current.querySelectorAll("[data-timeline-step]");
        steps.forEach((step, i) => {
          gsap.set(step, { opacity: 0, y: 30 });
          ScrollTrigger.create({
            trigger: step,
            start: "top 85%",
            onEnter: () => {
              gsap.to(step, {
                opacity: 1,
                y: 0,
                duration: 0.6,
                delay: i * 0.1,
                ease: "power3.out",
              });
            },
            once: true,
          });
        });
      }
    });

    return () => {
      mm.revert();
    };
  }, []);

  /* ── data ─────────────────────────────── */
  const shiftScenes = [
    {
      label: "The Old Game",
      color: secondary,
      borderColor: "rgba(255,255,255,0.07)",
      bg: "rgba(17,19,24,0.4)",
      lines: [
        'Customer Googles "best accounting software"',
        "They see 10 blue links & click a few",
        "Your SEO ranking determines if they find you",
        "You track clicks, sessions, and bounce rate",
      ],
      note: "Still works. But fewer people play it every day.",
      noteColor: "rgba(255,255,255,0.35)",
    },
    {
      label: "The New Game",
      color: accent,
      borderColor: "rgba(46,212,122,0.25)",
      bg: "rgba(46,212,122,0.04)",
      lines: [
        'Customer asks ChatGPT "best accounting software"',
        "AI names one brand. Usually the same one every time.",
        "Your AI reputation determines if they hear your name",
        "Most companies have zero visibility into this channel",
      ],
      note: "This is happening right now. Most brands are invisible.",
      noteColor: danger,
    },
    {
      label: "The Blind Spot",
      color: danger,
      borderColor: "rgba(243,91,100,0.2)",
      bg: "rgba(243,91,100,0.04)",
      lines: [
        "Google Analytics marks AI visitors as 'Direct Traffic'",
        "You can't tell if ChatGPT is sending you thousands",
        "You have zero proof these visitors converted",
        "Every decision about AI visibility is a guess",
      ],
      note: "Visibility without measurement is just hope.",
      noteColor: "rgba(255,255,255,0.35)",
    },
    {
      label: "The GodsEye Advantage",
      color: accent,
      borderColor: "rgba(46,212,122,0.3)",
      bg: "rgba(46,212,122,0.06)",
      lines: [
        "See exactly where you rank in AI answers",
        "Know which AI engine sent each visitor",
        "Track the full journey from AI click to conversion",
        "Prove AI is driving real revenue — not just traffic",
      ],
      note: "GodsEye closes the loop. Visibility + Attribution.",
      noteColor: accent,
    },
  ];

  const gapCards = [
    {
      icon: "?",
      color: danger,
      bg: "rgba(243,91,100,0.07)",
      bdr: "rgba(243,91,100,0.2)",
      title: "Zero Source Visibility",
      body: "Google Analytics marks ChatGPT and Perplexity visitors as 'Direct Traffic.' You can't see them. You don't know they exist.",
    },
    {
      icon: "?",
      color: "#FBBF24",
      bg: "rgba(251,191,36,0.07)",
      bdr: "rgba(251,191,36,0.2)",
      title: "No Conversion Proof",
      body: "Even if AI is sending you thousands of visitors per month, you have no way to see whether they clicked your 'Book a Demo' button or just bounced.",
    },
    {
      icon: "?",
      color: danger,
      bg: "rgba(243,91,100,0.07)",
      bdr: "rgba(243,91,100,0.2)",
      title: "No Way to Improve",
      body: "You can't fix what you can't see. Without knowing which AI engines are sending visitors and which pages are converting, every decision is a guess.",
    },
  ];

  const timelineSteps = [
    {
      step: "01",
      title: "Add Your Product",
      body: "Drop in your website URL. GodsEye pulls in your content, products, and brand information automatically. Review it, edit if needed. Done.",
      color: "#38BDF8",
    },
    {
      step: "02",
      title: "Run the AI Audit",
      body: "We query ChatGPT, Perplexity, and Google AI across hundreds of searches relevant to your product. You get your visibility score in 24–48 hours.",
      color: "#A78BFA",
    },
    {
      step: "03",
      title: "Track Real Conversions",
      body: "Add one script tag to your site. From that moment, every AI-referred visitor, every page they visit, and every button they click is tracked and attributed.",
      color: accent,
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", width: "100%", backgroundColor: "#0D0F14", overflowX: "hidden" }}>

      {/* ══════════ NAV ══════════ */}
      <Box sx={{
        position: "sticky", top: 0, zIndex: 50,
        backgroundColor: "rgba(13, 15, 20, 0.85)",
        backdropFilter: "blur(14px)",
        borderBottom: `1px solid ${border}`,
      }}>
        <Box sx={{
          maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, py: 1.75,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Box component="img" src="/GodsEye.png" alt="GodsEye logo" sx={{ width: 26, height: 26 }} />
            <Typography sx={{ color: primary, fontWeight: 800, fontSize: "1.45rem", letterSpacing: "-0.03em", fontFamily: "var(--font-array)" }}>
              GodsEye
            </Typography>
          </Box>

          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 4, alignItems: "center" }}>
            {[
              { label: "Documentation", href: "/mcp-documentation" },
              { label: "Client Brochure", href: "/brochure" },
            ].map(link => (
              <Typography
                key={link.label}
                component="a" href={link.href} level="body-md"
                sx={{ color: secondary, textDecoration: "none", fontWeight: 500, fontFamily: "var(--font-khand)", "&:hover": { color: accent } }}
              >
                {link.label}
              </Typography>
            ))}
          </Box>

          <Button
            onClick={() => router.push(user ? "/products" : "/auth")}
            variant="solid"
            data-godseye-cta="GetStarted"
            sx={{
              backgroundColor: accent, color: "#0D0F14", fontWeight: 700, px: 3,
              fontFamily: "var(--font-khand)",
              "&:hover": { backgroundColor: "#26B869" },
              transition: "background-color 0.2s cubic-bezier(0.23, 1, 0.32, 1), transform 0.16s ease-out",
              "&:active": { transform: "scale(0.97)" },
            }}
          >
            Get Started
          </Button>
        </Box>
      </Box>

      {/* ══════════ ACT 1 — HERO ══════════ */}
      <Box sx={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        px: { xs: 2, md: 4 },
      }}>
        <SplineHeroBackground />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ position: "relative", zIndex: 1, maxWidth: 900 }}
        >
          {/* Brand Mark */}
          <motion.div variants={itemVariants}>
            <Typography sx={{ 
              color: primary,
              fontSize: { xs: "3.5rem", md: "5.5rem" },
              fontWeight: 900,
              fontFamily: "var(--font-array)",
              letterSpacing: "-0.04em",
              lineHeight: 1,
              mb: 1.5,
              background: `linear-gradient(to bottom, ${primary} 0%, rgba(242, 245, 250, 0.4) 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 30px rgba(255,255,255,0.1)",
            }}>
              <ScrambleText text="GodsEye" delay={0.5} duration={1.8} />
            </Typography>
          </motion.div>

          {/* Headline */}
          <motion.div variants={itemVariants}>
            <Typography level="h1" sx={{
              fontSize: { xs: "1.25rem", md: "1.75rem" },
              fontWeight: 500, color: secondary, letterSpacing: "0.02em", lineHeight: 1.4, mb: 5,
              fontFamily: "var(--font-khand)",
              maxWidth: 640, mx: "auto",
            }}>
              Your customers ask AI who to trust.
              <Box component="span" sx={{ color: accent, fontWeight: 700 }}> Are they hearing your name?</Box>
            </Typography>
          </motion.div>

          {/* CTAs */}
          <motion.div variants={itemVariants}>
            <Box sx={{ display: "flex", gap: 2.5, justifyContent: "center", flexWrap: "wrap" }}>
              <Button
                component={motion.button}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/auth")}
                size="lg" variant="solid"
                data-godseye-cta="ExplorePlatform"
                sx={{
                  backgroundColor: accent, color: "#0D0F14", fontWeight: 700,
                  fontSize: "0.95rem", px: 4, py: 1.5, borderRadius: "12px",
                  fontFamily: "var(--font-khand)",
                  "&:hover": { backgroundColor: "#26B869", transform: "translateY(-2px)" },
                  transition: "background-color 0.2s cubic-bezier(0.23, 1, 0.32, 1), transform 0.2s cubic-bezier(0.23, 1, 0.32, 1)",
                }}
              >
                Explore the Platform
              </Button>
              <Button
                component={motion.button}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/brochure")}
                size="lg" variant="outlined"
                sx={{
                  borderColor: "rgba(242, 245, 250, 0.2)", color: primary, fontWeight: 600,
                  fontSize: "0.95rem", px: 4, py: 1.5, borderRadius: "12px",
                  fontFamily: "var(--font-khand)",
                  backdropFilter: "blur(6px)", backgroundColor: "rgba(15, 18, 24, 0.4)",
                  "&:hover": { backgroundColor: "rgba(15, 18, 24, 0.6)", borderColor: "rgba(242, 245, 250, 0.4)", transform: "translateY(-2px)" },
                  transition: "background-color 0.2s cubic-bezier(0.23, 1, 0.32, 1), border-color 0.2s cubic-bezier(0.23, 1, 0.32, 1), transform 0.2s cubic-bezier(0.23, 1, 0.32, 1)",
                }}
              >
                View Strategic Narrative →
              </Button>
            </Box>
          </motion.div>
        </motion.div>
      </Box>

      {/* Dashboard Preview */}
      <Box sx={{ mt: 2, position: "relative", px: { xs: 1, md: 4 } }}>
        <Box sx={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          width: "85%", height: "80%", borderRadius: "100%",
          background: "radial-gradient(circle, rgba(46,212,122,0.1) 0%, transparent 70%)",
          filter: "blur(60px)", zIndex: -1,
        }} />
        <Box sx={{
          border: `1px solid ${border}`, borderRadius: "24px", overflow: "hidden",
          boxShadow: "0 40px 100px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)",
          backgroundColor: "#000", p: 1,
          maxWidth: 1100, mx: "auto", position: "relative",
        }}>
          <Box component="img" src="/images/screenshots/dashboard.png"
            alt="GodsEye Dashboard"
            sx={{ width: "100%", height: "auto", borderRadius: "16px", display: "block" }} />
        </Box>
      </Box>

      {/* ══════════ ACT 2 — "THE SHIFT" (GSAP Scrollytelling Pin) ══════════ */}
      <Box
        ref={shiftSectionRef}
        sx={{
          minHeight: "100vh",
          maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 6, md: 10 },
          display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 6,
          alignItems: "center",
        }}
      >
        {/* Left — Scene Navigator */}
        <Box sx={{ flex: "0 0 280px", display: { xs: "none", md: "block" }, position: "relative" }}>
          <Typography level="body-sm" sx={{ color: accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", mb: 3, fontFamily: "var(--font-khand)" }}>
            Something has changed
          </Typography>
          <Typography level="h2" sx={{
            fontSize: "2.5rem", fontWeight: 800, color: primary,
            fontFamily: "var(--font-khand)", lineHeight: 1.15, mb: 5,
          }}>
            Google gets you found.
            <Box component="span" sx={{ color: accent, display: "block" }}>AI gets you chosen.</Box>
          </Typography>

          <Box sx={{ position: "relative" }}>
            {/* Active indicator */}
            <Box
              ref={shiftIndicatorRef}
              sx={{
                position: "absolute", left: 0, top: 0,
                width: 3, height: 44, borderRadius: 4,
                backgroundColor: accent,
                transition: "none", /* GSAP controls this */
              }}
            />
            {shiftScenes.map((scene, i) => (
              <Box key={i} sx={{ pl: 3, py: 1.5, mb: 0.5 }}>
                <Typography sx={{
                  color: i === 0 ? primary : secondary,
                  fontWeight: 600, fontSize: "0.9rem",
                  fontFamily: "var(--font-khand)",
                }}>
                  {scene.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Right — Scene Cards */}
        <Box ref={shiftScenesRef} sx={{ flex: 1, position: "relative", minHeight: 360 }}>
          {shiftScenes.map((col, i) => (
            <Box
              key={col.label}
              data-scene
              sx={{
                position: i === 0 ? "relative" : "absolute",
                top: 0, left: 0, width: "100%",
                bgcolor: col.bg,
                border: `1px solid ${col.borderColor}`,
                borderRadius: "20px",
                p: { xs: 3, md: 4 },
              }}
            >
              <Typography level="title-md" sx={{ color: col.color, fontWeight: 700, mb: 2.5, fontFamily: "var(--font-khand)" }}>
                <ScrambleText text={col.label} duration={0.8} />
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 3 }}>
                {col.lines.map((line, li) => (
                  <Box key={li} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                    <Box sx={{
                      minWidth: 20, height: 20, borderRadius: "50%",
                      bgcolor: `${col.color}18`, border: `1px solid ${col.color}44`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      mt: 0.2, flexShrink: 0,
                    }}>
                      <Typography sx={{ fontSize: "0.65rem", color: col.color, fontWeight: 700 }}>{li + 1}</Typography>
                    </Box>
                    <Typography level="body-md" sx={{ color: secondary, lineHeight: 1.65 }}>{line}</Typography>
                  </Box>
                ))}
              </Box>
              <Typography level="body-sm" sx={{ color: col.noteColor, fontStyle: "italic" }}>{col.note}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ══════════ ACT 3 — "VISIBILITY GAP" ══════════ */}
      <Box sx={{
        borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`,
        bgcolor: "rgba(17,19,24,0.5)",
      }}>
        <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 6, md: 10 } }}>
          <Box sx={{ maxWidth: 860, mx: "auto", textAlign: "center", mb: { xs: 6, md: 8 } }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, ease: strongEaseOut }}>
              <Typography level="body-sm" sx={{ color: danger, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", mb: 2, fontFamily: "var(--font-khand)" }}>
                The Visibility Gap
              </Typography>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, delay: 0.08, ease: strongEaseOut }}>
              <Typography level="h2" sx={{ fontSize: { xs: "2rem", md: "3rem" }, fontWeight: 800, color: primary, fontFamily: "var(--font-khand)", lineHeight: 1.15, mb: 3 }}>
                Some brands are trying to get into AI answers.
                <Box component="span" sx={{ color: danger, display: "block" }}>But they're flying completely blind.</Box>
              </Typography>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, delay: 0.16, ease: strongEaseOut }}>
              <Typography level="body-lg" sx={{ color: secondary, lineHeight: 1.8 }}>
                Even if ChatGPT mentions your brand — how do you know? How do you know those visitors converted?
                Traditional analytics label AI traffic as &quot;Direct.&quot; The full story is invisible to you.
              </Typography>
            </motion.div>
          </Box>

          {/* Gap Cards — animated by GSAP */}
          <Box ref={gapCardsRef} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
            {gapCards.map(card => (
              <Box key={card.title} data-gap-card sx={{
                bgcolor: card.bg, border: `1px solid ${card.bdr}`, borderRadius: "20px", p: 3.5,
              }}>
                <Box sx={{
                  display: "inline-flex", width: 36, height: 36, borderRadius: "10px",
                  bgcolor: `${card.color}18`, border: `1px solid ${card.bdr}`,
                  alignItems: "center", justifyContent: "center", mb: 2,
                }}>
                  <Typography sx={{ color: card.color, fontWeight: 800, fontSize: "1rem" }}>{card.icon}</Typography>
                </Box>
                <Typography level="title-md" sx={{ color: primary, fontWeight: 700, mb: 1, fontFamily: "var(--font-khand)" }}>{card.title}</Typography>
                <Typography level="body-md" sx={{ color: secondary, lineHeight: 1.7 }}>{card.body}</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: 4, p: { xs: 3, md: 4 }, bgcolor: "rgba(243,91,100,0.05)", border: "1px solid rgba(243,91,100,0.15)", borderRadius: "16px", textAlign: "center" }}>
            <Typography level="title-lg" sx={{ color: primary, fontWeight: 700, fontStyle: "italic" }}>
              &quot;Visibility is great. But visibility doesn&apos;t pay your payroll. Conversions do.&quot;
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ══════════ ACT 4 — "TWO JOBS" ══════════ */}
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 6, md: 10 } }}>
        <Box sx={{ textAlign: "center", mb: { xs: 6, md: 8 } }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, ease: strongEaseOut }}>
            <Typography level="body-sm" sx={{ color: accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", mb: 2, fontFamily: "var(--font-khand)" }}>
              Global Intelligence
            </Typography>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, delay: 0.08, ease: strongEaseOut }}>
            <Typography level="h2" sx={{ fontSize: { xs: "2rem", md: "3rem" }, fontWeight: 800, color: primary, fontFamily: "var(--font-khand)", lineHeight: 1.15, mb: 3 }}>
              Our mission is dual.
              <Box component="span" sx={{ color: accent, display: "block" }}>Both are essential.</Box>
            </Typography>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, delay: 0.16, ease: strongEaseOut }}>
            <Typography level="body-lg" sx={{ color: secondary, maxWidth: 620, mx: "auto", lineHeight: 1.8 }}>
              Most tools do one or the other. We do both — because getting visibility without tracking it is just half the story.
            </Typography>
          </motion.div>
        </Box>

        <Box ref={jobsRef} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 3, mb: 4 }}>
          {/* JOB 1 */}
          <Box data-job-card sx={{
            bgcolor: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: "24px",
            p: { xs: 3.5, md: 5 }, display: "flex", flexDirection: "column",
          }}>
            <Box sx={{ display: "inline-flex", px: 2, py: 0.75, bgcolor: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)", borderRadius: "8px", mb: 3 }}>
              <Typography sx={{ color: "#38BDF8", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.1em" }}>JOB 01</Typography>
            </Box>
            <Typography level="h3" sx={{ color: primary, fontWeight: 800, mb: 1.5, fontSize: { xs: "1.5rem", md: "1.9rem" }, fontFamily: "var(--font-khand)" }}>
              Get Your Brand into AI Answers
            </Typography>
            <Typography level="body-lg" sx={{ color: secondary, lineHeight: 1.8, mb: 3 }}>
              We run your brand through hundreds of real queries on ChatGPT, Perplexity, and Google AI.
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 4 }}>
              {[
                { label: "AI Visibility Score", desc: "Know exactly where you stand across every major AI engine today." },
                { label: "Competitor Gap Analysis", desc: "See who AI recommends instead of you — and exactly why they win." },
                { label: "Your Fix Plan", desc: "A prioritized, specific list of changes your team can implement this week." },
              ].map(f => (
                <Box key={f.label} sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                  <Box sx={{ minWidth: 20, height: 20, borderRadius: "4px", bgcolor: "rgba(56,189,248,0.15)", display: "flex", alignItems: "center", justifyContent: "center", mt: 0.3, flexShrink: 0 }}>
                    <Typography sx={{ fontSize: "0.75rem", color: "#38BDF8", fontWeight: 700 }}>✓</Typography>
                  </Box>
                  <Box>
                    <Typography level="body-md" sx={{ color: primary, fontWeight: 600 }}>{f.label}</Typography>
                    <Typography level="body-sm" sx={{ color: secondary }}>{f.desc}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            <Box sx={{ mt: "auto", pt: 3, borderTop: "1px solid rgba(56,189,248,0.15)" }}>
              <Box data-job-image sx={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
                <Box component="img" src="/images/screenshots/Audit-Website-Dashboard.png" alt="Audit Preview" sx={{ width: "100%", height: "auto", display: "block" }} />
              </Box>
            </Box>
          </Box>

          {/* JOB 2 */}
          <Box data-job-card sx={{
            bgcolor: "rgba(46,212,122,0.05)", border: "1px solid rgba(46,212,122,0.25)", borderRadius: "24px",
            p: { xs: 3.5, md: 5 }, display: "flex", flexDirection: "column",
          }}>
            <Box sx={{ display: "inline-flex", px: 2, py: 0.75, bgcolor: "rgba(46,212,122,0.1)", border: "1px solid rgba(46,212,122,0.3)", borderRadius: "8px", mb: 3 }}>
              <Typography sx={{ color: accent, fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.1em" }}>JOB 02</Typography>
            </Box>
            <Typography level="h3" sx={{ color: primary, fontWeight: 800, mb: 1.5, fontSize: { xs: "1.5rem", md: "1.9rem" }, fontFamily: "var(--font-khand)" }}>
              Prove It&apos;s Driving Real Revenue
            </Typography>
            <Typography level="body-lg" sx={{ color: secondary, lineHeight: 1.8, mb: 3 }}>
              From entry page to final click — know the full path AI visitors take on your site.
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 4 }}>
              {[
                { label: "True Source Attribution", desc: "See exactly which AI engine — ChatGPT, Perplexity, Gemini — sent each visitor." },
                { label: "Full Journey Mapping", desc: "Track the path from entry page to your most valuable 'Book a Call' click." },
                { label: "CTA Conversion Tracking", desc: "Know which journey patterns are actually converting. Stop guessing." },
              ].map(f => (
                <Box key={f.label} sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                  <Box sx={{ minWidth: 20, height: 20, borderRadius: "4px", bgcolor: "rgba(46,212,122,0.15)", display: "flex", alignItems: "center", justifyContent: "center", mt: 0.3, flexShrink: 0 }}>
                    <Typography sx={{ fontSize: "0.75rem", color: accent, fontWeight: 700 }}>✓</Typography>
                  </Box>
                  <Box>
                    <Typography level="body-md" sx={{ color: primary, fontWeight: 600 }}>{f.label}</Typography>
                    <Typography level="body-sm" sx={{ color: secondary }}>{f.desc}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            <Box sx={{ mt: "auto", pt: 3, borderTop: "1px solid rgba(46,212,122,0.15)" }}>
              <Box data-job-image sx={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
                <Box component="img" src="/images/screenshots/Conversion-tracking-dashboard.png" alt="Tracking Preview" sx={{ width: "100%", height: "auto", display: "block" }} />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Combined value prop */}
        <Box sx={{ p: { xs: 3, md: 4 }, bgcolor: cardBg, border: `1px solid ${border}`, borderRadius: "20px", textAlign: "center" }}>
          <Typography level="title-lg" sx={{ color: primary, fontWeight: 700, mb: 1 }}>
            Together, they tell the full story.
          </Typography>
          <Typography level="body-md" sx={{ color: secondary, maxWidth: 680, mx: "auto", lineHeight: 1.75 }}>
            Job 01 gets you into the AI answers. Job 02 proves those answers are driving revenue.
            Without both, you&apos;re either invisible or unaccountable. GodsEye gives you both.
          </Typography>
        </Box>
      </Box>

      {/* ══════════ ACT 5 — "HOW IT WORKS" (GSAP Timeline Scrub) ══════════ */}
      <Box sx={{ borderTop: `1px solid ${border}`, bgcolor: "rgba(17,19,24,0.4)" }}>
        <Box ref={timelineRef} sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 6, md: 10 } }}>
          <Box sx={{ textAlign: "center", mb: { xs: 5, md: 8 } }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: strongEaseOut }}>
              <Typography level="h2" sx={{ fontSize: { xs: "2rem", md: "2.75rem" }, fontWeight: 800, color: primary, mb: 2, fontFamily: "var(--font-khand)" }}>
                Up and running in three steps
              </Typography>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.08, ease: strongEaseOut }}>
              <Typography level="body-lg" sx={{ color: secondary, maxWidth: 560, mx: "auto", lineHeight: 1.75 }}>
                No long setup. No complex integration. You can have your first audit results today.
              </Typography>
            </motion.div>
          </Box>

          {/* Progress line */}
          <Box sx={{ position: "relative", mb: 4, mx: { md: 8 } }}>
            <Box sx={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2 }} />
            <Box ref={timelineLineRef} sx={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, bgcolor: accent, borderRadius: 2 }} />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
            {timelineSteps.map((item) => (
              <Box
                key={item.step}
                data-timeline-step
                sx={{
                  p: { xs: 3, md: 4 }, borderRadius: "20px",
                  bgcolor: cardBg, border: `1px solid ${border}`,
                  position: "relative",
                  "&:hover": { borderColor: `${item.color}44`, transform: "translateY(-4px)" },
                  transition: "border-color 0.3s cubic-bezier(0.23, 1, 0.32, 1), transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
                }}
              >
                <Typography sx={{ color: `${item.color}22`, fontWeight: 900, fontSize: "4rem", lineHeight: 1, mb: 2, fontStyle: "italic" }}>
                  {item.step}
                </Typography>
                <Typography level="h4" sx={{ color: primary, fontWeight: 700, mb: 1.5, fontSize: "1.2rem", fontFamily: "var(--font-khand)" }}>
                  {item.title}
                </Typography>
                <Typography level="body-md" sx={{ color: secondary, lineHeight: 1.7 }}>
                  {item.body}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ══════════ ACT 6 — SOCIAL PROOF ══════════ */}
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 6, md: 10 } }}>
        <Box sx={{ textAlign: "center", mb: { xs: 5, md: 7 } }}>
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: strongEaseOut }}>
            <Typography level="body-sm" sx={{ color: accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", mb: 1.5, fontFamily: "var(--font-khand)" }}>
              Social Proof
            </Typography>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.08, ease: strongEaseOut }}>
            <Typography level="h2" sx={{ fontSize: { xs: "2rem", md: "2.75rem" }, fontWeight: 800, color: primary, fontFamily: "var(--font-khand)" }}>
              What our clients are saying
            </Typography>
          </motion.div>
        </Box>
        <TestimonialCarousel testimonials={testimonials} variant="landing" />
      </Box>

      {/* ══════════ ACT 7 — CTA ══════════ */}
      <Box sx={{ borderTop: `1px solid ${border}`, bgcolor: "rgba(46,212,122,0.02)" }}>
        <Box sx={{
          maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 },
          py: { xs: 8, md: 14 }, textAlign: "center",
        }}>
          <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: strongEaseOut }}>
            <Typography level="body-sm" sx={{ color: accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", mb: 2, fontFamily: "var(--font-khand)" }}>
              Free Pilot — Limited spots
            </Typography>
            <Typography level="h2" sx={{
              fontSize: { xs: "2.2rem", md: "3.5rem" },
              fontWeight: 800, color: primary, letterSpacing: "-0.02em", mb: 3, lineHeight: 1.1,
              fontFamily: "var(--font-khand)",
            }}>
              Stop guessing if AI is helping you.
              <Box component="span" sx={{ color: accent, display: "block" }}>Start knowing.</Box>
            </Typography>
            <Typography level="body-lg" sx={{
              color: secondary, maxWidth: 560, mx: "auto", mb: 6, lineHeight: 1.75,
            }}>
              Let us run a full audit on how AI currently views your brand.
              We will show you the gaps, the competitors winning your space, and exactly how much revenue
              is going uncaptured. No cost. If you see value, we continue. If not, you keep the audit.
            </Typography>
          </motion.div>

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap", mb: 4 }}>
            <Button
              component={motion.button}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push(user ? "/products" : "/auth")}
              size="lg" variant="solid"
              data-godseye-cta="GetStartedFree"
              endDecorator={<Box component="span" sx={{ fontSize: 20 }}>→</Box>}
              sx={{
                backgroundColor: accent, color: "#0D0F14", fontWeight: 700,
                fontSize: { xs: "1rem", md: "1.1rem" }, px: { xs: 3, md: 5 }, py: { xs: 1.2, md: 1.75 },
                fontFamily: "var(--font-khand)",
                "&:hover": { backgroundColor: "#26B869", transform: "translateY(-2px)" },
                transition: "background-color 0.2s cubic-bezier(0.23, 1, 0.32, 1), transform 0.2s cubic-bezier(0.23, 1, 0.32, 1)",
              }}
            >
              Get Started Free
            </Button>
            <Button
              component={motion.button}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/brochure")}
              size="lg" variant="outlined"
              sx={{
                borderColor: "rgba(46, 212, 122, 0.35)", color: primary, fontWeight: 600,
                fontSize: { xs: "1rem", md: "1.1rem" }, px: { xs: 3, md: 4 },
                fontFamily: "var(--font-khand)",
                "&:hover": { borderColor: accent, bgcolor: "rgba(46,212,122,0.06)", transform: "translateY(-2px)" },
                transition: "border-color 0.2s cubic-bezier(0.23, 1, 0.32, 1), background-color 0.2s cubic-bezier(0.23, 1, 0.32, 1), transform 0.2s cubic-bezier(0.23, 1, 0.32, 1)",
              }}
            >
              Read Full Pitch
            </Button>
          </Box>

          <Typography level="body-sm" sx={{ color: "rgba(242,245,250,0.3)" }}>
            No credit card required · Free pilot · Cancel anytime
          </Typography>
        </Box>
      </Box>

      {/* ══════════ FOOTER ══════════ */}
      <Box sx={{ borderTop: `1px solid ${border}`, py: 4 }}>
        <Box sx={{
          maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 },
          display: "flex", flexDirection: { xs: "column", md: "row" },
          alignItems: "center", justifyContent: "space-between", gap: 2,
        }}>
          <Typography level="body-sm" sx={{ color: "rgba(242,245,250,0.3)" }}>
            © 2025 GodsEye — AI Visibility & Conversion Intelligence
          </Typography>
          <Typography level="body-sm" sx={{ color: "rgba(242,245,250,0.3)" }}>
            godseye3002@gmail.com
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
