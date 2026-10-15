"use client"

import { getAnonymousId } from "./client-id"
import { getPlatform } from "@/lib/platform"

const APP_VERSION = "2.0.0"
const APP_ENVIRONMENT = process.env.NEXT_PUBLIC_APP_ENV ?? "production"

/** Reports an installed-app event. Best-effort; never affects the app. Safari/iOS does not fire `appinstalled`. */
export async function reportInstall(): Promise<void> {
  if (typeof window === "undefined") return
  try {
    // At the moment of install the page is usually still a browser tab, so map "web" to the installed form.
    const current = getPlatform()
    const source = current !== "web" ? current : /Windows/i.test(navigator.userAgent) ? "windows" : "pwa"
    await fetch("/api/analytics/install", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anonymousId: getAnonymousId(),
        source,
        environment: APP_ENVIRONMENT,
        appVersion: APP_VERSION,
      }),
      keepalive: true,
    })
  } catch {
    // Ignore.
  }
}
