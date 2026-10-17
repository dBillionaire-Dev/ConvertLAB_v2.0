// Subscription time rules. Status is DERIVED from stored dates at read time, so an unpaid subscription expires on its own
// without a scheduled job.
export type StoredStatus = "pending" | "active" | "past_due" | "cancelled" | "expired"
export type EffectiveStatus = "pending" | "active" | "grace" | "expired"

export interface SubscriptionTiming {
  status: StoredStatus
  currentPeriodEnd: string | null
}

const DAY = 86_400_000

/**
 * - pending: never paid, no access.
 * - cancelled: access until the paid period ends, no grace afterwards.
 * - active / past_due: access until the period ends, then `graceDays` of grace, then expired.
 */
export function effectiveStatus(sub: SubscriptionTiming, now: number, graceDays: number): EffectiveStatus {
  if (sub.status === "pending") return "pending"
  if (sub.status === "expired") return "expired"
  const end = sub.currentPeriodEnd ? Date.parse(sub.currentPeriodEnd) : NaN
  if (!Number.isFinite(end)) return "expired"
  if (now <= end) return "active"
  if (sub.status !== "cancelled" && now <= end + graceDays * DAY) return "grace"
  return "expired"
}

export const grantsAccess = (s: EffectiveStatus) => s === "active" || s === "grace"

/** Adds calendar months in UTC, clamping to the end of a short month (31 Jan + 1 month = 28/29 Feb). Mirrors Postgres. */
export function addMonthsUtc(from: number, months: number): number {
  const d = new Date(from)
  const day = d.getUTCDate()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + months)
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(day, last))
  return d.getTime()
}

/**
 * Policy (no proration): paying for the SAME plan extends from the later of now and the current end. Paying for a
 * DIFFERENT plan starts a fresh period from now, and unused time on the old plan is not credited. The checkout screen must
 * say so. Mirrors billing_apply_paid_order in supabase/billing.sql.
 */
export function nextPeriodEnd(input: { currentPeriodEnd: string | null; now: number; months: number; sameTarget: boolean }): number {
  const end = input.currentPeriodEnd ? Date.parse(input.currentPeriodEnd) : NaN
  const from = input.sameTarget && Number.isFinite(end) ? Math.max(end, input.now) : input.now
  return addMonthsUtc(from, input.months)
}
