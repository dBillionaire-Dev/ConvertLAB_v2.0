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

/** Plain-text report for copying. Never includes the full anonymous id, calculator inputs, results or history. */
export function buildReport(s: DiagnosticsSnapshot): string {
  const a = s.analytics
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
    `Anonymous id: ${maskId(a.anonymousId)}`,
  ]
  return lines.join("\n")
}
