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

    const handleOnline = () => {
      run()
      void sendPresenceHeartbeat()
    }

    window.addEventListener("online", handleOnline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.clearInterval(heartbeat)
    }
  }, [])

  return null
}
