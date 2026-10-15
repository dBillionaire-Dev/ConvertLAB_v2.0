#!/usr/bin/env node
// Stores today's cumulative APK download counts from the GitHub Releases API (one snapshot per asset per day).
// First sight of an asset also stores a baseline row dated to the release's published date.
//   APK_REPO=owner/Clinexia_V3.0-Mobile node --env-file=.env.local scripts/traction/sync-github.mjs
import { restFromEnv } from "../../lib/traction/rest.mjs"
import { lagosDay } from "../../lib/traction/dates.mjs"
import { fetchReleases, parseReleases, planSnapshots } from "../../lib/traction/github.mjs"

const repo = process.env.APK_REPO || "dBillionaire-Dev/Clinexia_V3.0-Mobile"
const rest = restFromEnv()
try {
  const releases = parseReleases(await fetchReleases({ repo, token: process.env.APK_GITHUB_TOKEN }))
  const existing = await rest.selectAll("apk_downloads_snapshots", "select=release_tag,asset_name&order=release_tag,asset_name,snapshot_date")
  const knownAssets = new Set(existing.map((r) => `${r.release_tag}|${r.asset_name}`))
  const rows = planSnapshots({ releases, knownAssets, today: lagosDay(Date.now()), capturedAt: new Date().toISOString() })
  await rest.upsert("apk_downloads_snapshots", rows, "release_tag,asset_name,snapshot_date")
  const detail = `${repo}: ${releases.length} releases, ${rows.length} snapshot rows`
  await rest.logRun("sync-github", "ok", detail)
  console.log(detail)
} catch (error) {
  console.error("sync-github failed:", error.message)
  try { await rest.logRun("sync-github", "error", error.message) } catch {}
  process.exit(1)
}
