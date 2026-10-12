"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { isLandingSite } from "@/lib/site"
import { syncAnalytics } from "@/lib/analytics/sync"
import { backfillExistingHistory } from "@/lib/analytics/backfill"
import { sendPresenceHeartbeat } from "@/lib/analytics/presence"

const PERIODIC_SYNC_MS = 5 * 60 * 1000

export function AnalyticsSync() {
  const pathname = usePathname()

  useEffect(() => {
    // Do not count landing-page visitors, or the demo frames embedded in it, as app users.
    if (pathname?.startsWith("/welcome") || isLandingSite() || window.self !== window.top) return

    const run = () => {
      void backfillExistingHistory()
        .catch(() => {})
        .finally(() => {
          void syncAnalytics()
        })
    }

    run()
    void sendPresenceHeartbeat()
    const heartbeat = window.setInterval(() => {
      void sendPresenceHeartbeat()
    }, 60_000)

    // Flush queued/offline analytics every few minutes while the app is open
    // (the sync itself schedules faster retries after a failure).
    const periodicSync = window.setInterval(() => {
      if (navigator.onLine !== false) void syncAnalytics()
    }, PERIODIC_SYNC_MS)

    // Connection came back: upload everything that was calculated offline.
    const handleOnline = () => {
      run()
      void sendPresenceHeartbeat()
    }

    // An installed app resumed from the background (or a restored tab): flush right away.
    const handleVisible = () => {
      if (document.visibilityState !== "visible" || navigator.onLine === false) return
      void syncAnalytics()
      void sendPresenceHeartbeat()
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("pageshow", handleVisible)
    document.addEventListener("visibilitychange", handleVisible)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("pageshow", handleVisible)
      document.removeEventListener("visibilitychange", handleVisible)
      window.clearInterval(heartbeat)
      window.clearInterval(periodicSync)
    }
  }, [pathname])

  return null
}
