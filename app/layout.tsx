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
// import { MaintenanceBanner } from "@/components/maintenance-banner"
import { ApplyPreferences } from "@/components/apply-preferences"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ConvertLAB - From units to results",
  description:
    "A laboratory calculation, conversion, estimation, and reference toolkit. Calculators, unit conversions, and lab tools for laboratory and clinical work.",
  keywords: "lab calculator, medical converter, laboratory units, eGFR, LDL calculator, PWA, healthcare tools",
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
            {/*<MaintenanceBanner />*/}
            <Header />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <CommandPalette />
          <InstallPrompt />
          <ServiceWorkerRegistration />
          <ApplyPreferences />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
