"use client"

import { getAllHistory, type HistoryItem } from "@/lib/history/db"
import { getAnonymousId } from "./client-id"
import { queueCalculationEvent } from "./outbox"
import { syncAnalytics } from "./sync"
import { isStandaloneDisplayMode } from "@/lib/platform"

const BACKFILL_KEY = "convertlab:analytics-history-backfill:v1"
const BACKFILL_APP_VERSION = "2.0.0-history-backfill"
const APP_ENVIRONMENT = process.env.NEXT_PUBLIC_APP_ENV ?? "production"

function hasCompletedBackfill() {
  return typeof window !== "undefined" && window.localStorage.getItem(BACKFILL_KEY) === "1"
}

function markBackfillComplete() {
  window.localStorage.setItem(BACKFILL_KEY, "1")
}

/**
 * Imports the user's existing local calculation history into the analytics
 * outbox exactly once. Historical event IDs reuse the existing history IDs,
 * making retries idempotent even if the migration is interrupted.
 *
 * We intentionally do not include inputs/results in analytics.
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
  let queued = 0

  for (const item of history) {
    await queueHistoricalEvent(item, anonymousId)
    queued += 1
  }

  markBackfillComplete()
  void syncAnalytics()
  return queued
}

async function queueHistoricalEvent(item: HistoryItem, anonymousId: string) {
  await queueCalculationEvent(
    {
      anonymousId,
      calculatorId: item.calculatorId,
      calculatorName: item.calculatorName,
      category: item.category,
      occurredAt: item.timestamp,
      appVersion: BACKFILL_APP_VERSION,
      wasOffline: false,
      source: isStandaloneDisplayMode() ? "pwa" : "web",
      environment: APP_ENVIRONMENT,
    },
    item.id,
  )
}
