import { describe, expect, it } from "vitest"
import { computeDailyDeltas, parseReleases, planSnapshots, summarizeDownloads } from "./github.mjs"

const release = (tag: string, published: string, count: number, name = `Clinexia-${tag}.apk`) => ({
  tag_name: tag,
  published_at: published,
  draft: false,
  assets: [
    { name, download_count: count },
    { name: "notes.txt", download_count: 99 },
  ],
})

describe("parseReleases", () => {
  it("keeps only non-draft releases and APK assets", () => {
    const parsed = parseReleases([release("v1", "2026-01-01T00:00:00Z", 5), { ...release("v2", "2026-01-02T00:00:00Z", 1), draft: true }])
    expect(parsed).toHaveLength(1)
    expect(parsed[0].assets).toEqual([{ name: "Clinexia-v1.apk", count: 5 }])
  })
})

describe("planSnapshots", () => {
  const releases = parseReleases([release("v1", "2026-01-01T10:00:00Z", 120)])
  it("stores a baseline at the published date plus today's snapshot on first sight", () => {
    const rows = planSnapshots({ releases, knownAssets: new Set(), today: "2026-01-10", capturedAt: "2026-01-10T03:00:00Z" })
    expect(rows.map((r) => [r.snapshot_date, r.download_count, r.is_baseline])).toEqual([
      ["2026-01-01", 120, true],
      ["2026-01-10", 120, false],
    ])
  })
  it("stores a single baseline when the release was published today", () => {
    const rows = planSnapshots({ releases, knownAssets: new Set(), today: "2026-01-01", capturedAt: "2026-01-01T12:00:00Z" })
    expect(rows).toHaveLength(1)
    expect(rows[0].is_baseline).toBe(true)
  })
  it("writes only today's row for known assets, so re-runs overwrite the same key", () => {
    const rows = planSnapshots({ releases, knownAssets: new Set(["v1|Clinexia-v1.apk"]), today: "2026-01-11", capturedAt: "x" })
    expect(rows.map((r) => [r.snapshot_date, r.is_baseline])).toEqual([["2026-01-11", false]])
  })
})

describe("computeDailyDeltas", () => {
  const snap = (snapshot_date: string, download_count: number, is_baseline = false) => ({
    snapshot_date, release_tag: "v1", asset_name: "a.apk", download_count, is_baseline,
  })
  it("derives daily deltas and never counts the baseline as a delta", () => {
    const deltas = computeDailyDeltas([snap("2026-01-01", 120, true), snap("2026-01-10", 120), snap("2026-01-11", 127), snap("2026-01-12", 130)])
    expect(deltas.map((d) => [d.date, d.delta])).toEqual([["2026-01-10", 0], ["2026-01-11", 7], ["2026-01-12", 3]])
  })
  it("treats a decreasing counter as a reset with delta 0", () => {
    const [d] = computeDailyDeltas([snap("2026-01-10", 50), snap("2026-01-11", 10)])
    expect(d).toMatchObject({ delta: 0, reset: true })
  })
  it("keeps separate assets separate", () => {
    const deltas = computeDailyDeltas([
      snap("2026-01-10", 5), snap("2026-01-11", 6),
      { ...snap("2026-01-10", 100), asset_name: "b.apk" }, { ...snap("2026-01-11", 100), asset_name: "b.apk" },
    ])
    expect(deltas.filter((d) => d.asset_name === "a.apk")[0].delta).toBe(1)
    expect(deltas.filter((d) => d.asset_name === "b.apk")[0].delta).toBe(0)
  })
})

describe("summarizeDownloads", () => {
  it("totals latest cumulative counts across assets", () => {
    const s = summarizeDownloads(
      [
        { snapshot_date: "2026-01-10", release_tag: "v1", asset_name: "a.apk", download_count: 10 },
        { snapshot_date: "2026-01-20", release_tag: "v1", asset_name: "a.apk", download_count: 15 },
        { snapshot_date: "2026-01-20", release_tag: "v2", asset_name: "b.apk", download_count: 4 },
      ],
      "2026-01-20",
    )
    expect(s.total).toBe(19)
  })
  it("counts a recent release's baseline fully in the last 30 days", () => {
    const rows = [
      { snapshot_date: "2026-01-15", release_tag: "v2", asset_name: "b.apk", download_count: 40, is_baseline: true, published_at: "2026-01-15T08:00:00Z", captured_at: "2026-01-20T03:00:00Z" },
      { snapshot_date: "2026-01-20", release_tag: "v2", asset_name: "b.apk", download_count: 40, is_baseline: false, published_at: "2026-01-15T08:00:00Z", captured_at: "2026-01-20T03:00:00Z" },
    ]
    expect(summarizeDownloads(rows, "2026-01-25").last30).toBe(40)
  })
  it("counts only growth since tracking for an old release", () => {
    const rows = [
      { snapshot_date: "2025-06-01", release_tag: "v1", asset_name: "a.apk", download_count: 500, is_baseline: true, published_at: "2025-06-01T08:00:00Z", captured_at: "2026-01-10T03:00:00Z" },
      { snapshot_date: "2026-01-10", release_tag: "v1", asset_name: "a.apk", download_count: 500, is_baseline: false, published_at: "2025-06-01T08:00:00Z", captured_at: "2026-01-10T03:00:00Z" },
      { snapshot_date: "2026-01-20", release_tag: "v1", asset_name: "a.apk", download_count: 512, is_baseline: false, published_at: "2025-06-01T08:00:00Z", captured_at: "2026-01-20T03:00:00Z" },
    ]
    const s = summarizeDownloads(rows, "2026-01-20")
    expect(s).toMatchObject({ total: 512, last30: 12, baselineTotal: 500, trackedSince: "2026-01-10" })
  })
})
