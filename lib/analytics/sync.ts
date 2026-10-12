"use client"

import { getPendingCalculationEvents, removeCalculationEvents } from "./outbox"
import type { CalculationEvent } from "./types"

const BATCH_SIZE = 100
const RETRY_DELAYS_MS = [15_000, 60_000, 5 * 60_000]

let syncInFlight: Promise<void> | null = null
let rerunRequested = false
let retryTimer: ReturnType<typeof setTimeout> | null = null
let consecutiveFailures = 0

type BatchOutcome = "done" | "retry"

/**
 * Uploads every queued calculation event.
 *
 * Guarantees:
 *  - An event queued while an upload is already running is picked up by a
 *    follow-up pass. (Previously it was left behind until the next trigger,
 *    which could be an hour away.)
 *  - A permanently invalid event can no longer block the events behind it.
 *  - Network/server failures leave events queued and schedule an automatic
 *    retry with backoff, instead of waiting for the next app launch.
 */
export function syncAnalytics(): Promise<void> {
  if (syncInFlight) {
    rerunRequested = true
    return syncInFlight
  }

  syncInFlight = (async () => {
    do {
      rerunRequested = false
      await flushOutbox()
    } while (rerunRequested)
  })().finally(() => {
    syncInFlight = null
  })

  return syncInFlight
}

async function flushOutbox(): Promise<void> {
  if (typeof window === "undefined") return
  // `onLine === false` is reliable; `true` is not, so only the false case skips the attempt.
  if (navigator.onLine === false) return

  let events: CalculationEvent[]
  try {
    events = await getPendingCalculationEvents()
  } catch {
    return
  }

  if (!events.length) {
    resetBackoff()
    return
  }

  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const outcome = await sendBatch(events.slice(i, i + BATCH_SIZE))
    if (outcome === "retry") {
      scheduleRetry()
      return
    }
  }

  resetBackoff()
}

async function sendBatch(batch: CalculationEvent[]): Promise<BatchOutcome> {
  try {
    const response = await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        events: batch.map((event) => ({
          ...event,
          source: event.source ?? "web",
          environment: event.environment ?? "production",
        })),
      }),
      keepalive: batch.length <= 20,
    })

    if (response.ok) {
      const body = (await response.json().catch(() => ({}))) as { accepted?: string[]; rejected?: string[] }
      const finished = [...(body.accepted ?? []), ...(body.rejected ?? [])]
      await removeCalculationEvents(finished)
      // Anything the server neither stored nor rejected stays queued for the next pass.
      const finishedSet = new Set(finished)
      return batch.every((event) => finishedSet.has(event.id)) ? "done" : "retry"
    }

    // The server says the payload itself is bad. Isolate the culprit so the rest still go through.
    if (response.status === 400 || response.status === 413 || response.status === 422) {
      if (batch.length > 1) {
        for (const event of batch) {
          if ((await sendBatch([event])) === "retry") return "retry"
        }
        return "done"
      }
      await removeCalculationEvents([batch[0].id])
      return "done"
    }

    return "retry"
  } catch {
    return "retry"
  }
}

function scheduleRetry() {
  if (typeof window === "undefined" || retryTimer) return
  const delay = RETRY_DELAYS_MS[Math.min(consecutiveFailures, RETRY_DELAYS_MS.length - 1)]
  consecutiveFailures += 1
  retryTimer = setTimeout(() => {
    retryTimer = null
    void syncAnalytics()
  }, delay)
}

function resetBackoff() {
  consecutiveFailures = 0
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
}
