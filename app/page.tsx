"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, Button, Avatar } from "@mui/joy";
import { useAuth } from "@/lib/auth-context";
import { testimonials } from "@/app/data/testimonials";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/products");
      return;
    }
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
      {
        threshold: 0.2,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    elements.forEach((el, index) => {
      el.classList.add("fade-in-up");
      el.style.setProperty("--fade-delay", `${index * 0.08}s`);
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [user, loading, router]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "transparent",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Navigation */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "rgba(13, 15, 20, 0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(46, 212, 122, 0.1)",
        }}
      >
        <Box
          sx={{
            maxWidth: 1280,
            mx: "auto",
            px: { xs: 2, md: 4 },
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Box component="img" src="/GodsEye.png" alt="GodsEye logo" sx={{ width: 24, height: 24 }} />
            <Typography
              level="h3"
              sx={{
                color: "#F2F5FA",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                fontSize: { xs: "1.4rem", md: "1.6rem" },
              }}
            >
              GodsEye
            </Typography>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4, alignItems: 'center' }}>
            <Typography
              component="a"
              href="/mcp-documentation"
              level="body-md"
              sx={{ color: '#A2A7B4', textDecoration: 'none', fontWeight: 500, '&:hover': { color: '#2ED47A' } }}
            >
              Documentation
            </Typography>
            <Typography
              component="a"
              href="/brochure"
              level="body-md"
              sx={{ color: '#A2A7B4', textDecoration: 'none', fontWeight: 500, '&:hover': { color: '#2ED47A' } }}
            >
              Client Brochure
            </Typography>
            <Typography
              component="a"
              href="/brochure"
              level="body-md"
              sx={{ color: '#A2A7B4', textDecoration: 'none', fontWeight: 500, '&:hover': { color: '#2ED47A' } }}
            >
              Blog
            </Typography>
          </Box>

          <Button
            onClick={() => router.push("/products")}
            variant="solid"
            sx={{
              backgroundColor: "#2ED47A",
              color: "#0D0F14",
              fontWeight: 600,
              px: 3,
              "&:hover": {
                backgroundColor: "#26B869",
              },
            }}
          >
            Get Started
          </Button>
        </Box>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          maxWidth: 1280,
          mx: "auto",
          px: { xs: 2, md: 4 },
          pt: { xs: 6, md: 12 },
          pb: { xs: 6, md: 10 },
          textAlign: "center",
        }}
        data-animate="fade-in-up"
      >
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            px: 2.5,
            py: 1,
            borderRadius: "50px",
            backgroundColor: "rgba(46, 212, 122, 0.1)",
            border: "1px solid rgba(46, 212, 122, 0.2)",
            mb: 4,
          }}
        >
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              backgroundColor: "#2ED47A",
            }}
          />
          <Typography
            level="body-sm"
            sx={{
              color: "#2ED47A",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
          >
            AI-Powered Product Optimization
          </Typography>
        </Box>

        <Typography
          level="h1"
          sx={{
            fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4.5rem" },
            fontWeight: 800,
            mb: 3,
            color: "#F2F5FA",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            maxWidth: 900,
            mx: "auto",
          }}
        >
          Get discovered by AI search engines
        </Typography>

        <Typography
          level="body-lg"
          sx={{
            fontSize: { xs: "1.1rem", md: "1.25rem" },
            color: "#A2A7B4",
            maxWidth: 720,
            mx: "auto",
            mb: 5,
            lineHeight: 1.6,
          }}
        >
          Optimize your products for Perplexity, Google AI Overview, and ChatGPT.
          Get strategic insights and competitive analysis powered by advanced AI.
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: { xs: 1.25, sm: 2 },
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Button
            onClick={() => router.push("/auth")}
            size="lg"
            variant="solid"
            endDecorator={<Box component="span" sx={{ fontSize: 20 }}>→</Box>}
            sx={{
              backgroundColor: "#2ED47A",
              color: "#0D0F14",
              fontWeight: 600,
              fontSize: { xs: "1rem", md: "1.05rem" },
              px: { xs: 2, sm: 3.5, md: 4 },
              py: { xs: 1.1, md: 1.5 },
              width: { xs: "100%", sm: "auto" },
              "&:hover": {
                backgroundColor: "#26B869",
                transform: "translateY(-2px)",
              },
              transition: "all 0.2s ease",
            }}
          >
            Start Optimizing
          </Button>
          <Button
            onClick={() => router.push("/products?view=demo")}
            size="lg"
            variant="outlined"
            sx={{
              borderColor: "rgba(46, 212, 122, 0.4)",
              color: "#F2F5FA",
              fontWeight: 600,
              fontSize: { xs: "1rem", md: "1.05rem" },
              px: { xs: 2, sm: 3.5, md: 4 },
              py: { xs: 1.1, md: 1.5 },
              width: { xs: "100%", sm: "auto" },
              backdropFilter: "blur(6px)",
              backgroundColor: "rgba(15, 18, 24, 0.65)",
              display: "flex",
              alignItems: "center",
              gap: 1,
              "&:hover": {
                backgroundColor: "rgba(15, 18, 24, 0.85)",
                borderColor: "rgba(46, 212, 122, 0.6)",
                transform: "translateY(-2px)",
              },
              transition: "all 0.2s ease",
            }}
          >
            Try a Demo
          </Button>
        </Box>
      </Box>

      {/* Features Grid */}
      <Box
        sx={{
          maxWidth: 1280,
          mx: "auto",
          px: { xs: 2, md: 4 },
          py: { xs: 6, md: 10 },
        }}
        data-animate="fade-in-up"
      >
        <Typography
          level="h2"
          sx={{
            fontSize: { xs: "2rem", md: "2.75rem" },
            fontWeight: 700,
            mb: 1.5,
            color: "#F2F5FA",
            textAlign: "center",
          }}
        >
          Everything you need to dominate AI search
        </Typography>
        <Typography
          level="body-lg"
          sx={{
            color: "#A2A7B4",
            textAlign: "center",
            maxWidth: 640,
            mx: "auto",
            mb: 6,
          }}
        >
          Comprehensive tools to analyze, optimize, and track your product's visibility
          in AI-powered search engines.
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
            gap: 2.5,
          }}
        >
          {[
            {
              icon: "Research",
              title: "Smart Product Analysis",
              description:
                "Extract and analyze product data from any URL. Our AI understands your product's unique value proposition.",
            },
            {
              icon: "AI",
              title: "AI Search Optimization",
              description:
                "Get tailored recommendations to improve your product's visibility in Perplexity, ChatGPT, and Google AI.",
            },
            {
              icon: "Insights",
              title: "Competitive Intelligence",
              description:
                "Understand how your product stacks up against competitors in AI search results and get strategic insights.",
            },
            {
              icon: "Speed",
              title: "Automated Insights",
              description:
                "Receive actionable recommendations powered by advanced AI models analyzing thousands of data points.",
            },
            {
              icon: "Focus",
              title: "Market Positioning",
              description:
                "Discover your target market and understand the problems your product solves better than anyone else.",
            },
            {
              icon: "Reports",
              title: "Strategic Reports",
              description:
                "Export comprehensive analysis reports to share with your team and track optimization progress.",
            },
          ].map((feature, index) => (
            <Box
              key={index}
              sx={{
                p: { xs: 2.5, md: 4 },
                borderRadius: "16px",
                backgroundColor: "rgba(17, 19, 24, 0.6)",
                border: "1px solid rgba(46, 212, 122, 0.1)",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: "rgba(20, 23, 29, 0.8)",
                  borderColor: "rgba(46, 212, 122, 0.3)",
                  transform: "translateY(-4px)",
                },
              }}
              data-animate="fade-in-up"
            >
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  mb: 3,
                  px: 2,
                  py: 0.75,
                  borderRadius: "999px",
                  background:
                    "linear-gradient(135deg, rgba(46, 212, 122, 0.2), rgba(46, 212, 122, 0.08))",
                  border: "1px solid rgba(46, 212, 122, 0.25)",
                  color: "#2ED47A",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                }}
              >
                {feature.icon}
              </Box>
              <Typography
                level="h4"
                sx={{
                  color: "#F2F5FA",
                  fontWeight: 600,
                  mb: 1.25,
                  fontSize: { xs: "1.1rem", md: "1.25rem" },
                }}
              >
                {feature.title}
              </Typography>
              <Typography
                level="body-md"
                sx={{
                  color: "#A2A7B4",
                  lineHeight: 1.6,
                  fontSize: { xs: "0.95rem", md: "1rem" },
                }}
              >
                {feature.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>


      {/* How It Works */}
      <Box
        sx={{
          maxWidth: 1280,
          mx: "auto",
          px: { xs: 2, md: 4 },
          py: { xs: 8, md: 12 },
        }}
        data-animate="fade-in-up"
      >
        <Typography
          level="h2"
          sx={{
            fontSize: { xs: "2rem", md: "2.75rem" },
            fontWeight: 700,
            mb: 2,
            color: "#F2F5FA",
            textAlign: "center",
          }}
        >
          How it works
        </Typography>
        <Typography
          level="body-lg"
          sx={{
            color: "#A2A7B4",
            textAlign: "center",
            maxWidth: 640,
            mx: "auto",
            mb: 8,
          }}
        >
          Three simple steps to optimize your product for AI search engines
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 2.5,
          }}
        >
          {[
            {
              step: "01",
              title: "Import Product Data",
              description:
                "Drop in your product link. GodsEye pulls every relevant detail for you, and you can instantly edit anything before moving on.",
            },
            {
              step: "02",
              title: "Analyze AI Visibility",
              description:
                "We evaluate how your product appears across AI search engines today, surfacing where you rank and who else is being shown.",
            },
            {
              step: "03",
              title: "Get Optimization Guidance",
              description:
                "Receive detailed AI feedback with concrete next steps so your product can become the go-to answer in future AI searches.",
            },
          ].map((item, index) => (
            <Box
              key={index}
              sx={{
                textAlign: "center",
                position: "relative",
              }}
              data-animate="fade-in-up"
            >
              <Typography
                sx={{
                  fontSize: { xs: "3rem", md: "4rem" },
                  fontWeight: 800,
                  color: "rgba(46, 212, 122, 0.1)",
                  mb: 2,
                }}
              >
                {item.step}
              </Typography>
              <Typography
                level="h4"
                sx={{
                  color: "#F2F5FA",
                  fontWeight: 600,
                  mb: 2,
                  fontSize: "1.5rem",
                }}
              >
                {item.title}
              </Typography>
              <Typography
                level="body-md"
                sx={{
                  color: "#A2A7B4",
                  lineHeight: 1.6,
                }}
              >
                {item.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Screenshot Placeholder Section */}
      <Box
        sx={{
          maxWidth: 1280,
          mx: "auto",
          px: { xs: 2, md: 4 },
          py: { xs: 8, md: 12 },
          display: "flex",
          flexDirection: "column",
          gap: { xs: 6, md: 10 },
        }}
      >
        {[{
          eyebrow: "Product Dashboard",
          heading: "Manage every product in one control center",
          body: "Review saved products, see AI-ready summaries, and jump back into optimization instantly.",
          image: "dashboard.png",
          align: "left",
        },
        {
          eyebrow: "Product Data Workspace",
          heading: "Edit and enrich product information in seconds",
          body: "Pull data from any URL and fine-tune specifications before sending it through our optimization flow.",
          image: "product-form.png",
          align: "right",
        },
        {
          eyebrow: "AI Analysis Reports",
          heading: "Turn AI feedback into actionable strategy",
          body: "Get competitor comparisons, messaging direction, and export-ready insights tailored to your product.",
          image: "analysis-results.png",
          align: "left",
        }].map((section, index) => (
          <Box
            key={section.eyebrow}
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                lg: section.align === "left" ? "1.05fr 1fr" : "1fr 1.05fr",
              },
              gap: { xs: 3, lg: 5 },
              alignItems: "center",
            }}
            data-animate="fade-in-up"
            style={{ transitionDelay: `${index * 0.12}s` }}
          >
            {section.align === "left" && (
              <Box sx={{ order: { xs: 1, lg: 1 } }}>
                <Typography
                  level="body-sm"
                  sx={{
                    color: "#2ED47A",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    mb: 1.5,
                  }}
                >
                  {section.eyebrow}
                </Typography>
                <Typography
                  level="h2"
                  sx={{
                    fontSize: { xs: "2rem", md: "3rem" },
                    fontWeight: 700,
                    color: "#F2F5FA",
                    mb: 1.1,
                    lineHeight: 1.05,
                  }}
                >
                  {section.heading}
                </Typography>
                <Typography
                  level="body-lg"
                  sx={{
                    color: "#A2A7B4",
                    fontSize: { xs: "1.02rem", md: "1.12rem" },
                    lineHeight: 1.5,
                    maxWidth: 500,
                  }}
                >
                  {section.body}
                </Typography>
              </Box>
            )}

            <Box
              sx={{
                order: { xs: 2, lg: section.align === "left" ? 2 : 1 },
                borderRadius: "24px",
                background: "radial-gradient(circle at top, rgba(46, 212, 122, 0.25), transparent 65%)",
                p: { xs: 1.25, md: 2 },
                border: "1px solid rgba(46, 212, 122, 0.2)",
                boxShadow: "0 30px 100px rgba(0, 0, 0, 0.4)",
              }}
            >
              <Box
                component="img"
                src={`/images/screenshots/${section.image}`}
                alt={`${section.heading} screenshot`}
                sx={{
                  width: "100%",
                  borderRadius: "18px",
                  border: "1px solid rgba(46, 212, 122, 0.2)",
                  backgroundColor: "rgba(13, 15, 20, 0.95)",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </Box>

            {section.align === "right" && (
              <Box sx={{ order: { xs: 1, lg: 2 } }}>
                <Typography
                  level="body-sm"
                  sx={{
                    color: "#2ED47A",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    mb: 2,
                  }}
                >
                  {section.eyebrow}
                </Typography>
                <Typography
                  level="h2"
                  sx={{
                    fontSize: { xs: "2rem", md: "3rem" },
                    fontWeight: 700,
                    color: "#F2F5FA",
                    mb: 1.1,
                    lineHeight: 1.05,
                  }}
                >
                  {section.heading}
                </Typography>
                <Typography
                  level="body-lg"
                  sx={{
                    color: "#A2A7B4",
                    fontSize: { xs: "1.02rem", md: "1.12rem" },
                    lineHeight: 1.5,
                    maxWidth: 500,
                  }}
                >
                  {section.body}
                </Typography>
              </Box>
            )}
          </Box>
        ))}
      </Box>
      {/* Testimonials Section */}
      <Box
        sx={{
          maxWidth: 1280,
          mx: "auto",
          px: { xs: 2, md: 4 },
          py: { xs: 10, md: 16 },
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "120%",
            height: "120%",
            background: "radial-gradient(circle, rgba(46, 212, 122, 0.03) 0%, transparent 70%)",
            zIndex: -1,
            pointerEvents: "none",
          }
        }}
        data-animate="fade-in-up"
      >
        <Box sx={{ mb: 8, textAlign: "center" }}>
          <Typography
            level="body-sm"
            sx={{
              color: "#2ED47A",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              mb: 2,
            }}
          >
            Social Proof
          </Typography>
          <Typography
            level="h2"
            sx={{
              fontSize: { xs: "2.5rem", md: "3.5rem" },
              fontWeight: 800,
              color: "#F2F5FA",
              letterSpacing: "-0.03em",
              mb: 2,
            }}
          >
            What our clients are saying
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: testimonials.length > 1 ? "repeat(2, 1fr)" : "1fr" },
            gap: 4,
            maxWidth: 1000,
            mx: "auto",
          }}
        >
          {testimonials.map((testimonial) => (
            <Box
              key={testimonial.id}
              sx={{
                p: { xs: 4, md: 6 },
                borderRadius: "32px",
                backgroundColor: "rgba(17, 19, 24, 0.6)",
                border: "1px solid rgba(46, 212, 122, 0.15)",
                backdropFilter: "blur(10px)",
                position: "relative",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  backgroundColor: "rgba(22, 26, 33, 0.8)",
                  borderColor: "rgba(46, 212, 122, 0.3)",
                  transform: "translateY(-6px)",
                  boxShadow: "0 22px 60px rgba(0, 0, 0, 0.5), 0 0 20px rgba(46, 212, 122, 0.05)",
                }
              }}
            >
              <FormatQuoteIcon
                sx={{
                  fontSize: 48,
                  color: "rgba(46, 212, 122, 0.2)",
                  position: "absolute",
                  top: 32,
                  right: 32,
                }}
              />

              <Typography
                sx={{
                  color: "#F2F5FA",
                  fontSize: { xs: "1.1rem", md: "1.25rem" },
                  lineHeight: 1.7,
                  mb: 6,
                  fontStyle: "italic",
                  fontWeight: 400,
                  position: "relative",
                  zIndex: 1,
                  letterSpacing: "0.01em",
                }}
              >
                "{testimonial.content}"
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                <Avatar
                  src={testimonial.image}
                  sx={{
                    width: 64,
                    height: 64,
                    border: "2px solid rgba(46, 212, 122, 0.4)",
                    boxShadow: "0 0 15px rgba(46, 212, 122, 0.2)",
                  }}
                />
                <Box>
                  <Typography
                    level="title-lg"
                    sx={{ color: "#F2F5FA", fontWeight: 700, mb: 0.5, fontSize: "1.2rem" }}
                  >
                    {testimonial.name}
                  </Typography>
                  <Typography
                    level="body-md"
                    sx={{ color: "#A2A7B4", fontWeight: 500 }}
                  >
                    {testimonial.title} @ <Box component="span" sx={{ color: "#2ED47A" }}>{testimonial.company}</Box>
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>


      {/* Final CTA */}
      <Box
        sx={{
          maxWidth: 1280,
          mx: "auto",
          px: { xs: 2, md: 4 },
          py: { xs: 10, md: 14 },
          textAlign: "center",
        }}
        data-animate="fade-in-up"
      >
        <Typography
          level="h2"
          sx={{
            fontSize: { xs: "2.5rem", md: "3.5rem" },
            fontWeight: 800,
            mb: 3,
            color: "#F2F5FA",
            letterSpacing: "-0.02em",
          }}
        >
          Ready to dominate AI search?
        </Typography>
        <Typography
          level="body-lg"
          sx={{
            fontSize: { xs: "1.1rem", md: "1.25rem" },
            color: "#A2A7B4",
            maxWidth: 640,
            mx: "auto",
            mb: 5,
          }}
        >
          Start optimizing your products today and get discovered by millions using AI search engines.
        </Typography>
        <Button
          onClick={() => router.push("/products")}
          size="lg"
          variant="solid"
          endDecorator={<Box component="span" sx={{ fontSize: 20 }}>→</Box>}
          sx={{
            backgroundColor: "#2ED47A",
            color: "#0D0F14",
            fontWeight: 600,
            fontSize: { xs: "1rem", md: "1.05rem" },
            px: { xs: 2.5, sm: 4, md: 5 },
            py: { xs: 1.2, md: 1.75 },
            width: { xs: "100%", sm: "auto" },
            "&:hover": {
              backgroundColor: "#26B869",
              transform: "translateY(-2px)",
            },
            transition: "all 0.2s ease",
          }}
        >
          Get Started Free
        </Button>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          borderTop: "1px solid rgba(46, 212, 122, 0.1)",
          py: 4,
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: { xs: "static", md: "absolute" },
            left: { md: 24, lg: 48 },
            bottom: { md: 24 },
            textAlign: { xs: "center", md: "left" },
            mb: { xs: 2, md: 0 },
          }}
        >
          <Typography
            level="body-xs"
            sx={{
              color: "rgba(162, 167, 180, 0.7)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontWeight: 600,
              mb: 0.4,
            }}
          >
            Contact
          </Typography>
          <Typography
            level="body-sm"
            sx={{
              color: "rgba(226, 230, 240, 0.78)",
              fontWeight: 500,
              letterSpacing: "0.01em",
            }}
          >
            godseye3002@gmail.com
          </Typography>
        </Box>
        <Box
          sx={{
            maxWidth: 1280,
            mx: "auto",
            px: { xs: 2, md: 4 },
            textAlign: "center",
          }}
        >
          <Typography
            level="body-sm"
            sx={{
              color: "#A2A7B4",
            }}
          >
            © 2025 GodsEye. Optimize your products for AI search engines.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
