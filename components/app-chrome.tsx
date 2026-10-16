
"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ChromeGate } from "@/components/landing/chrome-gate"

export function AppHeader() {
  const pathname = usePathname()

  if (pathname === "/diagnostics") return null

  return (
    <ChromeGate>
      <Header />
    </ChromeGate>
  )
}

export function AppFooter() {
  const pathname = usePathname()

  if (pathname === "/diagnostics") return null

  return (
    <ChromeGate>
      <Footer />
    </ChromeGate>
  )
}
