import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  FIRST_OPEN_WINDOW_MS,
  HIDDEN_RELOAD_MS,
  IDLE_RELOAD_MS,
  buildReport,
  decideApply,
  isNewBuild,
  maskId,
  shortBuild,
  updateStatus,
  type DiagnosticsSnapshot,
} from "./policy"

describe("isNewBuild", () => {
  it("is true only when both builds are known and differ", () => {
    expect(isNewBuild("dpl_1", "dpl_2")).toBe(true)
    expect(isNewBuild("dpl_1", "dpl_1")).toBe(false)
  })
  it("never fires when a build id is missing (local builds, offline), so it cannot cause false reloads", () => {
    expect(isNewBuild("", "dpl_2")).toBe(false)
    expect(isNewBuild("dpl_1", null)).toBe(false)
    expect(isNewBuild("dpl_1", "")).toBe(false)
  })
})

describe("decideApply", () => {
  const base = { sinceLoadMs: 60_000, hiddenForMs: 0, idleMs: 30_000, alreadyTried: false }
  it("refreshes right away on a first open that nobody has touched", () => {
    expect(decideApply({ ...base, sinceLoadMs: 3000, idleMs: 3000 })).toBe("reload-now")
  })
  it("asks instead when the person already interacted during the first seconds", () => {
    expect(decideApply({ ...base, sinceLoadMs: 10_000, idleMs: 2000 })).toBe("ask")
  })
  it("does not refresh a window that is in use", () => {
    expect(decideApply(base)).toBe("ask")
  })
  it("does not refresh after a quick alt-tab but does after a real absence", () => {
    expect(decideApply({ ...base, hiddenForMs: HIDDEN_RELOAD_MS - 1 })).toBe("ask")
    expect(decideApply({ ...base, hiddenForMs: HIDDEN_RELOAD_MS })).toBe("reload-now")
  })
  it("refreshes a visible window that has been idle long enough", () => {
    expect(decideApply({ ...base, idleMs: IDLE_RELOAD_MS - 1 })).toBe("ask")
    expect(decideApply({ ...base, idleMs: IDLE_RELOAD_MS })).toBe("reload-now")
  })
  it("never loops: once tried for a build it only ever asks", () => {
    expect(decideApply({ sinceLoadMs: 1000, hiddenForMs: 999_999, idleMs: 999_999, alreadyTried: true })).toBe("ask")
  })
  it("first-open window is short", () => {
    expect(FIRST_OPEN_WINDOW_MS).toBeLessThanOrEqual(30_000)
  })
})

const snapshot: DiagnosticsSnapshot = {
  generatedAt: "2026-10-15T10:00:00.000Z",
  appVersion: "2.0.0",
  buildId: "dpl_AAAAAAAAAAAAAAAAAAAA",
  serverBuild: "dpl_BBBBBBBBBBBBBBBBBBBB",
  platform: "windows",
  standalone: true,
  online: true,
  serviceWorker: { supported: true, controlling: true, state: "activated", waiting: false },
  caches: [{ name: "clinexia-shell-v5", entries: 170 }],
  analytics: { pendingCount: 12, oldestPendingAt: "2026-10-01T08:00:00.000Z", anonymousId: "123e4567-e89b-12d3-a456-426614174000", historyItems: 40, backfillDone: true },
}

describe("diagnostics report", () => {
  it("masks the anonymous id and never prints the full value", () => {
    expect(maskId(snapshot.analytics.anonymousId)).toBe("123e4567…")
    expect(buildReport(snapshot)).not.toContain("426614174000")
  })
  it("states the version, waiting events and whether the history re-send ran", () => {
    const text = buildReport(snapshot)
    expect(text).toContain("App version: 2.0.0")
    expect(text).toContain("Events waiting to send: 12")
    expect(text).toContain("History re-send completed: yes")
    expect(text).toContain("update-available")
  })
  it("reports unknowns honestly", () => {
    const text = buildReport({ ...snapshot, serverBuild: null, analytics: { ...snapshot.analytics, pendingCount: null, backfillDone: null } })
    expect(text).toContain("Events waiting to send: unknown")
    expect(text).toContain("History re-send completed: unknown")
    expect(text).toContain("status: unknown")
  })
  it("status handles disabled, up to date and unknown", () => {
    expect(updateStatus({ buildId: "", serverBuild: "x" })).toBe("disabled")
    expect(updateStatus({ buildId: "a", serverBuild: "a" })).toBe("up-to-date")
    expect(updateStatus({ buildId: "a", serverBuild: null })).toBe("unknown")
    expect(shortBuild("")).toBe("not set")
  })
})

describe("wiring", () => {
  it("the diagnostics page reads the same history re-send flag the analytics code writes", () => {
    const key = readFileSync("lib/analytics/backfill.ts", "utf8").match(/BACKFILL_KEY = "([^"]+)"/)?.[1]
    expect(key).toBeTruthy()
    expect(readFileSync("components/diagnostics-panel.tsx", "utf8")).toContain(`"${key}"`)
  })
  it("the build id is set at build time and the watcher is mounted in the layout", () => {
    expect(readFileSync("next.config.mjs", "utf8")).toContain("NEXT_PUBLIC_BUILD_ID")
    expect(readFileSync("app/layout.tsx", "utf8")).toContain("<UpdateWatcher />")
  })
})
