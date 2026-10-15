"use client"

import { getAnonymousId } from "./client-id"
import { queueCalculationEvent } from "./outbox"
import { syncAnalytics } from "./sync"
import { getPlatform } from "@/lib/platform"

const APP_VERSION = "2.0.0"
const APP_ENVIRONMENT = process.env.NEXT_PUBLIC_APP_ENV ?? "production"

export async function trackCalculation({
  calculatorId,
  calculatorName,
  category,
  eventId,
  occurredAt,
}: {
  calculatorId: string
  calculatorName: string
  category: string
  /** Pass the history item's ID so history and analytics share one identity (retries and backfills stay idempotent). */
  eventId?: string
  occurredAt?: string
}) {
  try {
    // Landing-page demo frames are marketing, not usage.
    if (typeof window !== "undefined" && window.self !== window.top) return

    await queueCalculationEvent(
      {
        anonymousId: getAnonymousId(),
        calculatorId,
        calculatorName,
        category,
        occurredAt: occurredAt ?? new Date().toISOString(),
        appVersion: APP_VERSION,
        wasOffline: typeof navigator !== "undefined" ? navigator.onLine === false : false,
        source: getPlatform(),
        environment: APP_ENVIRONMENT,
      },
      eventId,
    )
    void syncAnalytics()
    void registerBackgroundSync()
  } catch {
    // Analytics must never break a calculator.
  }
}

async function registerBackgroundSync() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return

  try {
    const registration = await navigator.serviceWorker.ready
    if ("sync" in registration) {
      await (registration as ServiceWorkerRegistration & {
        sync: { register: (tag: string) => Promise<void> }
      }).sync.register("convertlab-analytics")
    }
  } catch {
    // Background Sync is optional; online/app-open sync remains the fallback.
  }
}
