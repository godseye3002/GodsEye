"use client";

import React, { useState } from "react";
import { Box, Card, Typography, Stack, Tabs, TabList, Tab, TabPanel, Button } from "@mui/joy";
import { HugeiconsIcon } from "@hugeicons/react";
import { CodeCircleIcon, Copy01Icon, CheckmarkCircle01Icon, InformationCircleIcon, CursorIcon, TargetIcon } from "@hugeicons/core-free-icons";
import { useAuth } from "@/lib/auth-context";
import { useProductStore } from "@/app/optimize/store";

export function ConversionTrackerSetup() {
  const { user } = useAuth();
  const currentProductId = useProductStore((state) => state.currentProductId);
  const [copiedNext, setCopiedNext] = useState(false);
  const [copiedOtherSSR, setCopiedOtherSSR] = useState(false);
  const [copiedOld, setCopiedOld] = useState(false);

  const uid = user?.id || "YOUR_USER_ID";
  const pid = currentProductId || "YOUR_PRODUCT_ID";

  const nextJsCode = `<Script src="https://snowy-thunder-12e3.buildai2024.workers.dev/tracker.js?uid=${uid}&pid=${pid}&desc=Global+tracking" strategy="afterInteractive"/>`;

  const otherSSRCode = `<script src="https://snowy-thunder-12e3.buildai2024.workers.dev/tracker.js?uid=${uid}&pid=${pid}&desc=Global+tracking" defer></script>`;

  const htmlCode = `<script src="https://snowy-thunder-12e3.buildai2024.workers.dev/tracker.js?uid=${uid}&pid=${pid}&desc=Homepage+landing+page" defer></script>`;

  const handleCopy = (code: string, type: "next" | "ssr" | "old") => {
    navigator.clipboard.writeText(code);
    if (type === "next") {
      setCopiedNext(true);
      setTimeout(() => setCopiedNext(false), 2000);
    } else if (type === "ssr") {
      setCopiedOtherSSR(true);
      setTimeout(() => setCopiedOtherSSR(false), 2000);
    } else {
      setCopiedOld(true);
      setTimeout(() => setCopiedOld(false), 2000);
    }
  };

  const codeBoxStyles = {
    p: 3,
    borderRadius: "12px",
    background: "#0D0F14",
    border: "1px solid rgba(255,255,255,0.1)",
    position: "relative" as const,
    fontFamily: "monospace",
    fontSize: "13px",
    color: "#a2a7b4",
    overflow: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  };

  return (
    <Card
      variant="outlined"
      sx={{
        p: { xs: 3, md: 4 },
        background: "linear-gradient(135deg, rgba(13, 15, 20, 0.8), rgba(10, 12, 16, 0.9))",
        backdropFilter: "blur(20px)",
        borderColor: "rgba(46, 212, 122, 0.15)",
        borderRadius: "24px",
      }}
    >
      <Stack spacing={4}>
        <Box>
          <Typography level="h3" sx={{ color: "#F2F5FA", fontWeight: 800, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: "10px",
                background: "linear-gradient(135deg, rgba(56,189,248,0.15), rgba(56,189,248,0.03))",
                border: "1px solid rgba(56,189,248,0.25)",
                display: "flex",
              }}
            >
              <HugeiconsIcon icon={CodeCircleIcon} size={18} style={{ color: "#38BDF8" }} />
            </Box>
            Tracker Initialization
          </Typography>
          <Typography level="body-sm" sx={{ color: "rgba(242, 245, 250, 0.6)", mt: 1 }}>
            Embed the invisible tracking script to collect reliable AI-referral conversion data.
          </Typography>
        </Box>

        <Tabs aria-label="Framework setup tabs" defaultValue={0} sx={{ bgcolor: "transparent" }}>
          <TabList sx={{ bgcolor: "rgba(255,255,255,0.02)", p: 0.5, borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", overflowX: "auto" }}>
            <Tab disableIndicator sx={{ borderRadius: "8px", "&[aria-selected=\"true\"]": { bgcolor: "rgba(255,255,255,0.05)", color: "#fff" } }}>Next.js</Tab>
            <Tab disableIndicator sx={{ borderRadius: "8px", "&[aria-selected=\"true\"]": { bgcolor: "rgba(255,255,255,0.05)", color: "#fff" } }}>Other SSR Frameworks</Tab>
            <Tab disableIndicator sx={{ borderRadius: "8px", "&[aria-selected=\"true\"]": { bgcolor: "rgba(255,255,255,0.05)", color: "#fff" } }}>Static / Traditional HTML</Tab>
          </TabList>

          <TabPanel value={0} sx={{ p: 0, pt: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Typography level="title-md" sx={{ color: "#fff", mb: 1 }}>Global Tracking for Next.js App Router</Typography>
                <Typography level="body-sm" sx={{ color: "rgba(242, 245, 250, 0.6)" }}>
                  Copy the snippet below and import the <code style={{ color: "#38BDF8" }}>Script</code> component from <code style={{ color: "#38BDF8" }}>next/script</code>.
                </Typography>
              </Box>

              <Box sx={{ position: "relative" }}>
                <Box sx={codeBoxStyles}>{nextJsCode}</Box>
                <Button
                  size="sm"
                  variant="outlined"
                  color="neutral"
                  onClick={() => handleCopy(nextJsCode, "next")}
                  startDecorator={<HugeiconsIcon icon={copiedNext ? CheckmarkCircle01Icon : Copy01Icon} size={16} />}
                  sx={{ position: "absolute", top: 12, right: 12, bgcolor: "rgba(255,255,255,0.05)", color: "#fff", borderColor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
                >
                  {copiedNext ? "Copied" : "Copy"}
                </Button>
              </Box>

              <Box sx={{ p: 2, borderRadius: "8px", bgcolor: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}>
                <Typography level="body-xs" sx={{ color: "rgba(242, 245, 250, 0.6)", mb: 1 }}>
                  Example: Place it inside the <code style={{ color: "#2ED47A" }}>&lt;head&gt;</code> element of your <code style={{ color: "#38BDF8" }}>app/layout.tsx</code>:
                </Typography>
<pre style={{ margin: 0, color: "#a2a7b4", fontSize: "12px", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
{`export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        ${nextJsCode}
      </head>
      <body>{children}</body>
    </html>
  );
}`}
</pre>
              </Box>
            </Stack>
          </TabPanel>

          <TabPanel value={1} sx={{ p: 0, pt: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Typography level="title-md" sx={{ color: "#fff", mb: 1 }}>Global Tracking for SSR Frameworks (Remix, Nuxt, SvelteKit)</Typography>
                <Typography level="body-sm" sx={{ color: "rgba(242, 245, 250, 0.6)" }}>
                  Use the standard HTML script code for other SSR SPA frameworks. These frameworks automatically re-run the layout on page navigations, so one global script handles everything.
                </Typography>
              </Box>

              <Box sx={{ position: "relative" }}>
                <Box sx={codeBoxStyles}>{otherSSRCode}</Box>
                <Button
                  size="sm"
                  variant="outlined"
                  color="neutral"
                  onClick={() => handleCopy(otherSSRCode, "ssr")}
                  startDecorator={<HugeiconsIcon icon={copiedOtherSSR ? CheckmarkCircle01Icon : Copy01Icon} size={16} />}
                  sx={{ position: "absolute", top: 12, right: 12, bgcolor: "rgba(255,255,255,0.05)", color: "#fff", borderColor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
                >
                  {copiedOtherSSR ? "Copied" : "Copy"}
                </Button>
              </Box>

              <Box sx={{ p: 2, borderRadius: "8px", bgcolor: "rgba(243, 201, 91, 0.05)", border: "1px solid rgba(243, 201, 91, 0.15)" }}>
                <Typography level="body-sm" sx={{ color: "#F3C95B", display: "flex", gap: 1, alignItems: "center" }}>
                  <HugeiconsIcon icon={InformationCircleIcon} size={18} />
                  <b>Framework Integration Guide</b>
                </Typography>
                <Typography level="body-xs" sx={{ color: "rgba(242, 245, 250, 0.6)", mt: 1, pl: 4 }}>
                  <ul style={{ margin: 0, paddingLeft: "16px", marginTop: "4px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <li><b>Remix:</b> Drop the snippet into your <code style={{ color: "#38BDF8" }}>app/root.tsx</code> inside the <code style={{ color: "#2ED47A" }}>&lt;head&gt;</code> element.</li>
                    <li><b>Nuxt:</b> Add it inside your <code style={{ color: "#38BDF8" }}>app.vue</code> using <code style={{ color: "#2ED47A" }}>useHead()</code>, or directly in the global <code style={{ color: "#2ED47A" }}>nuxt.config.ts</code> head scripts.</li>
                    <li><b>SvelteKit:</b> Add the script to your root <code style={{ color: "#38BDF8" }}>src/app.html</code> file inside <code style={{ color: "#2ED47A" }}>&lt;head&gt;</code>.</li>
                  </ul>
                </Typography>
              </Box>
            </Stack>
          </TabPanel>

          <TabPanel value={2} sx={{ p: 0, pt: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Typography level="title-md" sx={{ color: "#fff", mb: 1 }}>Targeted Tracking for HTML Pages</Typography>
                <Typography level="body-sm" sx={{ color: "rgba(242, 245, 250, 0.6)", mb: 2 }}>
                  For standard HTML or older frameworks lacking a global layout, place this script inside the <code style={{ color: "#38BDF8" }}>&lt;head&gt;</code> of <b>every single page</b> you want to track.
                </Typography>

                <Box sx={{ p: 2, borderRadius: "8px", bgcolor: "rgba(243, 201, 91, 0.05)", border: "1px solid rgba(243, 201, 91, 0.15)", mb: 2 }}>
                  <Typography level="body-sm" sx={{ color: "#F3C95B", display: "flex", gap: 1, alignItems: "center" }}>
                    <HugeiconsIcon icon={InformationCircleIcon} size={18} />
                    <b>What is the "desc" parameter?</b>
                  </Typography>
                  <Typography level="body-xs" sx={{ color: "rgba(242, 245, 250, 0.6)", mt: 1, pl: 4 }}>
                    Notice the <code style={{ color: "#F3C95B" }}>desc=Homepage+landing+page</code> piece in the code below. 
                    In static sites, you must manually change this parameter on each page to a readable description (e.g., <code style={{ color: "#38BDF8" }}>desc=Pricing+Plan+B</code>). 
                    This dictates how the route appears inside your Conversion Dashboard!
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ position: "relative" }}>
                <Box sx={codeBoxStyles}>{htmlCode}</Box>
                <Button
                  size="sm"
                  variant="outlined"
                  color="neutral"
                  onClick={() => handleCopy(htmlCode, "old")}
                  startDecorator={<HugeiconsIcon icon={copiedOld ? CheckmarkCircle01Icon : Copy01Icon} size={16} />}
                  sx={{ position: "absolute", top: 12, right: 12, bgcolor: "rgba(255,255,255,0.05)", color: "#fff", borderColor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
                >
                  {copiedOld ? "Copied" : "Copy"}
                </Button>
              </Box>
            </Stack>
          </TabPanel>
        </Tabs>

        {/* New CTA Tracking Section */}
        <Box sx={{ pt: 2, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Stack spacing={3}>
            <Box>
              <Typography level="h4" sx={{ color: "#F2F5FA", fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, rgba(46, 212, 122, 0.15), rgba(46, 212, 122, 0.03))",
                    border: "1px solid rgba(46, 212, 122, 0.25)",
                    display: "flex",
                  }}
                >
                  <HugeiconsIcon icon={TargetIcon} size={18} style={{ color: "#2ED47A" }} />
                </Box>
                Conversion (CTA) Tracking
              </Typography>
              <Typography level="body-sm" sx={{ color: "rgba(242, 245, 250, 0.6)" }}>
                Track high-intent button clicks (like "Sign Up" or "Book Demo") by adding a simple attribute to your elements.
              </Typography>
            </Box>

            <Box sx={{ p: 2.5, borderRadius: "16px", bgcolor: "rgba(46, 212, 122, 0.04)", border: "1px solid rgba(46, 212, 122, 0.12)" }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ px: 1.25, py: 0.5, borderRadius: '6px', bgcolor: 'rgba(46, 212, 122, 0.2)', color: '#2ED47A', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em' }}>PRO TIP</Box>
                  <Typography level="body-sm" sx={{ color: '#fff', fontWeight: 600 }}>Use descriptive labels</Typography>
                </Box>
                <Typography level="body-xs" sx={{ color: "rgba(242, 245, 250, 0.7)", lineHeight: 1.6 }}>
                  Simply add the <code style={{ color: "#2ED47A", fontWeight: 700 }}>data-godseye-cta</code> attribute to any clickable element. The value you provide will appear as a branch in your Conversion Dashboard tree.
                </Typography>
                
                <Box sx={{ ...codeBoxStyles, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {`<button data-godseye-cta="Primary Signup">
  Sign Up Now
</button>`}
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
}
