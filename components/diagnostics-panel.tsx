"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import { APP_VERSION, BUILD_ID } from "@/lib/build-info"
import { getAnonymousId } from "@/lib/analytics/client-id"
import { getPendingCalculationEvents } from "@/lib/analytics/outbox"
import { syncAnalytics } from "@/lib/analytics/sync"
import { getAllHistory } from "@/lib/history/db"
import { getPlatform, isStandaloneDisplayMode } from "@/lib/platform"
import { alreadyTried, applyUpdate, fetchServerBuild } from "@/lib/update/refresh"
import { buildReport, maskId, shortBuild, updateStatus, type DiagnosticsSnapshot } from "@/lib/update/policy"

// Same key as lib/analytics/backfill.ts (a test keeps the two in step).
const BACKFILL_KEY = "convertlab:analytics-history-backfill:v3"

async function collect(): Promise<DiagnosticsSnapshot> {
  const serverBuild = navigator.onLine === false ? null : await fetchServerBuild()

  let sw: DiagnosticsSnapshot["serviceWorker"] = { supported: "serviceWorker" in navigator, controlling: false, state: null, waiting: false }
  if (sw.supported) {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      sw = {
        supported: true,
        controlling: Boolean(navigator.serviceWorker.controller),
        state: registration?.active?.state ?? registration?.installing?.state ?? null,
        waiting: Boolean(registration?.waiting),
      }
    } catch {}
  }

  const cacheInfo: DiagnosticsSnapshot["caches"] = []
  try {
    if (typeof caches !== "undefined") {
      for (const name of await caches.keys()) cacheInfo.push({ name, entries: (await (await caches.open(name)).keys()).length })
    }
  } catch {}

  let pendingCount: number | null = null
  let oldestPendingAt: string | null = null
  try {
    const pending = await getPendingCalculationEvents() // sorted oldest first; only the count and a timestamp are used
    pendingCount = pending.length
    oldestPendingAt = pending[0]?.occurredAt ?? null
  } catch {}

  let historyItems: number | null = null
  try {
    historyItems = (await getAllHistory()).length // count only; nothing from the history is shown
  } catch {}

  let backfillDone: boolean | null = null
  try {
    backfillDone = localStorage.getItem(BACKFILL_KEY) === "1"
  } catch {}

  let anonymousId = ""
  try {
    anonymousId = getAnonymousId()
  } catch {}

  return {
    generatedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    buildId: BUILD_ID,
    serverBuild,
    platform: getPlatform(),
    standalone: isStandaloneDisplayMode(),
    online: navigator.onLine !== false,
    serviceWorker: sw,
    caches: cacheInfo,
    analytics: { pendingCount, oldestPendingAt, anonymousId, historyItems, backfillDone },
  }
}

function Row({ label, children, tone }: { label: string; children: ReactNode; tone?: "ok" | "warn" }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2 text-sm last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`text-right font-medium ${tone === "warn" ? "text-amber-600" : tone === "ok" ? "text-emerald-600" : ""}`}>{children}</dd>
    </div>
  )
}

export function DiagnosticsPanel() {
  const [snapshot, setSnapshot] = useState<DiagnosticsSnapshot | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  const refresh = useCallback(async () => {
    setBusy(true)
    try {
      setSnapshot(await collect())
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const sendNow = async () => {
    setMessage("Sending…")
    await syncAnalytics()
    await refresh()
    setMessage("Done. The count above is what is still waiting.")
  }

  const copy = async () => {
    if (!snapshot) return
    try {
      await navigator.clipboard.writeText(buildReport(snapshot))
      setMessage("Report copied.")
    } catch {
      setMessage("Could not copy. Take a screenshot instead.")
    }
  }

  if (!snapshot) return <p className="text-sm text-muted-foreground">Reading this device…</p>
  const status = updateStatus(snapshot)
  const a = snapshot.analytics
  const button = "rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Diagnostics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What this device is running. Nothing here is sent anywhere, and no calculator inputs, results or history are shown. A screenshot of this page is enough for support.
        </p>
      </div>

      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Version</h2>
        <dl className="rounded-xl border px-4">
          <Row label="App version">{snapshot.appVersion}</Row>
          <Row label="This copy's build">{shortBuild(snapshot.buildId)}</Row>
          <Row label="Live build">{snapshot.online ? shortBuild(snapshot.serverBuild) : "offline"}</Row>
          <Row label="Status" tone={status === "up-to-date" ? "ok" : status === "update-available" ? "warn" : undefined}>
            {status === "up-to-date" && "Up to date"}
            {status === "update-available" && "Newer version available"}
            {status === "unknown" && "Could not check"}
            {status === "disabled" && "Automatic updates not enabled for this build"}
          </Row>
        </dl>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Usage statistics</h2>
        <dl className="rounded-xl border px-4">
          <Row label="Events waiting to send" tone={a.pendingCount === 0 ? "ok" : a.pendingCount ? "warn" : undefined}>{a.pendingCount ?? "unknown"}</Row>
          <Row label="Oldest waiting event">{a.oldestPendingAt ? new Date(a.oldestPendingAt).toLocaleString() : "none"}</Row>
          <Row label="History re-send completed" tone={a.backfillDone ? "ok" : undefined}>{a.backfillDone === null ? "unknown" : a.backfillDone ? "Yes" : "Not yet"}</Row>
          <Row label="History items on this device">{a.historyItems ?? "unknown"}</Row>
          <Row label="Anonymous id (first characters)">{maskId(a.anonymousId)}</Row>
        </dl>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Device</h2>
        <dl className="rounded-xl border px-4">
          <Row label="Running as">{snapshot.platform}{snapshot.standalone ? " (installed window)" : " (browser tab)"}</Row>
          <Row label="Online" tone={snapshot.online ? "ok" : "warn"}>{snapshot.online ? "Yes" : "No"}</Row>
          <Row label="Offline support">
            {!snapshot.serviceWorker.supported ? "Not supported" : snapshot.serviceWorker.controlling ? "Active" : "Not active yet (reload once)"}
            {snapshot.serviceWorker.waiting ? ", update waiting" : ""}
          </Row>
          <Row label="Offline caches">{snapshot.caches.length ? snapshot.caches.map((c) => `${c.name.replace("clinexia-", "")}: ${c.entries}`).join(" · ") : "none"}</Row>
          <Row label="Checked">{new Date(snapshot.generatedAt).toLocaleTimeString()}</Row>
        </dl>
      </section>

      <div className="flex flex-wrap gap-2">
        <button className={button} disabled={busy} onClick={() => void refresh()}>Check again</button>
        <button className={button} disabled={busy || !snapshot.online} onClick={() => void sendNow()}>Send waiting events now</button>
        <button className={button} onClick={() => void copy()}>Copy report</button>
        {status === "update-available" && snapshot.serverBuild ? (
          <button
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            onClick={() => void applyUpdate(snapshot.serverBuild as string)}
          >
            Update now{alreadyTried(snapshot.serverBuild) ? " (retry)" : ""}
          </button>
        ) : null}
      </div>
      {message ? <p role="status" className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  )
}
