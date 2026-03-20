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
        <Script id="godseye-tracker" strategy="afterInteractive">
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
        </Script>
      </body>
    </html>
  );
}
