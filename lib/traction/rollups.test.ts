import { describe, expect, it } from "vitest"
import {
  computeActiveWindows,
  computeDailyRollups,
  computeRetention,
  computeReturningPercent,
  computeToolUsage,
} from "./rollups.mjs"
import { addDays, addMonths, lagosDay } from "./dates.mjs"

const a = (day: string, anonymousId: string, platform = "web") => ({ day, anonymousId, platform })

describe("dates", () => {
  it("uses the Africa/Lagos day boundary", () => {
    expect(lagosDay("2026-03-01T23:30:00Z")).toBe("2026-03-02")
    expect(lagosDay("2026-03-01T22:59:59Z")).toBe("2026-03-01")
  })
  it("adds days and months with clamping", () => {
    expect(addDays("2026-02-27", 3)).toBe("2026-03-02")
    expect(addMonths("2026-03-31", -1)).toBe("2026-02-28")
    expect(addMonths("2026-01-15", -16)).toBe("2024-09-15")
  })
})

describe("computeDailyRollups", () => {
  const activity = [a("2026-01-01", "u1"), a("2026-01-01", "u2", "pwa"), a("2026-01-02", "u1"), a("2026-01-02", "u3", "pwa")]
  const rows = computeDailyRollups({
    activity,
    toolEvents: [
      { day: "2026-01-01", platform: "web" },
      { day: "2026-01-01", platform: "web" },
      { day: "2026-01-02", platform: "pwa" },
    ],
  })
  const find = (date: string, platform: string) => rows.find((r) => r.date === date && r.platform === platform)!

  it("counts active, new and returning users per day", () => {
    expect(find("2026-01-01", "all")).toMatchObject({ active_users: 2, new_users: 2, returning_users: 0, tool_uses: 2 })
    expect(find("2026-01-02", "all")).toMatchObject({ active_users: 2, new_users: 1, returning_users: 1, tool_uses: 1 })
  })
  it("splits by platform", () => {
    expect(find("2026-01-02", "pwa")).toMatchObject({ active_users: 1, new_users: 1, tool_uses: 1 })
    expect(find("2026-01-02", "web")).toMatchObject({ active_users: 1, returning_users: 1, tool_uses: 0 })
  })
  it("counts a visitor on two platforms once in 'all'", () => {
    const r = computeDailyRollups({ activity: [a("2026-01-01", "u1", "web"), a("2026-01-01", "u1", "pwa")], toolEvents: [] })
    expect(r.find((x) => x.platform === "all")!.active_users).toBe(1)
  })
  it("leaves sessions null before heartbeats were stored, then sums them", () => {
    expect(find("2026-01-01", "all").sessions).toBeNull()
    const withSessions = computeDailyRollups({
      activity,
      visitorDays: [
        { day: "2026-01-02", anonymousId: "u1", platform: "web", sessions: 2 },
        { day: "2026-01-02", anonymousId: "u3", platform: "pwa", sessions: 1 },
      ],
      toolEvents: [],
    })
    expect(withSessions.find((r) => r.date === "2026-01-01" && r.platform === "all")!.sessions).toBeNull()
    expect(withSessions.find((r) => r.date === "2026-01-02" && r.platform === "all")!.sessions).toBe(3)
  })
  it("is deterministic, so re-running gives identical rows", () => {
    const again = computeDailyRollups({ activity: [...activity].reverse(), toolEvents: [] })
    expect(again.map((r) => [r.date, r.platform, r.active_users])).toEqual(
      computeDailyRollups({ activity, toolEvents: [] }).map((r) => [r.date, r.platform, r.active_users]),
    )
  })
})

describe("computeToolUsage", () => {
  it("groups uses by day and tool", () => {
    const rows = computeToolUsage([
      { day: "2026-01-01", toolId: "bmi", toolName: "BMI" },
      { day: "2026-01-01", toolId: "bmi", toolName: "BMI" },
      { day: "2026-01-02", toolId: "bmi", toolName: "BMI" },
      { day: "2026-01-01", toolId: "egfr" },
    ])
    expect(rows).toEqual([
      { date: "2026-01-01", tool_id: "bmi", tool_name: "BMI", uses: 2 },
      { date: "2026-01-01", tool_id: "egfr", tool_name: null, uses: 1 },
      { date: "2026-01-02", tool_id: "bmi", tool_name: "BMI", uses: 1 },
    ])
  })
})

describe("active windows", () => {
  const activity = [a("2026-02-10", "u1"), a("2026-02-10", "u2"), a("2026-02-04", "u3"), a("2025-12-01", "u4")]
  it("counts distinct users in the DAU, WAU and MAU windows", () => {
    expect(computeActiveWindows(activity, "2026-02-10")).toEqual({ dau: 2, wau: 3, mau: 3 })
  })
  it("returning % is the share seen on 2+ different days", () => {
    const act = [a("2026-02-09", "u1"), a("2026-02-10", "u1"), a("2026-02-10", "u2")]
    expect(computeReturningPercent(act, "2026-02-01", "2026-02-10")).toBe(0.5)
    expect(computeReturningPercent(act, "2026-03-01", "2026-03-10")).toBeNull()
  })
})

describe("retention", () => {
  const activity = [
    a("2026-01-01", "u1"), a("2026-01-02", "u1"), a("2026-01-08", "u1"),
    a("2026-01-01", "u2"),
    a("2026-01-09", "u3"),
  ]
  it("computes D1 and D7 over matured cohorts only", () => {
    const r = computeRetention(activity, "2026-01-10")
    expect(r.d1).toEqual({ cohort: 3, retained: 1, rate: 1 / 3 })
    expect(r.d7).toEqual({ cohort: 2, retained: 1, rate: 0.5 })
  })
  it("returns a null rate when no cohort has matured", () => {
    expect(computeRetention(activity, "2026-01-10").d30.rate).toBeNull()
  })
})
