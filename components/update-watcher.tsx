"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { BUILD_ID } from "@/lib/build-info"
import { isLandingSite } from "@/lib/site"
import { CHECK_EVERY_MS, decideApply, isNewBuild } from "@/lib/update/policy"
import { alreadyTried, applyUpdate, fetchServerBuild, warmShellCache } from "@/lib/update/refresh"

/**
 * Keeps installed apps and long-open windows current.
 *  - A freshly opened app that is behind refreshes itself within seconds (nothing typed yet, so nothing is lost).
 *  - A window left open for days asks every 15 minutes and when it is brought back to the front.
 *  - It refreshes by itself only when that cannot interrupt anyone (hidden for 2+ minutes, or untouched for
 *    15+ minutes). Otherwise it shows a banner with a Refresh button.
 * Works offline: when the live version cannot be reached it does nothing.
 */
export function UpdateWatcher() {
  const [pendingBuild, setPendingBuild] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const loadedAt = useRef(0)
  const lastActivity = useRef(0)
  const hiddenAt = useRef<number | null>(null)
  const applying = useRef(false)

  const enabled = () =>
    process.env.NODE_ENV === "production" && Boolean(BUILD_ID) && !isLandingSite() && window.self === window.top

  const apply = useCallback((build: string) => {
    if (applying.current) return
    applying.current = true
    void applyUpdate(build)
  }, [])

  // Ask the server which version is live.
  useEffect(() => {
    if (typeof window === "undefined" || !enabled()) return
    loadedAt.current = Date.now()
    lastActivity.current = Date.now()

    const touch = () => { lastActivity.current = Date.now() }
    const events = ["pointerdown", "keydown", "touchstart", "wheel"] as const
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }))

    const check = async () => {
      if (applying.current || navigator.onLine === false) return
      const server = await fetchServerBuild()
      if (isNewBuild(BUILD_ID, server) && server) setPendingBuild(server)
      try {
        const registration = await navigator.serviceWorker?.getRegistration()
        void registration?.update()
      } catch {}
    }
    const first = window.setTimeout(() => void check(), 2000)
    const every = window.setInterval(() => void check(), CHECK_EVERY_MS)
    const warm = window.setTimeout(() => void warmShellCache(BUILD_ID), 12_000)
    const onVisible = () => {
      if (document.visibilityState === "hidden") hiddenAt.current = Date.now()
      else void check()
    }
    const onOnline = () => void check()
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("online", onOnline)
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch))
      window.clearTimeout(first)
      window.clearInterval(every)
      window.clearTimeout(warm)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("online", onOnline)
    }
  }, [])

  // A newer version is waiting: refresh when it is safe, otherwise leave the banner up.
  useEffect(() => {
    if (!pendingBuild) return
    const evaluate = () => {
      const now = Date.now()
      const hiddenForMs = document.visibilityState === "hidden" && hiddenAt.current ? now - hiddenAt.current : 0
      const wasAway = hiddenAt.current && document.visibilityState === "visible" ? now - hiddenAt.current : 0
      const decision = decideApply({
        sinceLoadMs: now - loadedAt.current,
        hiddenForMs: Math.max(hiddenForMs, wasAway),
        idleMs: now - lastActivity.current,
        alreadyTried: alreadyTried(pendingBuild),
      })
      if (decision === "reload-now") apply(pendingBuild)
    }
    evaluate()
    const timer = window.setInterval(evaluate, 30_000)
    document.addEventListener("visibilitychange", evaluate)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", evaluate)
    }
  }, [pendingBuild, apply])

  if (!pendingBuild || dismissed) return null

  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border bg-background p-3 shadow-lg print:hidden"
    >
      <p className="flex-1 text-sm">A new version of Clinexia is ready.</p>
      <button
        onClick={() => apply(pendingBuild)}
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
      >
        Refresh now
      </button>
      <button onClick={() => setDismissed(true)} className="rounded-md px-2 py-1.5 text-sm text-muted-foreground">
        Later
      </button>
    </div>
  )
}
