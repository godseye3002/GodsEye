import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="emotion-insertion-point" content="" />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          <ThemeProvider>
            {children}
            <div className="background-glow" suppressHydrationWarning aria-hidden="true"></div>
            <div className="bg-center-sheen" suppressHydrationWarning aria-hidden="true"></div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
