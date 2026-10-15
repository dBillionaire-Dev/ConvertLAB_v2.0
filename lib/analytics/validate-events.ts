/**
 * Server-side validation for analytics uploads.
 *
 * The previous route validated the whole batch with a single zod schema. One
 * malformed event (an over-long name, an odd timestamp, an empty field) made the
 * entire request fail with HTTP 400, and because the browser stops at the first
 * failed batch, that one event sat at the front of the outbox forever and blocked
 * every event queued behind it. Validation is now per event: good events are
 * stored, unfixable events are reported back as `rejected` so the browser can
 * drop them, and everything else is repaired (trimmed / defaulted) rather than lost.
 */

export interface ValidEvent {
  id: string
  anonymousId: string
  calculatorId: string
  calculatorName: string
  category: string
  occurredAt: string
  appVersion: string
  wasOffline: boolean
  source: "web" | "pwa" | "android" | "windows"
  environment: string
}

export interface ParsedEvents {
  valid: ValidEvent[]
  /** IDs of events that can never be accepted. The client should delete them. */
  rejected: string[]
}

export const MAX_EVENTS_PER_REQUEST = 500

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SOURCES = new Set(["web", "pwa", "android", "windows"])
/** Device clocks drift. Anything further ahead than this is treated as "now". */
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

/** Returns null when the body is not shaped like `{ events: [...] }`. */
export function parseEvents(payload: unknown, now: number = Date.now()): ParsedEvents | null {
  if (!payload || typeof payload !== "object") return null
  const raw = (payload as { events?: unknown }).events
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_EVENTS_PER_REQUEST) return null

  const valid: ValidEvent[] = []
  const rejected: string[] = []
  const seen = new Set<string>()

  for (const item of raw) {
    const candidate = (item && typeof item === "object" ? item : {}) as Record<string, unknown>
    const id = typeof candidate.id === "string" ? candidate.id : ""

    const anonymousId = text(candidate.anonymousId, 100)
    const calculatorId = text(candidate.calculatorId, 120)

    if (!UUID_RE.test(id) || !anonymousId || !calculatorId) {
      if (id) rejected.push(id)
      continue
    }

    // Same event twice in one request: keep one, but still acknowledge the ID.
    if (seen.has(id.toLowerCase())) continue
    seen.add(id.toLowerCase())

    let occurred = typeof candidate.occurredAt === "string" ? Date.parse(candidate.occurredAt) : Number.NaN
    if (!Number.isFinite(occurred) || occurred > now + FUTURE_TOLERANCE_MS) occurred = now

    valid.push({
      id,
      anonymousId,
      calculatorId,
      calculatorName: text(candidate.calculatorName, 200) || calculatorId,
      category: text(candidate.category, 100) || "unknown",
      occurredAt: new Date(occurred).toISOString(),
      appVersion: text(candidate.appVersion, 40) || "unknown",
      wasOffline: candidate.wasOffline === true,
      source: SOURCES.has(String(candidate.source)) ? (candidate.source as ValidEvent["source"]) : "web",
      environment: text(candidate.environment, 40) || "production",
    })
  }

  return { valid, rejected }
}
