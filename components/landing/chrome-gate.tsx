"use client"

import { usePathname } from "next/navigation"

/** Hides the app header and footer on the landing page, which has its own navigation. */
export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname?.startsWith("/welcome")) return null
  return <>{children}</>
}
