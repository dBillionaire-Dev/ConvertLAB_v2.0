"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { isLandingSite } from "@/lib/site"
import { isDiagnosticsShortcut } from "@/lib/update/shortcut"

// More than one copy can be mounted (the layout and the analytics component both include it, so it survives
// layout changes); only one listens at a time, so the page is never opened twice.
let listening = false

/** Win+Shift+D (or Ctrl+Alt+Shift+D) opens the hidden diagnostics page, in the browser, the installed app and the Windows app. */
export function DiagnosticsShortcut() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (listening || isLandingSite() || window.self !== window.top) return
    listening = true
    const onKey = (event: KeyboardEvent) => {
      if (!isDiagnosticsShortcut(event)) return
      event.preventDefault()
      if (pathname !== "/diagnostics") router.push("/diagnostics")
    }
    window.addEventListener("keydown", onKey)
    return () => {
      listening = false
      window.removeEventListener("keydown", onKey)
    }
  }, [router, pathname])

  return null
}
