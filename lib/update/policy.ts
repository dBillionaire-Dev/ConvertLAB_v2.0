// Pure rules for picking up new versions and for the diagnostics report (no browser APIs, so they are testable).

/** A page opened this recently has had no chance to hold unsaved input, so it can be refreshed straight away. */
export const FIRST_OPEN_WINDOW_MS = 20_000
/** A window nobody has touched for this long is refreshed even though it is visible. */
export const IDLE_RELOAD_MS = 15 * 60_000
/** A window hidden for this long is refreshed; a quick alt-tab never is. */
export const HIDDEN_RELOAD_MS = 2 * 60_000
/** How often an open window asks which version is live. */
export const CHECK_EVERY_MS = 15 * 60_000

export function isNewBuild(localBuild: string, serverBuild: string | null): boolean {
  return Boolean(localBuild) && Boolean(serverBuild) && localBuild !== serverBuild
}

export type ApplyDecision = "reload-now" | "ask"

/**
 * When a newer version is waiting: refresh automatically only when that cannot interrupt anyone
 * (just opened, away for a while, or idle); otherwise show a banner and let the person choose.
 * `alreadyTried` is true when we already refreshed for this build in this session, which stops reload loops.
 */
export function decideApply(input: { sinceLoadMs: number; hiddenForMs: number; idleMs: number; alreadyTried: boolean }): ApplyDecision {
  if (input.alreadyTried) return "ask"
  if (input.sinceLoadMs <= FIRST_OPEN_WINDOW_MS && input.idleMs >= input.sinceLoadMs) return "reload-now"
  if (input.hiddenForMs >= HIDDEN_RELOAD_MS) return "reload-now"
  if (input.idleMs >= IDLE_RELOAD_MS) return "reload-now"
  return "ask"
}

export function maskId(id: string): string {
  return id ? `${id.slice(0, 8)}…` : "none yet"
}

export function shortBuild(build: string | null): string {
  if (build === null) return "unknown"
  if (!build) return "not set"
  return build.length > 14 ? `${build.slice(0, 14)}…` : build
}

export interface DiagnosticsSnapshot {
  generatedAt: string
  appVersion: string
  buildId: string
  /** null = could not ask the server (offline or error) */
  serverBuild: string | null
  platform: string
  standalone: boolean
  online: boolean
  serviceWorker: { supported: boolean; controlling: boolean; state: string | null; waiting: boolean }
  caches: { name: string; entries: number }[]
  /** round trip to the server in ms; null = could not reach it */
  latencyMs: number | null
  storage: { usedBytes: number | null; quotaBytes: number | null }
  display: { screen: string; language: string; timezone: string; cores: number | null }
  analytics: {
    pendingCount: number | null
    oldestPendingAt: string | null
    anonymousId: string
    historyItems: number | null
    backfillDone: boolean | null
  }
}

export function updateStatus(s: Pick<DiagnosticsSnapshot, "buildId" | "serverBuild">): "up-to-date" | "update-available" | "unknown" | "disabled" {
  if (!s.buildId) return "disabled"
  if (s.serverBuild === null || s.serverBuild === "") return "unknown"
  return isNewBuild(s.buildId, s.serverBuild) ? "update-available" : "up-to-date"
}

export function formatBytes(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "unknown"
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`
  return `${(n / 1024 ** 3).toFixed(2)} GB`
}

export type CheckStatus = "ok" | "warn" | "info"
export interface Check {
  id: string
  label: string
  status: CheckStatus
  detail: string
}

/** The self-test. Every line is computed from what this device reports; nothing is assumed. */
export function runChecks(s: DiagnosticsSnapshot): Check[] {
  const a = s.analytics
  const checks: Check[] = []
  const add = (id: string, label: string, status: CheckStatus, detail: string) => checks.push({ id, label, status, detail })

  add("network", "Connection", s.online ? "ok" : "warn", s.online ? "Online" : "Offline (the app still works; statistics send when you are back online)")

  if (!s.online) add("server", "Server", "info", "Skipped while offline")
  else if (s.latencyMs === null) add("server", "Server", "warn", "Could not reach the server")
  else add("server", "Server", "ok", `Responding in ${s.latencyMs} ms`)

  const version = updateStatus(s)
  if (version === "up-to-date") add("version", "Version", "ok", `Up to date (${s.appVersion})`)
  else if (version === "update-available") add("version", "Version", "warn", "A newer version is available")
  else if (version === "unknown") add("version", "Version", "info", "Could not compare with the live version")
  else add("version", "Version", "info", "Automatic updates are not enabled for this build")

  if (!s.serviceWorker.supported) add("offline", "Offline mode", "warn", "Not supported by this browser")
  else if (s.serviceWorker.controlling) add("offline", "Offline mode", "ok", "Active" + (s.serviceWorker.waiting ? " (an update is waiting)" : ""))
  else add("offline", "Offline mode", "warn", "Not active yet; reload the app once")

  const pages = s.caches.reduce((n, c) => n + c.entries, 0)
  add("cache", "Offline pages", pages > 0 ? "ok" : "warn", pages > 0 ? `${pages} pages stored` : "Nothing stored yet")

  if (a.pendingCount === null) add("queue", "Usage queue", "info", "Could not read the queue")
  else if (a.pendingCount === 0) add("queue", "Usage queue", "ok", "Nothing waiting to send")
  else add("queue", "Usage queue", "warn", `${a.pendingCount} event${a.pendingCount === 1 ? "" : "s"} waiting to send`)

  if (a.backfillDone === null) add("history", "History re-send", "info", "Unknown")
  else if (a.backfillDone) add("history", "History re-send", "ok", "Completed on this device")
  else if (!a.historyItems) add("history", "History re-send", "info", "Nothing to re-send (no history on this device)")
  else add("history", "History re-send", "warn", `Not completed yet (${a.historyItems} history items)`)

  const { usedBytes, quotaBytes } = s.storage
  if (usedBytes === null || !quotaBytes) add("storage", "Device storage", "info", "Not reported by this browser")
  else {
    const pct = (usedBytes / quotaBytes) * 100
    add("storage", "Device storage", pct < 80 ? "ok" : "warn", `${formatBytes(usedBytes)} used of ${formatBytes(quotaBytes)} available`)
  }

  add("mode", "Running as", "info", `${s.platform}${s.standalone ? ", installed window" : ", browser tab"}`)
  return checks
}

export interface HealthSummary {
  passed: number
  scored: number
  /** 0-100, or null when nothing could be scored */
  score: number | null
  level: "normal" | "attention"
}

/** "info" lines are shown but not scored. Any warning turns the light amber. */
export function summarize(checks: Check[]): HealthSummary {
  const ok = checks.filter((c) => c.status === "ok").length
  const warn = checks.filter((c) => c.status === "warn").length
  const scored = ok + warn
  return { passed: ok, scored, score: scored ? Math.round((ok / scored) * 100) : null, level: warn ? "attention" : "normal" }
}

export interface ScriptLine {
  text: string
  tone: "plain" | "ok" | "warn" | "info"
}

/** The text shown in the terminal-style panel, one line per real check. */
export function scanScript(checks: Check[]): ScriptLine[] {
  const mark = { ok: "OK  ", warn: "WARN", info: "INFO" } as const
  const lines: ScriptLine[] = [{ text: "$ clinexia --self-test", tone: "plain" }]
  for (const c of checks) {
    lines.push({ text: `[${mark[c.status]}] ${c.label.padEnd(16, ".")} ${c.detail}`, tone: c.status })
  }
  const h = summarize(checks)
  lines.push({
    text: h.level === "normal" ? `${h.passed} of ${h.scored} checks passed. All systems normal.` : `${h.passed} of ${h.scored} checks passed. Needs attention: see the WARN lines.`,
    tone: h.level === "normal" ? "ok" : "warn",
  })
  return lines
}

/** Plain-text report for copying. Never includes the full anonymous id, calculator inputs, results or history. */
export function buildReport(s: DiagnosticsSnapshot): string {
  const a = s.analytics
  const health = summarize(runChecks(s))
  const lines = [
    "Clinexia diagnostics",
    `Generated: ${s.generatedAt}`,
    `App version: ${s.appVersion}`,
    `Build: ${shortBuild(s.buildId)} | live build: ${shortBuild(s.serverBuild)} | status: ${updateStatus(s)}`,
    `Platform: ${s.platform}${s.standalone ? " (installed window)" : " (browser tab)"} | online: ${s.online ? "yes" : "no"}`,
    `Service worker: ${s.serviceWorker.supported ? (s.serviceWorker.controlling ? "controlling this page" : "not controlling") : "not supported"}${s.serviceWorker.state ? ` (${s.serviceWorker.state})` : ""}${s.serviceWorker.waiting ? ", update waiting" : ""}`,
    `Caches: ${s.caches.length ? s.caches.map((c) => `${c.name}=${c.entries}`).join(", ") : "none"}`,
    `Events waiting to send: ${a.pendingCount ?? "unknown"}${a.oldestPendingAt ? ` (oldest ${a.oldestPendingAt})` : ""}`,
    `History re-send completed: ${a.backfillDone === null ? "unknown" : a.backfillDone ? "yes" : "no"} | history items on device: ${a.historyItems ?? "unknown"}`,
    `Server response: ${s.latencyMs === null ? "unknown" : `${s.latencyMs} ms`} | storage: ${formatBytes(s.storage.usedBytes)} of ${formatBytes(s.storage.quotaBytes)}`,
    `Anonymous id: ${maskId(a.anonymousId)}`,
    `Self-test: ${health.passed} of ${health.scored} checks passed (${health.level})`,
  ]
  return lines.join("\n")
}
