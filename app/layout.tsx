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


        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-PHSPK2WJGS"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-PHSPK2WJGS');
          `}
        </Script>

        {/* Main tracker — runs after interactive as before
        <Script id="godseye-tracker" strategy="afterInteractive">
          {`
            (function () {
              console.log("%c[GodsEye] Script Initialized", "color: #3498db; font-weight: bold;");
          
              var cfg       = window.GodsEyeConfig || {};
              var userId    = cfg.user_id    || "f395ddcc-d180-4e22-8119-5fa3bb70168a";
              var productId = cfg.product_id || "01c3673f-89b2-43f4-a794-226b306f9688";
              var workerUrl = cfg.worker_url || "https://godseye-ingest.buildai2024.workers.dev";
              var apiKey    = cfg.api_key    || "ge_live_test_123";
          
              var referrer        = document.referrer || "";
              var currentUrl      = new URL(window.location.href);
              var utmSource       = (currentUrl.searchParams.get("utm_source") || "").toLowerCase();
          
              // Read from early capture — Chrome has already wiped hash by now
              var hasTextFragment = window.__godsEyeTextFragment === true;
          
              console.log("[GodsEye] Referrer     : " + (referrer        || "(none)"));
              console.log("[GodsEye] utm_source   : " + (utmSource       || "(none)"));
              console.log("[GodsEye] Text Fragment: " + hasTextFragment);
          
              function classify(referrer, utmSource, hasTextFragment) {
          
                // 1. UTM-based
                if (utmSource) {
                  if (utmSource.indexOf("chatgpt")    !== -1) return make("chatgpt",        "utm");
                  if (utmSource.indexOf("perplexity") !== -1) return make("perplexity",     "utm");
                  if (utmSource.indexOf("claude")     !== -1) return make("claude",         "utm");
                  if (utmSource.indexOf("bing")       !== -1) return make("bing_copilot",   "utm");
                  if (utmSource.indexOf("google_ai")  !== -1) return make("google_ai_mode", "utm");
                }
          
                // 2. Non-Google AI referrers
                if (/perplexity\\.ai/i.test(referrer))           return make("perplexity",   "referrer");
                if (/chatgpt\\.com/i.test(referrer))             return make("chatgpt",      "referrer");
                if (/claude\\.ai/i.test(referrer))               return make("claude",       "referrer");
                if (/copilot\\.microsoft\\.com/i.test(referrer)) return make("bing_copilot", "referrer");
          
                // 3. Google — text fragment is the AI Mode signal
                if (/(?:^|\\.)google\\.[a-z]{2,}/i.test(referrer)) {
                  if (hasTextFragment) {
                    return make("google_ai_mode", "text_fragment");
                  }
                  return { isAI: false, source: "google_organic", eventType: "organic_visit", detectedVia: "referrer" };
                }
          
                if (!referrer) {
                  return { isAI: false, source: "direct", eventType: "direct_visit", detectedVia: "none" };
                }
          
                return { isAI: false, source: "other_referral", eventType: "referral_visit", detectedVia: "referrer" };
              }
          
              function make(source, via) {
                return { isAI: true, source: source, eventType: "ai_referral", detectedVia: via };
              }
          
              var result = classify(referrer, utmSource, hasTextFragment);
              console.log("[GodsEye] Classification:", JSON.stringify(result));
          
              if (!result.isAI) {
                console.log("[GodsEye] Non-AI traffic (" + result.source + "). Skipping.");
                return;
              }
          
              console.log("%c[GodsEye] 🧍 AI Traffic! Source: " + result.source + " via " + result.detectedVia, "color: #2ecc71; font-weight: bold;");
          
              var payload = {
                event_type:   result.eventType,
                source:       result.source,
                detected_via: result.detectedVia,
                user_agent:   navigator.userAgent,
                target_url:   currentUrl.origin + currentUrl.pathname + currentUrl.search,
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
                if (res.ok) console.log("%c[GodsEye] ✅ Logged", "color: #2ecc71;");
                else        console.error("[GodsEye] 🔴 Rejected:", res.status);
              })
              .catch(function(err) {
                console.error("[GodsEye] 🔴 Fetch Error:", err);
              });
          
            })();
          `}
        </Script> */}
        <Script src="https://snowy-thunder-12e3.buildai2024.workers.dev/tracker.js?uid=f395ddcc-d180-4e22-8119-5fa3bb70168a&pid=01c3673f-89b2-43f4-a794-226b306f9688" strategy="afterInteractive" />
        {/* <Script id="godseye-tracker" strategy="afterInteractive">
          {`
            (function () {
              console.log("%c[GodsEye] Script Initialized", "color: #3498db; font-weight: bold;");
          
              var cfg       = window.GodsEyeConfig || {};
              var userId    = cfg.user_id    || "f395ddcc-d180-4e22-8119-5fa3bb70168a";
              var productId = cfg.product_id || "01c3673f-89b2-43f4-a794-226b306f9688";
              var workerUrl = cfg.worker_url || "https://godseye-ingest.buildai2024.workers.dev";
              var apiKey    = cfg.api_key    || "ge_live_test_123";
          
              var referrer   = document.referrer || "";
              var currentUrl = new URL(window.location.href);
              var utmSource  = (currentUrl.searchParams.get("utm_source") || "").toLowerCase();
          
              console.log("[GodsEye] Referrer  : " + (referrer  || "(none)"));
              console.log("[GodsEye] utm_source: " + (utmSource || "(none)"));
          
              function classify(referrer, utmSource) {
          
                // 1. UTM-based
                if (utmSource) {
                  if (utmSource.indexOf("chatgpt")    !== -1) return make("chatgpt",        "utm");
                  if (utmSource.indexOf("perplexity") !== -1) return make("perplexity",     "utm");
                  if (utmSource.indexOf("claude")     !== -1) return make("claude",         "utm");
                  if (utmSource.indexOf("bing")       !== -1) return make("bing_copilot",   "utm");
                  if (utmSource.indexOf("google_ai")  !== -1) return make("google_ai_mode", "utm");
                }
          
                // 2. Non-Google AI referrers
                if (/perplexity\\.ai/i.test(referrer))           return make("perplexity",   "referrer");
                if (/chatgpt\\.com/i.test(referrer))             return make("chatgpt",      "referrer");
                if (/claude\\.ai/i.test(referrer))               return make("claude",       "referrer");
                if (/copilot\\.microsoft\\.com/i.test(referrer)) return make("bing_copilot", "referrer");
          
                // 3. Google — save all of it, organic + AI Mode both included
                //    Cannot distinguish client-side, both tracked as google_unclassified
                if (/(?:^|\\.)google\\.[a-z]{2,}/i.test(referrer)) {
                  return make("google_unclassified", "referrer");
                }
          
                if (!referrer) {
                  return { isAI: false, source: "direct", eventType: "direct_visit", detectedVia: "none" };
                }
          
                return { isAI: false, source: "other_referral", eventType: "referral_visit", detectedVia: "referrer" };
              }
          
              function make(source, via) {
                return { isAI: true, source: source, eventType: "ai_referral", detectedVia: via };
              }
          
              var result = classify(referrer, utmSource);
              console.log("[GodsEye] Classification:", JSON.stringify(result));
          
              if (!result.isAI) {
                console.log("[GodsEye] Non-AI traffic (" + result.source + "). Skipping.");
                return;
              }
          
              console.log("%c[GodsEye] 🧍 Traffic detected! Source: " + result.source + " via " + result.detectedVia, "color: #2ecc71; font-weight: bold;");
          
              var payload = {
                event_type:   result.eventType,
                source:       result.source,
                detected_via: result.detectedVia,
                user_agent:   navigator.userAgent,
                target_url:   currentUrl.origin + currentUrl.pathname + currentUrl.search,
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
                if (res.ok) console.log("%c[GodsEye] ✅ Logged", "color: #2ecc71;");
                else        console.error("[GodsEye] 🔴 Rejected:", res.status);
              })
              .catch(function(err) {
                console.error("[GodsEye] 🔴 Fetch Error:", err);
              });
          
            })();
          `}
        </Script> */}
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
              console.log("%c[GodsEye] Script Initialized", "color: #3498db; font-weight: bold;");
            
              var cfg       = window.GodsEyeConfig || {};
              var userId    = cfg.user_id    || null;
              var productId = cfg.product_id || null;
              var workerUrl = cfg.worker_url || "https://godseye-ingest.buildai2024.workers.dev";
              var apiKey    = cfg.api_key    || "ge_live_test_123";
            
              var referrer   = document.referrer || "";
              var currentUrl = new URL(window.location.href);
              var utmSource  = (currentUrl.searchParams.get("utm_source") || "").toLowerCase();
            
              // ── Text Fragment detection ──────────────────────────────────────────
              // Google AI Mode appends #:~:text= to cited URLs — organic search never does
              // We only detect PRESENCE, we never read or store the actual text
              var hash           = window.location.hash || "";
              var hasTextFragment = hash.indexOf(":~:text=") !== -1;
            
              console.log("[GodsEye] Referrer     : " + (referrer        || "(none)"));
              console.log("[GodsEye] utm_source   : " + (utmSource       || "(none)"));
              console.log("[GodsEye] Text Fragment: " + hasTextFragment);
            
              // ── Classification ───────────────────────────────────────────────────
              function classify(referrer, utmSource, hasTextFragment) {
            
                // 1. UTM-based (mobile apps, ChatGPT always tags links)
                if (utmSource) {
                  if (utmSource.indexOf("chatgpt")    !== -1) return make("chatgpt",        "utm");
                  if (utmSource.indexOf("perplexity") !== -1) return make("perplexity",     "utm");
                  if (utmSource.indexOf("claude")     !== -1) return make("claude",         "utm");
                  if (utmSource.indexOf("bing")       !== -1) return make("bing_copilot",   "utm");
                  if (utmSource.indexOf("google_ai")  !== -1) return make("google_ai_mode", "utm");
                }
            
                // 2. Non-Google AI referrers
                if (/perplexity\\.ai/i.test(referrer))           return make("perplexity",   "referrer");
                if (/chatgpt\\.com/i.test(referrer))             return make("chatgpt",      "referrer");
                if (/claude\\.ai/i.test(referrer))               return make("claude",       "referrer");
                if (/copilot\\.microsoft\\.com/i.test(referrer)) return make("bing_copilot", "referrer");
            
                // 3. Google — split by text fragment presence
                if (/(?:^|\\.)google\\.[a-z]{2,}/i.test(referrer)) {
                  if (hasTextFragment) {
                    // AI Mode cites content by linking directly to the passage
                    return make("google_ai_mode", "text_fragment");
                  }
                  // Plain Google referrer, no citation fragment = organic
                  return { isAI: false, source: "google_organic", eventType: "organic_visit", detectedVia: "referrer" };
                }
            
                if (!referrer) {
                  return { isAI: false, source: "direct", eventType: "direct_visit", detectedVia: "none" };
                }
            
                return { isAI: false, source: "other_referral", eventType: "referral_visit", detectedVia: "referrer" };
              }
            
              function make(source, via) {
                return { isAI: true, source: source, eventType: "ai_referral", detectedVia: via };
              }
            
              var result = classify(referrer, utmSource, hasTextFragment);
              console.log("[GodsEye] Classification:", JSON.stringify(result));
            
              if (!result.isAI) {
                console.log("[GodsEye] Non-AI traffic (" + result.source + "). Skipping.");
                return;
              }
            
              console.log("%c[GodsEye] 🧍 AI Traffic! Source: " + result.source + " via " + result.detectedVia, "color: #2ecc71; font-weight: bold;");
            
              var payload = {
                event_type:      result.eventType,
                source:          result.source,
                detected_via:    result.detectedVia,
                user_agent:      navigator.userAgent,
                target_url:      window.location.href,  // this WILL contain the #:~:text= fragment
                referrer:        referrer || "direct",
                user_id:         userId,
                product_id:      productId
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
                if (res.ok) console.log("%c[GodsEye] ✅ Logged", "color: #2ecc71;");
                else        console.error("[GodsEye] 🔴 Rejected:", res.status);
              })
              .catch(function(err) {
                console.error("[GodsEye] 🔴 Fetch Error:", err);
              });
            
            })();
          `}
        </Script> */}
      </body>
    </html>
  );
}
