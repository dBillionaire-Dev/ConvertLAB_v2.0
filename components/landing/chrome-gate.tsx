"use client"

import { useSelectedLayoutSegment } from "next/navigation"

/**
 * Hides the app header and footer on the landing page, which has its own navigation.
 *
 * It decides by the ROUTE segment ("welcome"), not by the URL path. On the landing domain the URL is "/" (the router
 * rewrites it to /welcome), so the URL path would differ between the server and the browser and break hydration;
 * the route segment is the same on both sides.
 */
export function ChromeGate({ children }: { children: React.ReactNode }) {
  const segment = useSelectedLayoutSegment()
  if (segment === "welcome") return null
  return <>{children}</>
}
