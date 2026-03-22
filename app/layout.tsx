import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from 'next/script';
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GodsEye - AEO SaaS Platform",
  description: "AI Engine Optimization platform to help your products get discovered by AI search engines",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable, "dark")} style={{ colorScheme: 'dark' }}>
      <head>
        <meta name="emotion-insertion-point" content="" />
      </head>
      <body className="font-sans antialiased overflow-x-hidden">
        <AuthProvider>
          <ThemeProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
            <div className="background-glow" suppressHydrationWarning aria-hidden="true"></div>
            <div className="bg-center-sheen" suppressHydrationWarning aria-hidden="true"></div>
          </ThemeProvider>
        </AuthProvider>
        {/* <Script id="godseye-tracker" strategy="afterInteractive">
          {`
            (function () {
                console.log("%c[GodsEye Frontend] Script Initialized", "color: #3498db; font-weight: bold;");

                // Force a fake referrer for local testing if the actual referrer is empty
                const referrer = document.referrer || "https://www.perplexity.ai/";
                console.log(\`%c[GodsEye Frontend] Detected Referrer: \${referrer}\`, "color: #f39c12;");

                const isAIReferral = /perplexity\\.ai|chatgpt\\.com|claude\\.ai/i.test(referrer);

                if (isAIReferral) {
                    console.log("%c[GodsEye Frontend] 🧍 AI-Driven Human Traffic Detected!", "color: #2ecc71; font-weight: bold;");

                    const payload = {
                        event_type: "human_visit",
                        user_agent: navigator.userAgent,
                        target_url: window.location.href,
                        referrer: referrer
                    };

                    // Cloudflare Worker URL
                    const workerUrl = "https://godseye-ingest.buildai2024.workers.dev";

                    fetch(workerUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer ge_live_test_123"
                        },
                        body: JSON.stringify(payload),
                        keepalive: true
                    })
                    .then(res => {
                        if (res.ok) console.log("%c[GodsEye Frontend] ✅ Successfully logged human to Edge API", "color: #2ecc71;");
                        else console.error("[GodsEye Frontend] 🔴 Edge API Rejected Ping:", res.status);
                    })
                    .catch(err => console.error("[GodsEye Frontend] 🔴 Fetch Error:", err));
                } else {
                    console.log("[GodsEye Frontend] Standard traffic (Not from AI). Ignoring.");
                }
            })();
          `}
        </Script> */}
        {/* <Script id="godseye-tracker" strategy="afterInteractive">
          {`
            (function () {
                console.log("%c[GodsEye Frontend] Script Initialized", "color: #3498db; font-weight: bold;");

                // Force a fake referrer for local testing if the actual referrer is empty
                const referrer = document.referrer || "https://www.perplexity.ai/";
                console.log(\`%c[GodsEye Frontend] Detected Referrer: \${referrer}\`, "color: #f39c12;");

                // Added google\\.com to catch Google AI Overview referrals
                const isAIReferral = /perplexity\\.ai|chatgpt\\.com|claude\\.ai|google\\.com/i.test(referrer);

                if (isAIReferral) {
                    console.log("%c[GodsEye Frontend] 🧍 AI-Driven Human Traffic Detected!", "color: #2ecc71; font-weight: bold;");

                    const payload = {
                        event_type: "human_visit",
                        user_agent: navigator.userAgent,
                        target_url: window.location.href,
                        referrer: referrer
                    };

                    // Cloudflare Worker URL
                    const workerUrl = "https://godseye-ingest.buildai2024.workers.dev";

                    fetch(workerUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer ge_live_test_123"
                        },
                        body: JSON.stringify(payload),
                        keepalive: true
                    })
                    .then(res => {
                        if (res.ok) console.log("%c[GodsEye Frontend] ✅ Successfully logged human to Edge API", "color: #2ecc71;");
                        else console.error("[GodsEye Frontend] 🔴 Edge API Rejected Ping:", res.status);
                    })
                    .catch(err => console.error("[GodsEye Frontend] 🔴 Fetch Error:", err));
                } else {
                    console.log("[GodsEye Frontend] Standard traffic (Not from AI). Ignoring.");
                }
            })();
          `}
        </Script> */}
        {/* <Script id="godseye-tracker" strategy="afterInteractive">
          {`
              (function () {
                console.log("%c[GodsEye] Script Initialized", "color: #3498db; font-weight: bold;");
            
                // ─── CONFIG (set these per-installation) ──────────────────────────────
                var GODSEYE_CONFIG = window.GodsEyeConfig || {};
                var userId    = GODSEYE_CONFIG.user_id    || "f395ddcc-d180-4e22-8119-5fa3bb70168a";
                var productId = GODSEYE_CONFIG.product_id || "01c3673f-89b2-43f4-a794-226b306f9688";
                var workerUrl = GODSEYE_CONFIG.worker_url || "https://godseye-ingest.buildai2024.workers.dev";
                var apiKey    = GODSEYE_CONFIG.api_key    || "ge_live_test_123";
                // ──────────────────────────────────────────────────────────────────────
            
                // NEVER fall back to a fake referrer — use empty string for direct visits
                var referrer = document.referrer || "";
                console.log("[GodsEye] Referrer: " + (referrer || "(direct / none)"));
            
                // ─── Referrer Classification ──────────────────────────────────────────
                function classifyReferrer(ref) {
                  if (!ref) {
                    return { isAI: false, source: "direct", eventType: "direct_visit" };
                  }
            
                  if (/perplexity\\.ai/i.test(ref)) {
                    return { isAI: true, source: "perplexity", eventType: "ai_referral" };
                  }
                  if (/chatgpt\\.com/i.test(ref)) {
                    return { isAI: true, source: "chatgpt", eventType: "ai_referral" };
                  }
                  if (/claude\\.ai/i.test(ref)) {
                    return { isAI: true, source: "claude", eventType: "ai_referral" };
                  }
            
                  // Google — must distinguish AI Mode (udm=50) from organic search
                  if (/(?:^|\\.)google\\.[a-z.]+/i.test(ref)) {
                    try {
                      var refUrl = new URL(ref);
                      var udm = refUrl.searchParams.get("udm");
            
                      if (udm === "50") {
                        // User clicked a result inside Google AI Mode
                        return { isAI: true, source: "google_ai_mode", eventType: "ai_referral" };
                      }
                    } catch (e) {
                      // Malformed referrer URL — treat as unknown Google
                    }
                    // Regular Google organic search (including AI Overviews in standard search)
                    return { isAI: false, source: "google_organic", eventType: "organic_visit" };
                  }
            
                  // Any other referrer
                  return { isAI: false, source: "other_referral", eventType: "referral_visit" };
                }
                // ──────────────────────────────────────────────────────────────────────
            
                var classification = classifyReferrer(referrer);
                console.log("[GodsEye] Classification:", JSON.stringify(classification));
            
                // Only fire for AI-driven traffic — adjust this gate as needed
                if (!classification.isAI) {
                  console.log("[GodsEye] Non-AI traffic (" + classification.source + "). Skipping ingest.");
                  return;
                }
            
                console.log("%c[GodsEye] 🧍 AI Traffic Detected! Source: " + classification.source, "color: #2ecc71; font-weight: bold;");
            
                var payload = {
                  event_type:  classification.eventType,
                  source:      classification.source,
                  user_agent:  navigator.userAgent,
                  target_url:  window.location.href,
                  referrer:    referrer,
                  user_id:     userId,
                  product_id:  productId
                };
            
                fetch(workerUrl, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + apiKey
                  },
                  body: JSON.stringify(payload),
                  keepalive: true
                })
                .then(function(res) {
                  if (res.ok) console.log("%c[GodsEye] ✅ Logged to Edge API", "color: #2ecc71;");
                  else        console.error("[GodsEye] 🔴 Edge API rejected:", res.status);
                })
                .catch(function(err) {
                  console.error("[GodsEye] 🔴 Fetch Error:", err);
                });
            
              })();
            `}
        </Script> */}
        <Script id="godseye-tracker" strategy="afterInteractive">
          {`
            (function () {
              console.log("%c[GodsEye] Script Initialized", "color: #3498db; font-weight: bold;");
          
              // ─── CONFIG ───────────────────────────────────────────────────────────
              var cfg        = window.GodsEyeConfig || {};
              var userId     = cfg.user_id    || "f395ddcc-d180-4e22-8119-5fa3bb70168a";
              var productId  = cfg.product_id || "01c3673f-89b2-43f4-a794-226b306f9688";
              var workerUrl  = cfg.worker_url || "https://godseye-ingest.buildai2024.workers.dev";
              var apiKey     = cfg.api_key    || "ge_live_test_123";
              // ──────────────────────────────────────────────────────────────────────
          
              var referrer   = document.referrer || "";
              var currentUrl = new URL(window.location.href);
              var utmSource  = (currentUrl.searchParams.get("utm_source") || "").toLowerCase();
          
              console.log("[GodsEye] Referrer  : " + (referrer || "(none)"));
              console.log("[GodsEye] utm_source: " + (utmSource || "(none)"));
          
              // ─── Traffic Classification ───────────────────────────────────────────
              // Priority: UTM params (catches mobile in-app browsers) → referrer header
              function classify(referrer, utmSource) {
          
                // ── 1. UTM-based detection (mobile apps strip referrer, but keep UTM) ──
                if (utmSource) {
                  if (utmSource.indexOf("chatgpt")    !== -1) return make("chatgpt",    "utm");
                  if (utmSource.indexOf("perplexity") !== -1) return make("perplexity", "utm");
                  if (utmSource.indexOf("claude")     !== -1) return make("claude",     "utm");
                  if (utmSource.indexOf("google")     !== -1) return make("google",     "utm");
                  if (utmSource.indexOf("bing")       !== -1) return make("bing_copilot","utm");
                }
          
                // ── 2. Referrer-based detection ──────────────────────────────────────
                if (!referrer) {
                  return { isAI: false, source: "direct", eventType: "direct_visit", detectedVia: "none" };
                }
          
                if (/perplexity\\.ai/i.test(referrer))  return make("perplexity",  "referrer");
                if (/chatgpt\\.com/i.test(referrer))     return make("chatgpt",     "referrer");
                if (/claude\\.ai/i.test(referrer))       return make("claude",      "referrer");
                if (/copilot\\.microsoft\\.com/i.test(referrer)) return make("bing_copilot", "referrer");
          
                // Google: referrer is ALWAYS stripped to https://www.google.com/ by
                // Google's Referrer-Policy — udm=50 is never forwarded.
                // We track all Google referrals; the source field will be "google".
                // Use utm_source=google_ai_mode on your own links if you want to
                // distinguish AI Mode manually (e.g. in a UTM-tagged bio link).
                if (/(?:^|\\.)google\\.[a-z]{2,}/i.test(referrer)) return make("google", "referrer");
          
                // Everything else — not AI, log as generic referral
                return { isAI: false, source: "other_referral", eventType: "referral_visit", detectedVia: "referrer" };
              }
          
              function make(source, via) {
                return { isAI: true, source: source, eventType: "ai_referral", detectedVia: via };
              }
              // ──────────────────────────────────────────────────────────────────────
          
              var result = classify(referrer, utmSource);
              console.log("[GodsEye] Classification:", JSON.stringify(result));
          
              if (!result.isAI) {
                console.log("[GodsEye] Non-AI traffic (" + result.source + "). Skipping.");
                return;
              }
          
              console.log("%c[GodsEye] 🧍 AI Traffic Detected! Source: " + result.source + " via " + result.detectedVia, "color: #2ecc71; font-weight: bold;");
          
              var payload = {
                event_type:   result.eventType,
                source:       result.source,
                detected_via: result.detectedVia,   // "utm" or "referrer"
                user_agent:   navigator.userAgent,
                target_url:   window.location.href,
                referrer:     referrer || "direct",
                user_id:      userId,
                product_id:   productId
              };
          
              fetch(workerUrl, {
                method: "POST",
                headers: {
                  "Content-Type":  "application/json",
                  "Authorization": "Bearer " + apiKey
                },
                body: JSON.stringify(payload),
                keepalive: true
              })
              .then(function(res) {
                if (res.ok) console.log("%c[GodsEye] ✅ Logged to Edge API", "color: #2ecc71;");
                else        console.error("[GodsEye] 🔴 Edge API rejected:", res.status);
              })
              .catch(function(err) {
                console.error("[GodsEye] 🔴 Fetch Error:", err);
              });
          
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
