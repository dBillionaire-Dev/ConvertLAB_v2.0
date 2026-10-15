// GitHub only exposes cumulative download counts per release asset, so we store daily snapshots
// and derive daily deltas. The first time an asset is seen, its current cumulative total is stored as a
// "baseline" row dated to the release's published date: real downloads, but their exact distribution
// between that date and the first capture is unknown.
import { addDays, lagosDay } from "./dates.mjs"

/**
 * @param {any[]} releases raw GitHub Releases API response
 * @returns {{ tag: string, publishedAt: string|null, assets: { name: string, count: number }[] }[]}
 */
export function parseReleases(releases) {
  return (Array.isArray(releases) ? releases : [])
    .filter((r) => r && !r.draft && typeof r.tag_name === "string")
    .map((r) => ({
      tag: r.tag_name,
      publishedAt: r.published_at ?? r.created_at ?? null,
      assets: (r.assets ?? [])
        .filter((a) => typeof a.name === "string" && a.name.toLowerCase().endsWith(".apk"))
        .map((a) => ({ name: a.name, count: Number(a.download_count) || 0 })),
    }))
}

/**
 * Decide which snapshot rows to write now. Idempotent: re-running on the same day overwrites that day's row.
 * @param {{ releases: ReturnType<typeof parseReleases>, knownAssets: Set<string>, today: string, capturedAt: string }} input
 *   knownAssets holds `${tag}|${asset}` for every asset that already has any snapshot.
 */
export function planSnapshots({ releases, knownAssets, today, capturedAt }) {
  const rows = []
  for (const release of releases) {
    const publishedDay = release.publishedAt ? lagosDay(release.publishedAt) : today
    for (const asset of release.assets) {
      const base = {
        release_tag: release.tag,
        asset_name: asset.name,
        download_count: asset.count,
        captured_at: capturedAt,
        published_at: release.publishedAt,
      }
      const first = !knownAssets.has(`${release.tag}|${asset.name}`)
      if (first) {
        rows.push({ ...base, snapshot_date: publishedDay > today ? today : publishedDay, is_baseline: true })
        if (publishedDay < today) rows.push({ ...base, snapshot_date: today, is_baseline: false })
      } else {
        rows.push({ ...base, snapshot_date: today, is_baseline: false })
      }
    }
  }
  return rows
}

/**
 * Daily deltas from snapshots. A baseline row is never counted as a delta (its downloads happened
 * before tracking). A count that goes down (asset deleted and re-uploaded) is treated as a reset: delta 0.
 * @param {{ snapshot_date: string, release_tag: string, asset_name: string, download_count: number, is_baseline?: boolean }[]} rows
 */
export function computeDailyDeltas(rows) {
  const groups = new Map()
  for (const r of rows) {
    const key = `${r.release_tag}|${r.asset_name}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(r)
  }
  const deltas = []
  for (const list of groups.values()) {
    list.sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date))
    for (let i = 1; i < list.length; i++) {
      const cur = list[i]
      if (cur.is_baseline) continue
      const diff = cur.download_count - list[i - 1].download_count
      deltas.push({
        date: cur.snapshot_date,
        release_tag: cur.release_tag,
        asset_name: cur.asset_name,
        delta: Math.max(diff, 0),
        reset: diff < 0,
      })
    }
  }
  return deltas.sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Headline numbers.
 *  - total: sum of each asset's latest cumulative count (all-time, includes pre-tracking downloads).
 *  - last30: downloads in the 30 days ending `today`. For an asset first captured after the window start,
 *    the baseline counts in full only if the release was published inside the window; otherwise only the
 *    growth observed since tracking began is counted (a lower bound).
 *  - trackedSince: earliest captured date; downloads before it are "baseline" only.
 */
export function summarizeDownloads(rows, today) {
  const cutoff = addDays(today, -30)
  const groups = new Map()
  for (const r of rows) {
    const key = `${r.release_tag}|${r.asset_name}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(r)
  }
  let total = 0
  let last30 = 0
  let baselineTotal = 0
  let trackedSince = null
  for (const list of groups.values()) {
    list.sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date))
    const latest = list[list.length - 1]
    total += latest.download_count
    const baseline = list.find((r) => r.is_baseline)
    if (baseline) baselineTotal += baseline.download_count
    const firstTracked = list.find((r) => !r.is_baseline) ?? list[0]
    const capturedDay = firstTracked.captured_at ? lagosDay(firstTracked.captured_at) : firstTracked.snapshot_date
    if (trackedSince === null || capturedDay < trackedSince) trackedSince = capturedDay
    const atCutoff = [...list].reverse().find((r) => r.snapshot_date <= cutoff)
    if (atCutoff) {
      last30 += Math.max(latest.download_count - atCutoff.download_count, 0)
    } else {
      const published = (baseline?.published_at ?? list[0].published_at)
      const publishedDay = published ? lagosDay(published) : list[0].snapshot_date
      const reference = publishedDay >= cutoff ? 0 : (firstTracked.download_count)
      last30 += Math.max(latest.download_count - reference, 0)
    }
  }
  return { total, last30, baselineTotal, trackedSince }
}

export async function fetchReleases({ repo, token, fetchImpl = fetch }) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "clinexia-traction" }
  if (token) headers.Authorization = `Bearer ${token}`
  const all = []
  for (let page = 1; page <= 10; page++) {
    const res = await fetchImpl(`https://api.github.com/repos/${repo}/releases?per_page=100&page=${page}`, { headers })
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${(await res.text()).slice(0, 200)}`)
    const batch = await res.json()
    all.push(...batch)
    if (batch.length < 100) break
  }
  return all
}
