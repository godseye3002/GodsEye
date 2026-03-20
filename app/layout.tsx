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
                // Check if we already tracked this page load in this session
                const pageId = "tracked_" + window.location.pathname;
                if (sessionStorage.getItem(pageId)) {
                    return; // Silently exit, do not send ping
                }

                const payload = {
                    url: window.location.href,
                    referrer: document.referrer
                };

                fetch('https://zeolitic-zion-sociologically.ngrok-free.dev/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    keepalive: true
                }).then(() => {
                    // Lock the gate so it doesn't fire again
                    sessionStorage.setItem(pageId, 'true');
                    console.log("GodsEye Tracker: Ping sent successfully.");
                }).catch(err => console.error("GodsEye Tracker failure:", err));
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
