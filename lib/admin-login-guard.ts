import { createHash, timingSafeEqual } from "node:crypto"

/** Constant-time password comparison (hashes first so lengths never leak). */
export function passwordsMatch(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided).digest()
  const b = createHash("sha256").update(expected).digest()
  return timingSafeEqual(a, b)
}

// Best-effort in-memory throttle: 5 failures per 15 minutes per client. Serverless instances do not share
// memory, so this slows casual guessing rather than guaranteeing a limit; keep ADMIN_PASSWORD long.
// The client key is held only in memory for the window and is never written to storage or logs.
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES = 5
const failures = new Map<string, number[]>()

export function isLoginBlocked(clientKey: string, now = Date.now()): boolean {
  const recent = (failures.get(clientKey) ?? []).filter((t) => now - t < WINDOW_MS)
  failures.set(clientKey, recent)
  return recent.length >= MAX_FAILURES
}

export function recordLoginFailure(clientKey: string, now = Date.now()): void {
  failures.set(clientKey, [...(failures.get(clientKey) ?? []).filter((t) => now - t < WINDOW_MS), now])
}

export function clearLoginFailures(clientKey: string): void {
  failures.delete(clientKey)
}
