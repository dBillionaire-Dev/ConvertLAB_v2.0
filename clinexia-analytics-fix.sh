#!/usr/bin/env bash
#
# Clinexia analytics fix: make the admin dashboard tally with what users see on their devices.
#
# Run from the REPO ROOT:   bash clinexia-analytics-fix.sh [--skip-verify]
#
# What it does
#   - Reports every saved calculation to analytics (the main calculator screen never did).
#   - Re-sends each user's local history once, so past gaps are filled in. Safe to repeat:
#     event IDs are the history IDs and the server ignores IDs it already has.
#   - Fixes offline sync: no more stuck queues, events queued mid-upload are no longer
#     left behind, automatic retry with backoff, flush on reconnect / app resume / every 5 min.
#   - Server validates per event, so one bad event can no longer block a whole batch.
#   - Dashboard: real 7-day figure (the old "thisWeek" was just "today") plus a 7-day
#     column per user, next to the 14-day figures.
#   - Adds supabase/analytics-fix-2026-10.sql (run once in the Supabase SQL Editor).
#
# Safety: every anchor is checked BEFORE anything is written, originals are backed up to
# .clinexia-fix-backup/<timestamp>/, and any failure restores them automatically.

set -euo pipefail

SKIP_VERIFY=0
for arg in "$@"; do
  case "$arg" in
    --skip-verify) SKIP_VERIFY=1 ;;
    *) echo "Unknown option: $arg"; exit 2 ;;
  esac
done

say()  { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33mwarning:\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31merror:\033[0m %s\n' "$*" >&2; exit 1; }

# ---- 1. Make sure we are in the right place -------------------------------------------
[ -f package.json ] || die "package.json not found. Run this from the repo root."
grep -q '"name": *"clinexia-web"' package.json || die "This does not look like the Clinexia web repo (package.json name is not clinexia-web)."
[ -f lib/analytics/sync.ts ] && [ -f app/api/analytics/route.ts ] && [ -f components/analytics-sync.tsx ] \
  || die "Expected analytics files are missing. Is this the right branch/version?"
command -v node >/dev/null 2>&1 || die "node is required (it is already needed to run the app)."

if [ -f lib/analytics/validate-events.ts ]; then
  say "This fix is already applied (lib/analytics/validate-events.ts exists). Nothing to do."
  exit 0
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR=".clinexia-fix-backup/$STAMP"
CREATED_LIST="$(mktemp)"
PATCH_FILE="$(mktemp -t clinexia-patch.XXXXXX)"
mv "$PATCH_FILE" "$PATCH_FILE.mjs"; PATCH_FILE="$PATCH_FILE.mjs"
APPLIED=0

cleanup() { rm -f "$PATCH_FILE" "$CREATED_LIST"; }

rollback() {
  [ "$APPLIED" -eq 1 ] && return 0
  warn "Something failed. Restoring your original files..."
  if [ -d "$BACKUP_DIR" ]; then
    (cd "$BACKUP_DIR" && find . -type f) | while read -r f; do
      mkdir -p "$(dirname "$f")"; cp "$BACKUP_DIR/$f" "$f"
    done
  fi
  while read -r f; do [ -n "$f" ] && rm -f "$f"; done < "$CREATED_LIST" || true
  warn "Restored. No changes were kept."
}
trap 'rollback; cleanup' ERR
trap 'cleanup' EXIT

backup() {  # copy an existing file into the backup dir once
  local f="$1"
  if [ -f "$f" ] && [ ! -f "$BACKUP_DIR/$f" ]; then
    mkdir -p "$BACKUP_DIR/$(dirname "$f")"; cp "$f" "$BACKUP_DIR/$f"
  fi
}

write_file() {  # write_file <path>  (content on stdin)
  local f="$1"
  if [ -f "$f" ]; then backup "$f"; else echo "$f" >> "$CREATED_LIST"; fi
  mkdir -p "$(dirname "$f")"
  cat > "$f"
}

# ---- 2. Dry run: confirm every edit anchor matches before touching anything -----------
cat > "$PATCH_FILE" <<'__CLINEXIA_EOF__'
// Applies small, anchored edits to existing files. Every anchor must match exactly
// once or the whole run aborts before anything is written (see apply script).
import fs from "node:fs"

const edits = []
const edit = (file, find, replace, count = 1) => edits.push({ file, find, replace, count })

// ---- lib/analytics/outbox.ts: bulk queue (used by the history backfill)
edit(
  "lib/analytics/outbox.ts",
  "export async function getPendingCalculationEvents(): Promise<CalculationEvent[]> {",
  `/** Queues many events in a single transaction. Re-queuing an existing ID simply overwrites it. */
export async function queueCalculationEvents(events: CalculationEvent[]): Promise<void> {
  if (!events.length) return
  const db = await openDB()

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      const store = tx.objectStore(STORE_NAME)
      for (const event of events) store.put(event)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export async function getPendingCalculationEvents(): Promise<CalculationEvent[]> {`,
)

// ---- lib/analytics/types.ts
edit("lib/analytics/types.ts", "  last14Days: number\n", "  last7Days: number\n  last14Days: number\n")
edit(
  "lib/analytics/types.ts",
  "    calculationsLast14Days: number\n",
  "    calculationsLast7Days?: number\n    calculationsLast14Days: number\n",
)

// ---- app/admin/page.tsx
edit("app/admin/page.tsx", "      thisWeek: 0,\n", "      thisWeek: 0,\n      last7Days: 0,\n", 2)
edit(
  "app/admin/page.tsx",
  "    thisWeek: Number(result?.thisWeek ?? 0),\n",
  "    thisWeek: Number(result?.thisWeek ?? 0),\n    last7Days: Number(result?.last7Days ?? 0),\n",
)
edit(
  "app/admin/page.tsx",
  '            ["Calculations · 14 days", data.last14Days],\n',
  '            ["Calculations · 7 days", data.last7Days],\n            ["Calculations · 14 days", data.last14Days],\n',
)

// ---- components/admin-user-management.tsx: per-user 7 day column
edit(
  "components/admin-user-management.tsx",
  '            <th className="pb-3 pr-4 font-medium">14 days</th>\n',
  '            <th className="pb-3 pr-4 font-medium">7 days</th>\n            <th className="pb-3 pr-4 font-medium">14 days</th>\n',
)
edit(
  "components/admin-user-management.tsx",
  '                <td className="py-3 pr-4 font-medium">{number(item.calculationsLast14Days)}</td>\n',
  '                <td className="py-3 pr-4 font-medium">{number(item.calculationsLast7Days ?? 0)}</td>\n                <td className="py-3 pr-4 font-medium">{number(item.calculationsLast14Days)}</td>\n',
)

// ---- components/hematology/red-cell-indices-calculator.tsx
// record() now reports analytics itself (one event per saved history entry).
edit(
  "components/hematology/red-cell-indices-calculator.tsx",
  'import { trackCalculation } from "@/lib/analytics/track-calculation"\n',
  "",
)
edit(
  "components/hematology/red-cell-indices-calculator.tsx",
  `    void trackCalculation({
      calculatorId: "red-cell-indices",
      calculatorName: "Red Cell Indices",
      category: "hematology",
    })
`,
  "",
)
edit(
  "components/hematology/red-cell-indices-calculator.tsx",
  `          unit: item.result.unit,
        })`,
  `          unit: item.result.unit,
        }, { analyticsName: "Red Cell Indices" })`,
)

// ---- public/service-worker.js: same accepted/rejected contract as the page
const SW = "public/service-worker.js"
const NEW_SW_SYNC = `async function postAnalyticsBatch(batch) {
  return fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      events: batch.map((event) => ({
        ...event,
        source: event.source || "web",
        environment: event.environment || "production",
      })),
    }),
  })
}

// Returns true when every event in the batch was stored or permanently rejected.
async function syncAnalyticsBatch(batch) {
  const response = await postAnalyticsBatch(batch)

  if (response.ok) {
    const body = await response.json().catch(() => ({}))
    const finished = [...(body.accepted || []), ...(body.rejected || [])]
    await deleteAnalyticsEvents(finished)
    const done = new Set(finished)
    return batch.every((event) => done.has(event.id))
  }

  // The payload itself is bad: isolate the culprit so it cannot block the rest.
  if (response.status === 400 || response.status === 413 || response.status === 422) {
    if (batch.length > 1) {
      let allDone = true
      for (const event of batch) {
        if (!(await syncAnalyticsBatch([event]))) allDone = false
      }
      return allDone
    }
    await deleteAnalyticsEvents([batch[0].id])
    return true
  }

  return false
}

async function syncAnalyticsFromServiceWorker() {
  const events = await getAnalyticsEvents()
  if (!events.length) return

  for (let i = 0; i < events.length; i += 100) {
    let ok = false
    try {
      ok = await syncAnalyticsBatch(events.slice(i, i + 100))
    } catch {
      ok = false
    }
    // Throwing makes Background Sync retry later (with its own backoff).
    if (!ok) throw new Error("Clinexia analytics sync failed")
  }
}

`
edits.push({
  file: SW,
  custom: (text) => {
    const start = text.indexOf("async function syncAnalyticsFromServiceWorker() {")
    const end = text.indexOf('self.addEventListener("fetch"')
    if (start === -1 || end === -1 || end < start) throw new Error("service worker sync block not found")
    return text.slice(0, start) + NEW_SW_SYNC + text.slice(end)
  },
})

// ---------------------------------------------------------------- run
async function main() {
  const dryRun = process.argv.includes("--check")
  const staged = new Map()

  for (const e of edits) {
    const current = staged.has(e.file) ? staged.get(e.file) : fs.readFileSync(e.file, "utf8")
    let next
    if (e.custom) {
      next = e.custom(current)
    } else {
      const found = current.split(e.find).length - 1
      if (found !== e.count) {
        throw new Error(`${e.file}: expected ${e.count} match(es) but found ${found} for:\n${e.find.slice(0, 120)}`)
      }
      next = current.split(e.find).join(e.replace)
    }
    staged.set(e.file, next)
  }

  if (!dryRun) {
    for (const [file, text] of staged) fs.writeFileSync(file, text)
  }
  console.log(`${dryRun ? "checked" : "patched"} ${staged.size} files: ${[...staged.keys()].join(", ")}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})

__CLINEXIA_EOF__

say "Checking that your files match what this fix expects..."
node "$PATCH_FILE" --check || die "Your files differ from the version this fix was built for. Nothing was changed."

# ---- 3. Back up everything we are about to modify -------------------------------------
say "Backing up originals to $BACKUP_DIR"
for f in \
  lib/analytics/outbox.ts lib/analytics/types.ts lib/analytics/sync.ts lib/analytics/track-calculation.ts \
  lib/analytics/backfill.ts lib/history/use-history.ts app/api/analytics/route.ts \
  components/analytics-sync.tsx components/admin-user-management.tsx \
  components/hematology/red-cell-indices-calculator.tsx app/admin/page.tsx public/service-worker.js; do
  backup "$f"
done

# ---- 4. Write the new / replaced files -------------------------------------------------
say "Writing fixed analytics code..."
write_file lib/analytics/validate-events.ts <<'__CLINEXIA_EOF__'
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
  source: "web" | "pwa" | "android"
  environment: string
}

export interface ParsedEvents {
  valid: ValidEvent[]
  /** IDs of events that can never be accepted. The client should delete them. */
  rejected: string[]
}

export const MAX_EVENTS_PER_REQUEST = 500

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SOURCES = new Set(["web", "pwa", "android"])
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
__CLINEXIA_EOF__

write_file lib/analytics/validate-events.test.ts <<'__CLINEXIA_EOF__'
import { describe, expect, it } from "vitest"
import { parseEvents } from "./validate-events"

const NOW = Date.parse("2026-10-12T12:00:00.000Z")
const ID_A = "11111111-1111-4111-8111-111111111111"
const ID_B = "22222222-2222-4222-8222-222222222222"

function event(overrides: Record<string, unknown> = {}) {
  return {
    id: ID_A,
    anonymousId: "device-1",
    calculatorId: "bmi",
    calculatorName: "BMI",
    category: "clinical",
    occurredAt: "2026-10-12T11:00:00.000Z",
    appVersion: "2.0.0",
    wasOffline: false,
    source: "web",
    environment: "production",
    ...overrides,
  }
}

describe("parseEvents", () => {
  it("rejects payloads that are not an events array", () => {
    expect(parseEvents(null, NOW)).toBeNull()
    expect(parseEvents({}, NOW)).toBeNull()
    expect(parseEvents({ events: [] }, NOW)).toBeNull()
    expect(parseEvents({ events: "x" }, NOW)).toBeNull()
  })

  it("keeps good events when a bad one is in the same batch", () => {
    const result = parseEvents({ events: [event(), event({ id: "not-a-uuid" }), event({ id: ID_B })] }, NOW)!
    expect(result.valid.map((e) => e.id)).toEqual([ID_A, ID_B])
    expect(result.rejected).toEqual(["not-a-uuid"])
  })

  it("repairs over-long and missing fields instead of dropping the event", () => {
    const result = parseEvents(
      { events: [event({ calculatorName: "x".repeat(500), category: "", appVersion: undefined, source: "weird" })] },
      NOW,
    )!
    expect(result.valid).toHaveLength(1)
    expect(result.valid[0].calculatorName).toHaveLength(200)
    expect(result.valid[0].category).toBe("unknown")
    expect(result.valid[0].appVersion).toBe("unknown")
    expect(result.valid[0].source).toBe("web")
  })

  it("accepts timestamps with offsets and normalises them to UTC", () => {
    const result = parseEvents({ events: [event({ occurredAt: "2026-10-12T10:00:00+01:00" })] }, NOW)!
    expect(result.valid[0].occurredAt).toBe("2026-10-12T09:00:00.000Z")
  })

  it("clamps future timestamps from drifting device clocks to now", () => {
    const result = parseEvents({ events: [event({ occurredAt: "2027-01-01T00:00:00.000Z" })] }, NOW)!
    expect(result.valid[0].occurredAt).toBe(new Date(NOW).toISOString())
  })

  it("keeps old offline timestamps untouched", () => {
    const result = parseEvents({ events: [event({ occurredAt: "2026-10-03T08:15:00.000Z", wasOffline: true })] }, NOW)!
    expect(result.valid[0].occurredAt).toBe("2026-10-03T08:15:00.000Z")
    expect(result.valid[0].wasOffline).toBe(true)
  })

  it("collapses a duplicate ID inside one request", () => {
    const result = parseEvents({ events: [event(), event()] }, NOW)!
    expect(result.valid).toHaveLength(1)
    expect(result.rejected).toEqual([])
  })
})
__CLINEXIA_EOF__

write_file lib/analytics/sync.ts <<'__CLINEXIA_EOF__'
"use client"

import { getPendingCalculationEvents, removeCalculationEvents } from "./outbox"
import type { CalculationEvent } from "./types"

const BATCH_SIZE = 100
const RETRY_DELAYS_MS = [15_000, 60_000, 5 * 60_000]

let syncInFlight: Promise<void> | null = null
let rerunRequested = false
let retryTimer: ReturnType<typeof setTimeout> | null = null
let consecutiveFailures = 0

type BatchOutcome = "done" | "retry"

/**
 * Uploads every queued calculation event.
 *
 * Guarantees:
 *  - An event queued while an upload is already running is picked up by a
 *    follow-up pass. (Previously it was left behind until the next trigger,
 *    which could be an hour away.)
 *  - A permanently invalid event can no longer block the events behind it.
 *  - Network/server failures leave events queued and schedule an automatic
 *    retry with backoff, instead of waiting for the next app launch.
 */
export function syncAnalytics(): Promise<void> {
  if (syncInFlight) {
    rerunRequested = true
    return syncInFlight
  }

  syncInFlight = (async () => {
    do {
      rerunRequested = false
      await flushOutbox()
    } while (rerunRequested)
  })().finally(() => {
    syncInFlight = null
  })

  return syncInFlight
}

async function flushOutbox(): Promise<void> {
  if (typeof window === "undefined") return
  // `onLine === false` is reliable; `true` is not, so only the false case skips the attempt.
  if (navigator.onLine === false) return

  let events: CalculationEvent[]
  try {
    events = await getPendingCalculationEvents()
  } catch {
    return
  }

  if (!events.length) {
    resetBackoff()
    return
  }

  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const outcome = await sendBatch(events.slice(i, i + BATCH_SIZE))
    if (outcome === "retry") {
      scheduleRetry()
      return
    }
  }

  resetBackoff()
}

async function sendBatch(batch: CalculationEvent[]): Promise<BatchOutcome> {
  try {
    const response = await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        events: batch.map((event) => ({
          ...event,
          source: event.source ?? "web",
          environment: event.environment ?? "production",
        })),
      }),
      keepalive: batch.length <= 20,
    })

    if (response.ok) {
      const body = (await response.json().catch(() => ({}))) as { accepted?: string[]; rejected?: string[] }
      const finished = [...(body.accepted ?? []), ...(body.rejected ?? [])]
      await removeCalculationEvents(finished)
      // Anything the server neither stored nor rejected stays queued for the next pass.
      const finishedSet = new Set(finished)
      return batch.every((event) => finishedSet.has(event.id)) ? "done" : "retry"
    }

    // The server says the payload itself is bad. Isolate the culprit so the rest still go through.
    if (response.status === 400 || response.status === 413 || response.status === 422) {
      if (batch.length > 1) {
        for (const event of batch) {
          if ((await sendBatch([event])) === "retry") return "retry"
        }
        return "done"
      }
      await removeCalculationEvents([batch[0].id])
      return "done"
    }

    return "retry"
  } catch {
    return "retry"
  }
}

function scheduleRetry() {
  if (typeof window === "undefined" || retryTimer) return
  const delay = RETRY_DELAYS_MS[Math.min(consecutiveFailures, RETRY_DELAYS_MS.length - 1)]
  consecutiveFailures += 1
  retryTimer = setTimeout(() => {
    retryTimer = null
    void syncAnalytics()
  }, delay)
}

function resetBackoff() {
  consecutiveFailures = 0
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
}
__CLINEXIA_EOF__

write_file lib/analytics/track-calculation.ts <<'__CLINEXIA_EOF__'
"use client"

import { getAnonymousId } from "./client-id"
import { queueCalculationEvent } from "./outbox"
import { syncAnalytics } from "./sync"
import { isStandaloneDisplayMode } from "@/lib/platform"

const APP_VERSION = "2.0.0"
const APP_ENVIRONMENT = process.env.NEXT_PUBLIC_APP_ENV ?? "production"

export async function trackCalculation({
  calculatorId,
  calculatorName,
  category,
  eventId,
  occurredAt,
}: {
  calculatorId: string
  calculatorName: string
  category: string
  /** Pass the history item's ID so history and analytics share one identity (retries and backfills stay idempotent). */
  eventId?: string
  occurredAt?: string
}) {
  try {
    // Landing-page demo frames are marketing, not usage.
    if (typeof window !== "undefined" && window.self !== window.top) return

    await queueCalculationEvent(
      {
        anonymousId: getAnonymousId(),
        calculatorId,
        calculatorName,
        category,
        occurredAt: occurredAt ?? new Date().toISOString(),
        appVersion: APP_VERSION,
        wasOffline: typeof navigator !== "undefined" ? navigator.onLine === false : false,
        source: isStandaloneDisplayMode() ? "pwa" : "web",
        environment: APP_ENVIRONMENT,
      },
      eventId,
    )
    void syncAnalytics()
    void registerBackgroundSync()
  } catch {
    // Analytics must never break a calculator.
  }
}

async function registerBackgroundSync() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return

  try {
    const registration = await navigator.serviceWorker.ready
    if ("sync" in registration) {
      await (registration as ServiceWorkerRegistration & {
        sync: { register: (tag: string) => Promise<void> }
      }).sync.register("convertlab-analytics")
    }
  } catch {
    // Background Sync is optional; online/app-open sync remains the fallback.
  }
}
__CLINEXIA_EOF__

write_file lib/analytics/backfill.ts <<'__CLINEXIA_EOF__'
"use client"

import { getAllHistory } from "@/lib/history/db"
import { getAnonymousId } from "./client-id"
import { queueCalculationEvents } from "./outbox"
import { syncAnalytics } from "./sync"
import { isStandaloneDisplayMode } from "@/lib/platform"
import type { CalculationEvent } from "./types"

// v3: the original v2 backfill ran once, but the main calculator screen never reported
// to analytics, so everything calculated after that run (and before this fix) was
// missing from the dashboard. Running again is safe: event IDs are the history IDs and
// the server ignores IDs it already has, so nothing is double counted.
const BACKFILL_KEY = "convertlab:analytics-history-backfill:v3"
const BACKFILL_APP_VERSION = "2.0.0-history-backfill"
const APP_ENVIRONMENT = process.env.NEXT_PUBLIC_APP_ENV ?? "production"

function hasCompletedBackfill() {
  try {
    return window.localStorage.getItem(BACKFILL_KEY) === "1"
  } catch {
    return false
  }
}

function markBackfillComplete() {
  try {
    window.localStorage.setItem(BACKFILL_KEY, "1")
  } catch {
    // If storage is unavailable the backfill simply re-runs next launch, which is harmless.
  }
}

/**
 * Re-queues the user's whole local history once. Inputs/results are never included.
 */
export async function backfillExistingHistory(): Promise<number> {
  if (typeof window === "undefined" || !window.indexedDB) return 0
  if (hasCompletedBackfill()) return 0

  const history = await getAllHistory()
  if (!history.length) {
    markBackfillComplete()
    return 0
  }

  const anonymousId = getAnonymousId()
  const source = isStandaloneDisplayMode() ? "pwa" : "web"

  const events: CalculationEvent[] = history.map((item) => ({
    id: item.id,
    anonymousId,
    calculatorId: item.calculatorId,
    calculatorName: item.calculatorName,
    category: item.category,
    occurredAt: item.timestamp,
    appVersion: BACKFILL_APP_VERSION,
    wasOffline: false,
    source,
    environment: APP_ENVIRONMENT,
  }))

  // One transaction for the whole history, and only marked complete once it is safely queued.
  await queueCalculationEvents(events)
  markBackfillComplete()
  void syncAnalytics()
  return events.length
}
__CLINEXIA_EOF__

write_file lib/history/use-history.ts <<'__CLINEXIA_EOF__'
"use client"

import { useCallback, useEffect, useState } from "react"
import { addHistoryItem, clearHistory, deleteHistoryItem, getAllHistory, type HistoryItem } from "./db"
import { trackCalculation } from "@/lib/analytics/track-calculation"

export interface RecordOptions {
  /** Name sent to analytics when it should differ from the history label. */
  analyticsName?: string
}

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const all = await getAllHistory()
      setItems(all)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  /**
   * Saves a result to local history AND queues the matching analytics event.
   *
   * Every saved history entry produces exactly one analytics event that reuses the
   * history ID, so what a user sees on their device and what the admin console
   * counts cannot drift apart. If the local save fails (private mode, storage
   * full) the calculation is still reported, just without a history ID.
   */
  const record = useCallback(
    async (item: Omit<HistoryItem, "id" | "timestamp">, options?: RecordOptions) => {
      let saved: HistoryItem | null = null
      try {
        saved = await addHistoryItem(item)
      } finally {
        void trackCalculation({
          calculatorId: item.calculatorId,
          calculatorName: options?.analyticsName ?? item.calculatorName,
          category: item.category,
          eventId: saved?.id,
          occurredAt: saved?.timestamp,
        })
      }
      await refresh()
      return saved
    },
    [refresh],
  )

  const remove = useCallback(
    async (id: string) => {
      await deleteHistoryItem(id)
      await refresh()
    },
    [refresh],
  )

  const clear = useCallback(async () => {
    await clearHistory()
    await refresh()
  }, [refresh])

  return { items, loading, record, remove, clear, refresh }
}
__CLINEXIA_EOF__

write_file app/api/analytics/route.ts <<'__CLINEXIA_EOF__'
import { NextResponse } from "next/server"
import { parseEvents } from "@/lib/analytics/validate-events"

function config() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Analytics storage is not configured.")
  return { url: url.replace(/\/$/, ""), key }
}

/**
 * Response contract (the browser and the service worker both rely on it):
 *   accepted  - stored (or already stored). Safe to delete from the outbox.
 *   rejected  - permanently invalid. Also safe to delete; retrying can never work.
 * Anything in neither list stays queued and is retried. 5xx means "try again later".
 */
export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid analytics payload." }, { status: 400 })
  }

  const parsed = parseEvents(payload)
  if (!parsed) {
    return NextResponse.json({ error: "Invalid analytics payload." }, { status: 400 })
  }

  const { valid, rejected } = parsed
  if (!valid.length) return NextResponse.json({ accepted: [], rejected })

  try {
    const { url, key } = config()

    // `on_conflict=id` + ignore-duplicates makes every retry idempotent: the same
    // event ID can be re-sent any number of times and is only ever stored once.
    const response = await fetch(`${url}/rest/v1/calculation_events?on_conflict=id`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates,return=minimal",
      },
      body: JSON.stringify(
        valid.map((event) => ({
          id: event.id,
          anonymous_id: event.anonymousId,
          calculator_id: event.calculatorId,
          calculator_name: event.calculatorName,
          category: event.category,
          occurred_at: event.occurredAt,
          app_version: event.appVersion,
          was_offline: event.wasOffline,
          source: event.source,
          environment: event.environment,
        })),
      ),
    })

    if (!response.ok) {
      console.error("Clinexia analytics insert failed:", await response.text())
      return NextResponse.json({ error: "Unable to record analytics." }, { status: 502 })
    }

    // Keep the anonymous device directory current and attach the latest
    // calculation time to each device. The ID is never exposed as a real name.
    const latestByDevice = new Map<string, (typeof valid)[number]>()
    for (const event of valid) {
      const previous = latestByDevice.get(event.anonymousId)
      if (!previous || new Date(event.occurredAt).getTime() > new Date(previous.occurredAt).getTime()) {
        latestByDevice.set(event.anonymousId, event)
      }
    }

    // Best effort: the events are already stored, so a failed device touch must
    // never turn into a failed upload (which would make the browser re-send).
    await Promise.allSettled(
      Array.from(latestByDevice.values()).map(async (event) => {
        const deviceResponse = await fetch(`${url}/rest/v1/rpc/convertlab_touch_device`, {
          method: "POST",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            p_anonymous_id: event.anonymousId,
            p_last_seen_at: new Date().toISOString(),
            p_last_calculation_at: event.occurredAt,
            p_source: event.source,
            p_environment: event.environment,
            p_app_version: event.appVersion,
          }),
        })

        if (!deviceResponse.ok) {
          console.error("Clinexia device update failed:", await deviceResponse.text())
        }
      }),
    )

    return NextResponse.json({ accepted: valid.map((event) => event.id), rejected })
  } catch (error) {
    console.error("Clinexia analytics error:", error)
    return NextResponse.json({ error: "Unable to record analytics." }, { status: 500 })
  }
}
__CLINEXIA_EOF__

write_file components/analytics-sync.tsx <<'__CLINEXIA_EOF__'
"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { isLandingSite } from "@/lib/site"
import { syncAnalytics } from "@/lib/analytics/sync"
import { backfillExistingHistory } from "@/lib/analytics/backfill"
import { sendPresenceHeartbeat } from "@/lib/analytics/presence"

const PERIODIC_SYNC_MS = 5 * 60 * 1000

export function AnalyticsSync() {
  const pathname = usePathname()

  useEffect(() => {
    // Do not count landing-page visitors, or the demo frames embedded in it, as app users.
    if (pathname?.startsWith("/welcome") || isLandingSite() || window.self !== window.top) return

    const run = () => {
      void backfillExistingHistory()
        .catch(() => {})
        .finally(() => {
          void syncAnalytics()
        })
    }

    run()
    void sendPresenceHeartbeat()
    const heartbeat = window.setInterval(() => {
      void sendPresenceHeartbeat()
    }, 60_000)

    // Flush queued/offline analytics every few minutes while the app is open
    // (the sync itself schedules faster retries after a failure).
    const periodicSync = window.setInterval(() => {
      if (navigator.onLine !== false) void syncAnalytics()
    }, PERIODIC_SYNC_MS)

    // Connection came back: upload everything that was calculated offline.
    const handleOnline = () => {
      run()
      void sendPresenceHeartbeat()
    }

    // An installed app resumed from the background (or a restored tab): flush right away.
    const handleVisible = () => {
      if (document.visibilityState !== "visible" || navigator.onLine === false) return
      void syncAnalytics()
      void sendPresenceHeartbeat()
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("pageshow", handleVisible)
    document.addEventListener("visibilitychange", handleVisible)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("pageshow", handleVisible)
      document.removeEventListener("visibilitychange", handleVisible)
      window.clearInterval(heartbeat)
      window.clearInterval(periodicSync)
    }
  }, [pathname])

  return null
}
__CLINEXIA_EOF__

write_file supabase/analytics-fix-2026-10.sql <<'__CLINEXIA_EOF__'
-- Clinexia analytics fix (October 2026)
-- Run once in the Supabase SQL Editor. Safe to re-run.
--
-- What it changes
--   1. convertlab_usage_summary_v3 now reports a real 7-day figure. `thisWeek`
--      used to be a copy of `today`, so the dashboard had no number that could be
--      compared with the "this week" count a user sees on their own device.
--   2. Adds calculationsLast7Days per user, next to the existing 14-day figure.
--   3. Adds an index so the per-user counts stay fast as events grow.
--
-- No data is modified or deleted.

create index if not exists calculation_events_anonymous_occurred_idx
  on public.calculation_events (anonymous_id, occurred_at desc);

create or replace function public.convertlab_usage_summary_v3()
returns json
language sql
security definer
set search_path = public
as $$
  with bounds as (
    select (now() at time zone 'Africa/Lagos')::date as local_today
  ),
  totals as (
    select
      count(*)::int as total,
      count(*) filter (where occurred_at >= ((select local_today from bounds)::timestamp at time zone 'Africa/Lagos'))::int as today,
      count(*) filter (where occurred_at >= (((select local_today from bounds) - 6)::timestamp at time zone 'Africa/Lagos'))::int as last_7_days,
      count(*) filter (where occurred_at >= (((select local_today from bounds) - 13)::timestamp at time zone 'Africa/Lagos'))::int as last_14_days,
      count(*) filter (where was_offline = true)::int as offline_synced,
      count(*) filter (where app_version = '2.0.0-history-backfill')::int as history_backfilled
    from public.calculation_events
  ),
  users as (
    select
      count(*)::int as total_users,
      count(*) filter (where last_seen_at >= ((select local_today from bounds)::timestamp at time zone 'Africa/Lagos'))::int as users_today,
      count(*) filter (where last_seen_at >= (((select local_today from bounds) - 13)::timestamp at time zone 'Africa/Lagos'))::int as users_last_14_days,
      count(*) filter (
        where greatest(
          last_seen_at,
          coalesce(last_calculation_at, '-infinity'::timestamptz)
        ) >= now() - interval '5 minutes'
      )::int as active_users
    from public.convertlab_devices
  ),
  active_users as (
    select coalesce(json_agg(row_to_json(x) order by x."lastSeenAt" desc), '[]'::json)
    from (
      select
        d.anonymous_id as "anonymousId",
        d.display_name as "displayName",
        d.source,
        d.environment,
        d.app_version as "appVersion",
        d.first_seen_at as "firstSeenAt",
        d.last_seen_at as "lastSeenAt",
        d.last_calculation_at as "lastCalculationAt",
        count(e.id) filter (
          where e.occurred_at >= ((select local_today from bounds)::timestamp at time zone 'Africa/Lagos')
        )::int as "calculationsToday",
        count(e.id) filter (
          where e.occurred_at >= (((select local_today from bounds) - 6)::timestamp at time zone 'Africa/Lagos')
        )::int as "calculationsLast7Days",
        count(e.id) filter (
          where e.occurred_at >= (((select local_today from bounds) - 13)::timestamp at time zone 'Africa/Lagos')
        )::int as "calculationsLast14Days",
        count(e.id)::int as "totalCalculations",
        (array_agg(e.calculator_name order by e.occurred_at desc)
          filter (where e.id is not null))[1] as "lastCalculatorName"
      from public.convertlab_devices d
      left join public.calculation_events e on e.anonymous_id = d.anonymous_id
      where greatest(
        d.last_seen_at,
        coalesce(d.last_calculation_at, '-infinity'::timestamptz)
      ) >= now() - interval '5 minutes'
      group by d.anonymous_id, d.display_name, d.source, d.environment, d.app_version,
               d.first_seen_at, d.last_seen_at, d.last_calculation_at
      order by d.last_seen_at desc
      limit 100
    ) x
  ),
  all_users as (
    select coalesce(json_agg(row_to_json(x) order by x."lastSeenAt" desc), '[]'::json)
    from (
      select
        d.anonymous_id as "anonymousId",
        d.display_name as "displayName",
        d.source,
        d.environment,
        d.app_version as "appVersion",
        d.first_seen_at as "firstSeenAt",
        d.last_seen_at as "lastSeenAt",
        latest.last_calculation_at as "lastCalculationAt",
        latest.calculator_name as "lastCalculatorName",
        count(e.id) filter (where e.occurred_at >= ((select local_today from bounds)::timestamp at time zone 'Africa/Lagos'))::int as "calculationsToday",
        count(e.id) filter (where e.occurred_at >= (((select local_today from bounds) - 6)::timestamp at time zone 'Africa/Lagos'))::int as "calculationsLast7Days",
        count(e.id) filter (where e.occurred_at >= (((select local_today from bounds) - 13)::timestamp at time zone 'Africa/Lagos'))::int as "calculationsLast14Days",
        count(e.id)::int as "totalCalculations"
      from public.convertlab_devices d
      left join public.calculation_events e on e.anonymous_id = d.anonymous_id
      left join lateral (
        select
          ce.occurred_at as last_calculation_at,
          ce.calculator_name
        from public.calculation_events ce
        where ce.anonymous_id = d.anonymous_id
        order by ce.occurred_at desc, ce.received_at desc
        limit 1
      ) latest on true
      group by d.anonymous_id, d.display_name, d.source, d.environment, d.app_version,
               d.first_seen_at, d.last_seen_at, latest.last_calculation_at, latest.calculator_name
    ) x
  ),
  top_calculators as (
    select coalesce(json_agg(row_to_json(x) order by x.uses desc), '[]'::json)
    from (
      select calculator_id as "calculatorId", max(calculator_name) as "calculatorName", count(*)::int as uses
      from public.calculation_events
      group by calculator_id
      order by count(*) desc
      limit 10
    ) x
  ),
  categories as (
    select coalesce(json_agg(row_to_json(x) order by x.uses desc), '[]'::json)
    from (
      select category, count(*)::int as uses
      from public.calculation_events
      group by category
      order by count(*) desc
    ) x
  ),
  sources as (
    select coalesce(json_agg(row_to_json(x) order by x.uses desc), '[]'::json)
    from (
      select source, count(*)::int as uses
      from public.calculation_events
      group by source
      order by count(*) desc
    ) x
  ),
  environments as (
    select coalesce(json_agg(row_to_json(x) order by x.uses desc), '[]'::json)
    from (
      select environment, count(*)::int as uses
      from public.calculation_events
      group by environment
      order by count(*) desc
    ) x
  ),
  versions as (
    select coalesce(json_agg(row_to_json(x) order by x.uses desc), '[]'::json)
    from (
      select app_version as "appVersion", count(*)::int as uses
      from public.calculation_events
      group by app_version
      order by count(*) desc
    ) x
  ),
  daily as (
    select coalesce(json_agg(row_to_json(x) order by x.date), '[]'::json)
    from (
      select to_char(d.day::date, 'YYYY-MM-DD') as date,
             count(e.id)::int as uses
      from generate_series(
        (select local_today from bounds) - 13,
        (select local_today from bounds),
        interval '1 day'
      ) d(day)
      left join public.calculation_events e
        on e.occurred_at >= (d.day::date::timestamp at time zone 'Africa/Lagos')
       and e.occurred_at < ((d.day::date + 1)::timestamp at time zone 'Africa/Lagos')
      group by d.day
      order by d.day
    ) x
  ),
  last_event as (
    select row_to_json(x) as event
    from (
      select calculator_name as "calculatorName",
             source,
             environment,
             app_version as "appVersion",
             received_at as "receivedAt"
      from public.calculation_events
      order by received_at desc
      limit 1
    ) x
  )
  select json_build_object(
    'total', totals.total,
    'today', totals.today,
    'last14Days', totals.last_14_days,
    'thisWeek', totals.last_7_days,
    'last7Days', totals.last_7_days,
    'offlineSynced', totals.offline_synced,
    'historyBackfilled', totals.history_backfilled,
    'activeUsers', users.active_users,
    'uniqueUsersToday', users.users_today,
    'uniqueUsersLast14Days', users.users_last_14_days,
    'totalUsers', users.total_users,
    'activeUsersList', (select * from active_users),
    'allUsersList', (select * from all_users),
    'topCalculators', (select * from top_calculators),
    'categories', (select * from categories),
    'sources', (select * from sources),
    'environments', (select * from environments),
    'versions', (select * from versions),
    'daily', (select * from daily),
    'lastEvent', (select event from last_event)
  )
  from totals, users;
$$;

revoke all on function public.convertlab_usage_summary_v3() from public;
grant execute on function public.convertlab_usage_summary_v3() to service_role;
notify pgrst, 'reload schema';


-- ---------------------------------------------------------------------------
-- Optional diagnostics (read only). Compare these with what a user's own
-- device shows to confirm the gap has closed after they next open the app.
-- Windows use Africa/Lagos calendar days, the same as the dashboard.
--
-- Per-device calculations over the last 7 and 14 days:
--
-- select d.display_name,
--        count(e.id) filter (where e.occurred_at >= ((((now() at time zone 'Africa/Lagos')::date - 6))::timestamp at time zone 'Africa/Lagos'))  as last_7_days,
--        count(e.id) filter (where e.occurred_at >= ((((now() at time zone 'Africa/Lagos')::date - 13))::timestamp at time zone 'Africa/Lagos')) as last_14_days,
--        count(e.id) filter (where e.was_offline) as synced_from_offline,
--        count(e.id) filter (where e.app_version = '2.0.0-history-backfill') as recovered_from_history
-- from public.convertlab_devices d
-- left join public.calculation_events e on e.anonymous_id = d.anonymous_id
-- group by d.display_name
-- order by last_14_days desc;
__CLINEXIA_EOF__


# ---- 5. Apply the small edits to existing files ---------------------------------------
say "Patching existing files..."
node "$PATCH_FILE"

APPLIED=1

# Keep the backups out of git.
if [ -f .gitignore ] && ! grep -qx '.clinexia-fix-backup/' .gitignore; then
  printf '\n# Clinexia analytics fix backups\n.clinexia-fix-backup/\n' >> .gitignore
fi

# ---- 6. Optional: apply the database migration if a connection string is provided -----
DB_APPLIED=0
if [ -n "${SUPABASE_DB_URL:-}" ] && command -v psql >/dev/null 2>&1; then
  say "Applying supabase/analytics-fix-2026-10.sql via psql..."
  if psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -f supabase/analytics-fix-2026-10.sql; then
    DB_APPLIED=1
  else
    warn "The SQL did not apply. Run supabase/analytics-fix-2026-10.sql in the Supabase SQL Editor instead."
  fi
fi

# ---- 7. Verify (same checks CI runs, minus the slow build) -----------------------------
if [ "$SKIP_VERIFY" -eq 0 ] && command -v pnpm >/dev/null 2>&1 && [ -d node_modules ]; then
  say "Running typecheck and tests..."
  if pnpm typecheck && pnpm test; then
    say "Typecheck and tests passed."
  else
    warn "Typecheck/tests reported problems. Your originals are in $BACKUP_DIR (copy them back to undo)."
  fi
else
  warn "Skipped typecheck/tests (pnpm or node_modules not found, or --skip-verify). Please run: pnpm verify"
fi

say "Done."
echo
echo "Next steps"
if [ "$DB_APPLIED" -eq 0 ]; then
  echo "  1. Open the Supabase SQL Editor and run:  supabase/analytics-fix-2026-10.sql   (once; safe to re-run)"
else
  echo "  1. Database migration already applied."
fi
echo "  2. Deploy the web app. The service worker updates itself; users get the fix the next time they open Clinexia"
echo "     with a connection. Each device then re-sends its local history once, which fills the past gaps."
echo "  3. Watch the dashboard: 'Calculations - 7 days' and the per-user '7 days' column now line up with the"
echo "     'this week' figure on each user's own device (allow a few minutes after they reconnect)."
echo
echo "Undo: copy the files in $BACKUP_DIR back over the repo (and delete lib/analytics/validate-events*.ts)."
