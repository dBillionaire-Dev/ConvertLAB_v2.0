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
import { MaintenanceBanner } from "@/components/maintenance-banner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ConvertLAB",
  description:
    "A laboratory calculation, conversion, estimation, and reference toolkit. Calculators, unit conversions, and lab tools for laboratory and clinical work.",
  keywords: "lab calculator, medical converter, laboratory units, eGFR, LDL calculator, PWA, healthcare tools",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ConvertLAB",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/favicon.png",
    apple: "/icon-192x192.png",
  },
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
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ConvertLAB" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SkipToContent />
          <div className="min-h-screen flex flex-col bg-background">
            <MaintenanceBanner />
            <Header />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <CommandPalette />
          <InstallPrompt />
          <ServiceWorkerRegistration />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
