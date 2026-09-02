"use client"

import { useEffect } from "react"

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    navigator.serviceWorker.register("/service-worker.js").catch(() => {
      // Offline support is a progressive enhancement to fail silently.
    })
  }, [])

  return null
}
