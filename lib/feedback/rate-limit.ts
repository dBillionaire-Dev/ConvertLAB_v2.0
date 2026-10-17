// Slows down spam: a few submissions per client per 15 minutes. Held in memory only for the window and never stored
// or logged. Serverless instances do not share memory, so this is a speed bump, not a guarantee (the database also
// refuses a second answer from the same device in the same round).
const WINDOW_MS = 15 * 60_000
const MAX = 8
const hits = new Map<string, number[]>()

export function allowSubmission(clientKey: string, now = Date.now()): boolean {
  const recent = (hits.get(clientKey) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX) {
    hits.set(clientKey, recent)
    return false
  }
  hits.set(clientKey, [...recent, now])
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k)
  return true
}
