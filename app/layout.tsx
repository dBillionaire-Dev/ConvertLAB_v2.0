import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ConvertLab CCU",
  description:
    "A comprehensive medical and laboratory unit converter PWA for healthcare professionals. Calculate BMI, convert lab units, and more.",
  keywords: "medical converter, laboratory units, BMI calculator, PWA, healthcare tools",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ConvertLab CCU",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/favicon.png",
    apple: "/icon-192x192.png",
  },
  
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ConvertLab CCU" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
