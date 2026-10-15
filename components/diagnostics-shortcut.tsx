"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { isLandingSite } from "@/lib/site"
import { isDiagnosticsShortcut } from "@/lib/update/shortcut"

/** Win+Shift+D (or Ctrl+Alt+Shift+D) opens the hidden diagnostics page, in the browser, the installed app and the Windows app. */
export function DiagnosticsShortcut() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLandingSite() || window.self !== window.top) return
    const onKey = (event: KeyboardEvent) => {
      if (!isDiagnosticsShortcut(event)) return
      event.preventDefault()
      if (pathname !== "/diagnostics") router.push("/diagnostics")
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [router, pathname])

  return null
}
