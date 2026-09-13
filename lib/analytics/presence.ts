"use client"

import { getAnonymousId } from "./client-id"
import { isStandaloneDisplayMode } from "@/lib/platform"

const APP_VERSION = "2.0.0"
const APP_ENVIRONMENT = process.env.NEXT_PUBLIC_APP_ENV ?? "production"

export async function sendPresenceHeartbeat(): Promise<void> {
  if (typeof window === "undefined") return

  try {
    await fetch("/api/analytics/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anonymousId: getAnonymousId(),
        source: isStandaloneDisplayMode() ? "pwa" : "web",
        environment: APP_ENVIRONMENT,
        appVersion: APP_VERSION,
      }),
      keepalive: true,
    })
  } catch {
    // Presence is best-effort and must never affect ConvertLAB.
  }
}
