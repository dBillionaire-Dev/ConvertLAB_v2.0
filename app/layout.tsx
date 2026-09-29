import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CommandPalette } from "@/components/command-palette"
import { InstallPrompt } from "@/components/install-prompt"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"
import { SkipToContent } from "@/components/skip-to-content"
import { ApplyPreferences } from "@/components/apply-preferences"
import { AnalyticsSync } from "@/components/analytics-sync"

const inter = Inter({ subsets: ["latin"] })
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://convertlab-nex.vercel.app").replace(/\/$/, "")
const siteName = "ConvertLAB"
const description =
  "Laboratory calculators, medical unit conversions, solution preparation tools, microbiology tools, and spectrophotometry calculators for students and laboratory professionals."

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ConvertLAB - Laboratory Calculators & Unit Conversions",
    template: "%s | ConvertLAB",
  },
  description,
  applicationName: siteName,
  keywords: [
    "laboratory calculator",
    "medical calculator",
    "lab calculator",
    "medical unit conversion",
    "laboratory unit conversion",
    "clinical calculator",
    "eGFR calculator",
    "LDL calculator",
    "molarity calculator",
    "dilution calculator",
    "spectrophotometry calculator",
    "microbiology calculator",
  ],
  authors: [{ name: "ConvertLAB" }],
  creator: "ConvertLAB",
  publisher: "ConvertLAB",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    title: "ConvertLAB - Laboratory Calculators & Unit Conversions",
    description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ConvertLAB - Laboratory calculators and unit conversions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ConvertLAB - Laboratory Calculators & Unit Conversions",
    description,
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ConvertLAB",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
}

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ConvertLAB" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SkipToContent />
          <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main id="main-content" tabIndex={-1} className="flex-1 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
              {children}
            </main>
            <Footer />
          </div>
          <CommandPalette />
          <InstallPrompt />
          <ServiceWorkerRegistration />
          <ApplyPreferences />
          <AnalyticsSync />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
