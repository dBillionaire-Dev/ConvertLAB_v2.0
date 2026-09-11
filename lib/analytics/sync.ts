"use client"

import { getPendingCalculationEvents, removeCalculationEvents } from "./outbox"

let syncInFlight: Promise<void> | null = null

export function syncAnalytics(): Promise<void> {
  if (syncInFlight) return syncInFlight

  syncInFlight = (async () => {
    if (typeof window === "undefined" || !navigator.onLine) return

    const events = await getPendingCalculationEvents()
    if (!events.length) return

    for (let i = 0; i < events.length; i += 100) {
      const batch = events.slice(i, i + 100)

      try {
        const normalizedBatch = batch.map((event) => ({
          ...event,
          source: event.source ?? "web",
          environment: event.environment ?? "production",
        }))

        const response = await fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events: normalizedBatch }),
          keepalive: true,
        })

        if (!response.ok) return

        const body = (await response.json()) as { accepted?: string[] }
        await removeCalculationEvents(body.accepted ?? [])
      } catch {
        return
      }
    }
  })().finally(() => {
    syncInFlight = null
  })

  return syncInFlight
}
