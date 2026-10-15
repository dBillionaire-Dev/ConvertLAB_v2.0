#!/usr/bin/env node
// Pulls Search Console Search Analytics rows (date × query × page × country × device).
//   --backfill      pull the maximum history the API allows (~16 months)
//   (default)       re-pull the last 10 days (recent days get revised, so they are overwritten)
// Search Console data lags about 2 days, so the newest day requested is today minus 2.
import { restFromEnv } from "../../lib/traction/rest.mjs"
import { lagosDay, addDays, addMonths } from "../../lib/traction/dates.mjs"
import { chunkRange, dedupeRows, fetchRange, getAccessToken, readServiceAccount } from "../../lib/traction/search-console.mjs"

const siteUrl = process.env.GSC_SITE_URL
if (!siteUrl) throw new Error("GSC_SITE_URL is required (e.g. sc-domain:example.com or https://example.com/).")
const backfill = process.argv.includes("--backfill")
const rest = restFromEnv()
try {
  const end = addDays(lagosDay(Date.now()), -2)
  const start = backfill ? addMonths(end, -16) : addDays(end, -9)
  const token = await getAccessToken(readServiceAccount())
  let total = 0
  for (const [from, to] of chunkRange(start, end, 31)) {
    const rows = dedupeRows(await fetchRange({ siteUrl, token, startDate: from, endDate: to }))
    await rest.upsert("search_console_daily", rows, "date,row_hash")
    total += rows.length
    console.log(`  ${from} → ${to}: ${rows.length} rows`)
  }
  const detail = `${siteUrl}: ${start} → ${end}, ${total} rows${backfill ? " (backfill)" : ""}`
  await rest.logRun("sync-search-console", "ok", detail)
  console.log(detail)
} catch (error) {
  console.error("sync-search-console failed:", error.message)
  try { await rest.logRun("sync-search-console", "error", error.message) } catch {}
  process.exit(1)
}
