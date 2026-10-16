import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  FIRST_OPEN_WINDOW_MS,
  HIDDEN_RELOAD_MS,
  IDLE_RELOAD_MS,
  buildReport,
  decideApply,
  formatBytes,
  runChecks,
  scanScript,
  summarize,
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
  latencyMs: 142,
  storage: { usedBytes: 52_428_800, quotaBytes: 5_368_709_120 },
  display: { screen: "1920x1080", language: "en-GB", timezone: "Africa/Lagos", cores: 8 },
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
  it("the diagnostics shortcut is mounted (layout and/or the analytics component)", () => {
    const mounted = readFileSync("app/layout.tsx", "utf8") + readFileSync("components/analytics-sync.tsx", "utf8")
    expect(mounted).toContain("<DiagnosticsShortcut")
  })
  it("the build id is set at build time and the watcher is mounted in the layout", () => {
    expect(readFileSync("next.config.mjs", "utf8")).toContain("NEXT_PUBLIC_BUILD_ID")
    expect(readFileSync("app/layout.tsx", "utf8")).toContain("<UpdateWatcher />")
  })
})

describe("self-test", () => {
  const healthy: DiagnosticsSnapshot = {
    ...snapshot,
    serverBuild: snapshot.buildId,
    analytics: { ...snapshot.analytics, pendingCount: 0 },
  }
  const byId = (s: DiagnosticsSnapshot, id: string) => runChecks(s).find((c) => c.id === id)!

  it("a healthy device passes every scored check and the light stays green", () => {
    const summary = summarize(runChecks(healthy))
    expect(summary.level).toBe("normal")
    expect(summary.score).toBe(100)
    expect(summary.passed).toBe(summary.scored)
  })
  it("a waiting event queue, a newer version and an incomplete history re-send each raise a warning", () => {
    expect(byId({ ...healthy, analytics: { ...healthy.analytics, pendingCount: 3 } }, "queue").status).toBe("warn")
    expect(byId({ ...healthy, serverBuild: "dpl_NEW" }, "version").status).toBe("warn")
    expect(byId({ ...healthy, analytics: { ...healthy.analytics, backfillDone: false, historyItems: 5 } }, "history").status).toBe("warn")
    expect(summarize(runChecks({ ...healthy, analytics: { ...healthy.analytics, pendingCount: 3 } })).level).toBe("attention")
  })
  it("having no history to re-send is not a problem", () => {
    expect(byId({ ...healthy, analytics: { ...healthy.analytics, backfillDone: false, historyItems: 0 } }, "history").status).toBe("info")
  })
  it("offline is a warning on the connection, and the server check is skipped rather than failed", () => {
    const offline = { ...healthy, online: false, latencyMs: null, serverBuild: null }
    expect(byId(offline, "network").status).toBe("warn")
    expect(byId(offline, "server").status).toBe("info")
  })
  it("unreachable server while online is a warning; unknown values are shown as info, never as a pass", () => {
    expect(byId({ ...healthy, latencyMs: null }, "server").status).toBe("warn")
    expect(byId({ ...healthy, storage: { usedBytes: null, quotaBytes: null } }, "storage").status).toBe("info")
    expect(byId({ ...healthy, analytics: { ...healthy.analytics, pendingCount: null } }, "queue").status).toBe("info")
  })
  it("storage nearly full is a warning", () => {
    expect(byId({ ...healthy, storage: { usedBytes: 90, quotaBytes: 100 } }, "storage").status).toBe("warn")
  })
  it("the terminal script has one line per check plus a true summary", () => {
    const lines = scanScript(runChecks(healthy))
    expect(lines).toHaveLength(runChecks(healthy).length + 2)
    expect(lines[0].text).toBe("$ clinexia --self-test")
    expect(lines[lines.length - 1].text).toMatch(/^\d+ of \d+ checks passed\. All systems normal\.$/)
    const bad = scanScript(runChecks({ ...healthy, analytics: { ...healthy.analytics, pendingCount: 3 } }))
    expect(bad[bad.length - 1].tone).toBe("warn")
    expect(bad.some((l) => l.text.includes("3 events waiting to send"))).toBe(true)
  })
  it("score is null when nothing can be scored", () => {
    expect(summarize([]).score).toBeNull()
  })
  it("formats sizes", () => {
    expect(formatBytes(512)).toBe("512 B")
    expect(formatBytes(52_428_800)).toBe("50.0 MB")
    expect(formatBytes(null)).toBe("unknown")
  })
  it("the report carries the self-test result", () => {
    expect(buildReport(healthy)).toContain("Self-test:")
  })
})
