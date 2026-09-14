"use client"

import { useEffect } from "react"
import { syncAnalytics } from "@/lib/analytics/sync"
import { backfillExistingHistory } from "@/lib/analytics/backfill"
import { sendPresenceHeartbeat } from "@/lib/analytics/presence"

export function AnalyticsSync() {
  useEffect(() => {
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

    // Flush queued/offline analytics at least once per hour while the app
    // remains open. If the device comes back online, sync immediately.
    const hourlySync = window.setInterval(() => {
      if (navigator.onLine) {
        void syncAnalytics()
        void sendPresenceHeartbeat()
      }
    }, 60 * 60 * 1000)

    const handleOnline = () => {
      run()
      void sendPresenceHeartbeat()
    }

    window.addEventListener("online", handleOnline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.clearInterval(heartbeat)
      window.clearInterval(hourlySync)
    }
  }, [])

  return null
}
