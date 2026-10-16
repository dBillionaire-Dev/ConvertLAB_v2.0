"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { APP_VERSION, BUILD_ID } from "@/lib/build-info"
import { getAnonymousId } from "@/lib/analytics/client-id"
import { getPendingCalculationEvents } from "@/lib/analytics/outbox"
import { syncAnalytics } from "@/lib/analytics/sync"
import { getAllHistory } from "@/lib/history/db"
import { Activity, Home } from "lucide-react"
import { getPlatform, isStandaloneDisplayMode } from "@/lib/platform"
import { alreadyTried, applyUpdate, pingServer } from "@/lib/update/refresh"
import {
  buildReport,
  formatBytes,
  maskId,
  runChecks,
  scanScript,
  shortBuild,
  summarize,
  updateStatus,
  type DiagnosticsSnapshot,
  type ScriptLine,
} from "@/lib/update/policy"

// Same key as lib/analytics/backfill.ts (a test keeps the two in step).
const BACKFILL_KEY = "convertlab:analytics-history-backfill:v3"
const PING_EVERY_MS = 10_000
const MAX_POINTS = 24

async function collect(): Promise<DiagnosticsSnapshot> {
  const online = navigator.onLine !== false
  const ping = online ? await pingServer() : { build: null, ms: null }

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
    const pending = await getPendingCalculationEvents() // only the count and a timestamp are used
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

  let storage: DiagnosticsSnapshot["storage"] = { usedBytes: null, quotaBytes: null }
  try {
    const estimate = await navigator.storage?.estimate?.()
    if (estimate) storage = { usedBytes: estimate.usage ?? null, quotaBytes: estimate.quota ?? null }
  } catch {}

  const nav = navigator as Navigator & { hardwareConcurrency?: number }
  return {
    generatedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    buildId: BUILD_ID,
    serverBuild: ping.build,
    platform: getPlatform(),
    standalone: isStandaloneDisplayMode(),
    online,
    serviceWorker: sw,
    caches: cacheInfo,
    latencyMs: ping.ms,
    storage,
    display: {
      screen: `${window.screen.width}x${window.screen.height}${window.devicePixelRatio > 1 ? ` @${window.devicePixelRatio}x` : ""}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cores: nav.hardwareConcurrency ?? null,
    },
    analytics: { pendingCount, oldestPendingAt, anonymousId, historyItems, backfillDone },
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Small visual pieces. Everything animated is switched off for people who ask their device for reduced motion.

function Led({ level, size = "h-4 w-4" }: { level: "normal" | "attention"; size?: string }) {
  const tone = level === "normal" ? "bg-emerald-500" : "bg-red-500"
  const glow = level === "normal" ? "shadow-[0_0_14px_3px_rgba(16,185,129,0.65)]" : "shadow-[0_0_14px_3px_rgba(239,68,68,0.65)]"
  return (
    <span className={`relative inline-flex ${size}`} aria-hidden="true">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none ${tone}`} />
      <span className={`relative inline-flex h-full w-full rounded-full ${tone} ${glow}`} />
    </span>
  )
}

function HealthRing({ score, level, busy }: { score: number | null; level: "normal" | "attention"; busy: boolean }) {
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(score ?? 0))
    return () => cancelAnimationFrame(frame)
  }, [score])
  const stroke = level === "normal" ? "stroke-emerald-500" : "stroke-red-500"
  return (
    <div className="relative h-36 w-36 shrink-0" role="img" aria-label={`Health ${score ?? 0} percent`}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="9" className="stroke-muted" />
        <circle
          cx="60" cy="60" r={radius} fill="none" strokeWidth="9" strokeLinecap="round"
          className={`${stroke} transition-[stroke-dashoffset] duration-1000 motion-reduce:transition-none`}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - shown / 100)}
        />
      </svg>
      {busy ? <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-emerald-400 motion-reduce:animate-none" /> : null}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums">{score === null ? "–" : `${score}%`}</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">health</span>
      </div>
    </div>
  )
}

function Sparkline({ values }: { values: number[] }) {
  const w = 180
  const h = 44
  if (values.length < 2) return <p className="text-xs text-muted-foreground">Collecting readings…</p>
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = Math.max(max - min, 1)
  const points = values.map((v, i) => `${((i / (values.length - 1)) * (w - 8) + 4).toFixed(1)},${(h - 6 - ((v - min) / span) * (h - 12)).toFixed(1)}`)
  const last = points[points.length - 1].split(",")
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-11 w-full max-w-[180px]" role="img" aria-label="Server response time, recent readings">
      <polyline points={points.join(" ")} fill="none" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" className="stroke-emerald-500" />
      <circle cx={last[0]} cy={last[1]} r="3.5" className="fill-emerald-500" />
    </svg>
  )
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-mono text-lg font-semibold tabular-nums">{children}</div>
    </div>
  )
}

function Row({ label, children, tone }: { label: string; children: ReactNode; tone?: "ok" | "warn" }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2 text-sm last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`min-w-0 break-words text-right font-medium ${tone === "warn" ? "text-red-600" : tone === "ok" ? "text-emerald-600" : ""}`}>{children}</dd>
    </div>
  )
}

const toneClass: Record<ScriptLine["tone"], string> = {
  plain: "text-neutral-300",
  ok: "text-emerald-400",
  warn: "text-red-400",
  info: "text-sky-300",
}

/** Prints the real self-test results one line at a time, like a console. */
function Terminal({ lines, running }: { lines: ScriptLine[]; running: boolean }) {
  const [visible, setVisible] = useState(0)
  const signature = lines.map((l) => l.text).join("\n")
  useEffect(() => {
    if (running) { setVisible(0); return }
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setVisible(lines.length); return }
    setVisible(0)
    let count = 0
    const timer = window.setInterval(() => {
      count += 1
      setVisible(count)
      if (count >= lines.length) window.clearInterval(timer)
    }, 130)
    return () => window.clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, running])

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-inner">
      <div className="flex items-center gap-2 border-b border-neutral-800 px-4 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
        <span className="ml-2 font-mono text-xs text-neutral-500">self-test</span>
      </div>
      <pre className="min-h-[15rem] overflow-x-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-6 sm:text-[13px]" aria-live="polite">
        {running ? <span className="text-neutral-400">$ scanning this device…</span> : lines.slice(0, visible).map((l, i) => (
          <div key={i} className={toneClass[l.tone]}>{l.text}</div>
        ))}
        <span className="inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-emerald-400 motion-reduce:animate-none" />
      </pre>
    </div>
  )
}

const pad = (n: number) => String(n).padStart(2, "0")

export function DiagnosticsPanel() {
  const [snapshot, setSnapshot] = useState<DiagnosticsSnapshot | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [pings, setPings] = useState<number[]>([])
  const [now, setNow] = useState<Date | null>(null)
  const loadedAt = useRef(0)

  const refresh = useCallback(async () => {
    setBusy(true)
    try {
      const next = await collect()
      setSnapshot(next)
      if (next.latencyMs !== null) setPings((p) => [...p, next.latencyMs as number].slice(-MAX_POINTS))
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    loadedAt.current = Date.now()
    void refresh()
  }, [refresh])

  // Live clock and uptime.
  useEffect(() => {
    setNow(new Date())
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  // A fresh server reading every 10 seconds while this page is open and visible.
  useEffect(() => {
    const timer = window.setInterval(async () => {
      if (document.visibilityState !== "visible" || navigator.onLine === false) return
      const { ms } = await pingServer()
      if (ms !== null) setPings((p) => [...p, ms].slice(-MAX_POINTS))
    }, PING_EVERY_MS)
    return () => window.clearInterval(timer)
  }, [])

  const checks = useMemo(() => (snapshot ? runChecks(snapshot) : []), [snapshot])
  const health = useMemo(() => summarize(checks), [checks])
  const script = useMemo(() => scanScript(checks), [checks])

  const sendNow = async () => {
    setMessage("Sending…")
    await syncAnalytics()
    await refresh()
    setMessage("Done. The queue above shows what is still waiting.")
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
  const upSeconds = now ? Math.max(0, Math.floor((now.getTime() - loadedAt.current) / 1000)) : 0
  const uptime = `${pad(Math.floor(upSeconds / 3600))}:${pad(Math.floor((upSeconds % 3600) / 60))}:${pad(upSeconds % 60)}`
  const latest = pings.length ? pings[pings.length - 1] : snapshot.latencyMs
  const button = "rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
  const attention = health.level === "attention"

  return (
    <div className="space-y-6">
         <div className="flex items-start justify-between gap-4">
           <div>
             <div className="flex items-center gap-2">
               <Activity className="h-6 w-6 shrink-0 text-blue-600 dark:text-blue-400" />
               <h1 className="text-2xl font-bold tracking-tight">
                 Clinexia Local Diagnostics
               </h1>
             </div>
             <p className="mt-1 text-sm text-muted-foreground">
               A live check of this device. Nothing here is sent anywhere, and no
               calculator inputs, results or history are shown. A screenshot of this
               page is enough for support.
             </p>
           </div>

           <Link
             href="/"
             className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-5 py-3 text-sm font-medium text-neutral-100 transition-colors hover:border-neutral-500 hover:bg-neutral-800"
           >
             <Home className="h-4 w-4" />
           </Link>
         </div>

      {/* Status strip */}
      <section
        className={`grid items-center gap-6 rounded-2xl border p-5 md:grid-cols-[auto_1fr_auto] ${
          attention ? "border-red-500/40 bg-red-500/5" : "border-emerald-500/40 bg-emerald-500/5"
        }`}
      >
        <div className="flex justify-center">
          <HealthRing score={health.score} level={health.level} busy={busy} />
        </div>
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center gap-3 md:justify-start">
            <Led level={health.level} />
            <span className="text-xl font-bold tracking-wide sm:text-2xl">{attention ? "NEEDS ATTENTION" : "ALL SYSTEMS NORMAL"}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {health.passed} of {health.scored} checks passed on this device.
            {attention ? " The red lines in the self-test below show what to look at." : " Nothing needs doing."}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            v{snapshot.appVersion} · build {shortBuild(snapshot.buildId)} · {snapshot.display.screen} · {snapshot.display.timezone}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 md:grid-cols-1">
          <Stat label="Local time">{now ? now.toLocaleTimeString() : "--:--:--"}</Stat>
          <Stat label="Page uptime">{uptime}</Stat>
          <div className="col-span-2 md:col-span-1">
            <Stat label="Server response">{latest === null || latest === undefined ? "offline" : `${latest} ms`}</Stat>
            <Sparkline values={pings} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
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

        {/* Same width as one column above, centred beneath both on larger screens. */}
        <section className="md:col-span-2 md:w-[calc(50%-0.75rem)] md:justify-self-center">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Device</h2>
          <dl className="rounded-xl border px-4">
            <Row label="Running as">{snapshot.platform}{snapshot.standalone ? " (installed window)" : " (browser tab)"}</Row>
            <Row label="Online" tone={snapshot.online ? "ok" : "warn"}>{snapshot.online ? "Yes" : "No"}</Row>
            <Row label="Offline support">
              {!snapshot.serviceWorker.supported ? "Not supported" : snapshot.serviceWorker.controlling ? "Active" : "Not active yet (reload once)"}
              {snapshot.serviceWorker.waiting ? ", update waiting" : ""}
            </Row>
            <Row label="Offline caches">{snapshot.caches.length ? snapshot.caches.map((c) => `${c.name.replace("clinexia-", "")}: ${c.entries}`).join(" · ") : "none"}</Row>
            <Row label="Device storage">{formatBytes(snapshot.storage.usedBytes)} of {formatBytes(snapshot.storage.quotaBytes)}</Row>
            <Row label="Screen · language">{snapshot.display.screen} · {snapshot.display.language}</Row>
            <Row label="Processor threads">{snapshot.display.cores ?? "not reported"}</Row>
            <Row label="Checked">{new Date(snapshot.generatedAt).toLocaleTimeString()}</Row>
          </dl>
        </section>

        <section className="md:col-span-2 md:w-[calc(50%-0.75rem)] md:justify-self-center mt-5">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Self-test</h2>
          <Terminal lines={script} running={busy} />
        </section>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button className={button} disabled={busy} onClick={() => void refresh()}>Run self-test again</button>
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
      {message ? <p role="status" className="text-center text-sm text-muted-foreground">{message}</p> : null}
      <p className="text-center text-xs text-muted-foreground">
        Open this page from anywhere in the app: tap the logo three times quickly, or press Win ⌘ + Shift + D (Cmd ⌘ + Shift + D on a Mac) or Ctrl + Alt + Shift + D.
      </p>
    </div>
  )
}
