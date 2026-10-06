import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ChromeGate } from "@/components/landing/chrome-gate"
import { CommandPalette } from "@/components/command-palette"
import { InstallPrompt } from "@/components/install-prompt"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"
import { SkipToContent } from "@/components/skip-to-content"
import { ApplyPreferences } from "@/components/apply-preferences"
import { AnalyticsSync } from "@/components/analytics-sync"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://convertlab-nex.vercel.app"),
  title: {
    default: "ConvertLAB | Laboratory Calculators and Tools",
    template: "%s | ConvertLAB",
  },
  description:
    "ConvertLAB is a laboratory calculator, unit conversion, estimation, and reference toolkit for medical laboratory and clinical work.",
  keywords: [
    "laboratory calculator",
    "medical laboratory calculator",
    "lab calculator",
    "unit conversion",
    "medical converter",
    "clinical calculator",
    "drug dosing calculator",
    "hematology calculator",
    "clinical chemistry calculator",
    "microbiology calculator",
    "ConvertLAB",
  ],
  applicationName: "ConvertLAB",
  category: "health",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "ConvertLAB",
    title: "ConvertLAB | Laboratory Calculators and Tools",
    description:
      "Laboratory calculators, unit conversions, estimators, and reference tools for medical laboratory and clinical work.",
    url: "/",
    images: [{ url: "/og-image.png", alt: "ConvertLAB laboratory calculators and tools" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ConvertLAB | Laboratory Calculators and Tools",
    description:
      "Laboratory calculators, unit conversions, estimators, and reference tools for medical laboratory and clinical work.",
    images: ["/og-image.png"],
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "ConvertLAB" },
  formatDetection: { telephone: false },
  icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" },
}

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
            <ChromeGate><Header /></ChromeGate>
            <main id="main-content" tabIndex={-1} className="flex-1 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
              {children}
            </main>
            <ChromeGate><Footer /></ChromeGate>
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
