import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import Script from 'next/script';
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import SubscriptionAlertModal from "@/components/SubscriptionAlertModal";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const arrayFont = localFont({
  src: [
    { path: "./fonts/Array/Array-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Array/Array-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/Array/Array-BoldWide.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-array",
});

const khandFont = localFont({
  src: [
    { path: "./fonts/Khand/Khand-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Khand/Khand-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Khand/Khand-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Khand/Khand-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-khand",
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
    <html lang="en" className={cn(inter.variable, arrayFont.variable, khandFont.variable, "dark")} style={{ colorScheme: 'dark' }} suppressHydrationWarning>
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
        {/* <Script src="https://snowy-thunder-12e3.buildai2024.workers.dev/tracker.js?uid=3c451d93-1287-4b20-9d08-a0eaa8f953e9&pid=0630c72a-fcf3-4c76-b373-372a1fc67402" strategy="afterInteractive" /> */}
        <Script src="https://script-tracker-supabase.buildai2024.workers.dev/tracker.js?uid=3c451d93-1287-4b20-9d08-a0eaa8f953e9&pid=0630c72a-fcf3-4c76-b373-372a1fc67402&desc=Homepage+landing+page" strategy="afterInteractive" />
      </head>
      <body className="font-sans antialiased overflow-x-hidden">
        <AuthProvider>
          <ThemeProvider>
            <TooltipProvider>
              {children}
              <SubscriptionAlertModal />
            </TooltipProvider>
            <div className="background-glow" suppressHydrationWarning aria-hidden="true"></div>
            <div className="bg-center-sheen" suppressHydrationWarning aria-hidden="true"></div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
