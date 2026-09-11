"use client"

import { getAnonymousId } from "./client-id"
import { queueCalculationEvent } from "./outbox"
import { syncAnalytics } from "./sync"
import { isStandaloneDisplayMode } from "@/lib/platform"

const APP_VERSION = "2.0.0"
const APP_ENVIRONMENT = process.env.NEXT_PUBLIC_APP_ENV ?? "production"

export async function trackCalculation({
  calculatorId,
  calculatorName,
  category,
}: {
  calculatorId: string
  calculatorName: string
  category: string
}) {
  try {
    await queueCalculationEvent({
      anonymousId: getAnonymousId(),
      calculatorId,
      calculatorName,
      category,
      occurredAt: new Date().toISOString(),
      appVersion: APP_VERSION,
      wasOffline: typeof navigator !== "undefined" ? !navigator.onLine : false,
      source: isStandaloneDisplayMode() ? "pwa" : "web",
      environment: APP_ENVIRONMENT,
    })
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
