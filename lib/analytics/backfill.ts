"use client"

import { getAllHistory } from "@/lib/history/db"
import { getAnonymousId } from "./client-id"
import { queueCalculationEvents } from "./outbox"
import { syncAnalytics } from "./sync"
import { getPlatform } from "@/lib/platform"
import type { CalculationEvent } from "./types"

// v3: the original v2 backfill ran once, but the main calculator screen never reported
// to analytics, so everything calculated after that run (and before this fix) was
// missing from the dashboard. Running again is safe: event IDs are the history IDs and
// the server ignores IDs it already has, so nothing is double counted.
const BACKFILL_KEY = "convertlab:analytics-history-backfill:v3"
const BACKFILL_APP_VERSION = "2.0.0-history-backfill"
const APP_ENVIRONMENT = process.env.NEXT_PUBLIC_APP_ENV ?? "production"

function hasCompletedBackfill() {
  try {
    return window.localStorage.getItem(BACKFILL_KEY) === "1"
  } catch {
    return false
  }
}

function markBackfillComplete() {
  try {
    window.localStorage.setItem(BACKFILL_KEY, "1")
  } catch {
    // If storage is unavailable the backfill simply re-runs next launch, which is harmless.
  }
}

/**
 * Re-queues the user's whole local history once. Inputs/results are never included.
 */
export async function backfillExistingHistory(): Promise<number> {
  if (typeof window === "undefined" || !window.indexedDB) return 0
  if (hasCompletedBackfill()) return 0

  const history = await getAllHistory()
  if (!history.length) {
    markBackfillComplete()
    return 0
  }

  const anonymousId = getAnonymousId()
  const source = getPlatform()

  const events: CalculationEvent[] = history.map((item) => ({
    id: item.id,
    anonymousId,
    calculatorId: item.calculatorId,
    calculatorName: item.calculatorName,
    category: item.category,
    occurredAt: item.timestamp,
    appVersion: BACKFILL_APP_VERSION,
    wasOffline: false,
    source,
    environment: APP_ENVIRONMENT,
  }))

  // One transaction for the whole history, and only marked complete once it is safely queued.
  await queueCalculationEvents(events)
  markBackfillComplete()
  void syncAnalytics()
  return events.length
}
