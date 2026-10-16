"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { isLandingSite } from "@/lib/site"
import { isDiagnosticsShortcut, registerTap } from "@/lib/update/shortcut"

// More than one copy can be mounted (the layout and the analytics component both include it, so it survives
// layout changes); only one listens at a time, so the page is never opened twice.
let listening = false

/** Win+Shift+D (or Ctrl+Alt+Shift+D), or three quick taps on the header logo, opens the hidden diagnostics page, in the browser, the installed app and the Windows app. */
export function DiagnosticsShortcut() {
  const router = useRouter()
  const pathname = usePathname()
  const taps = useRef<number[]>([])

  useEffect(() => {
    if (listening || isLandingSite() || window.self !== window.top) return
    listening = true
    const onKey = (event: KeyboardEvent) => {
      if (!isDiagnosticsShortcut(event)) return
      event.preventDefault()
      if (pathname !== "/diagnostics") router.push("/diagnostics")
    }
    window.addEventListener("keydown", onKey)

    // Easter egg: tap the logo (the first link in the site header) three times quickly. The first two taps behave
    // normally; the third is caught before the link can act and opens the diagnostics page instead.
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a")
      const header = document.querySelector("header")
      if (!link || !header || !header.contains(link) || header.querySelector("a") !== link) return
      const result = registerTap(taps.current, Date.now())
      taps.current = result.taps
      if (!result.fired) return
      event.preventDefault()
      event.stopPropagation()
      try {
        navigator.vibrate?.(40)
      } catch {}
      if (pathname !== "/diagnostics") router.push("/diagnostics")
    }
    document.addEventListener("click", onClick, true)

    return () => {
      listening = false
      window.removeEventListener("keydown", onKey)
      document.removeEventListener("click", onClick, true)
    }
  }, [router, pathname])

  return null
}
