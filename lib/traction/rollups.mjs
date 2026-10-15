// Pure rollup calculations. No I/O, so they can be unit-tested and re-run safely.
//
// Definitions (also shown in the admin "Data coverage" panel):
//  - Active user on a day: a distinct anonymous id with >=1 production calculation OR >=1 heartbeat that day.
//  - New user: the id's first active day in all stored data (any platform).
//  - Returning user: active that day but first seen on an earlier day.
//  - Session: first heartbeat of the day, or one >30 min after the previous. Null before heartbeats were stored.
//  - Tool use: one production calculation event.
import { addDays } from "./dates.mjs"

export const PLATFORMS = ["web", "pwa", "android", "windows"]

/**
 * @typedef {{ day: string, anonymousId: string, platform: string }} ActivityRow
 * @typedef {{ day: string, anonymousId: string, platform: string, sessions: number }} VisitorDayRow
 */

/**
 * @param {{ activity: ActivityRow[], visitorDays?: VisitorDayRow[], toolEvents: { day: string, platform: string }[] }} input
 * @returns {{ date: string, platform: string, active_users: number, new_users: number, returning_users: number, sessions: number|null, tool_uses: number }[]}
 */
export function computeDailyRollups({ activity, visitorDays = [], toolEvents }) {
  const firstDay = new Map()
  for (const row of activity) {
    const seen = firstDay.get(row.anonymousId)
    if (seen === undefined || row.day < seen) firstDay.set(row.anonymousId, row.day)
  }

  const sessionsStart = visitorDays.length ? visitorDays.reduce((min, r) => (r.day < min ? r.day : min), visitorDays[0].day) : null

  /** key = `${date}|${platform}` */
  const buckets = new Map()
  const bucket = (date, platform) => {
    const key = `${date}|${platform}`
    let b = buckets.get(key)
    if (!b) {
      b = { date, platform, users: new Set(), newUsers: new Set(), sessions: 0, toolUses: 0 }
      buckets.set(key, b)
    }
    return b
  }

  for (const row of activity) {
    const isNew = firstDay.get(row.anonymousId) === row.day
    for (const platform of ["all", row.platform]) {
      const b = bucket(row.day, platform)
      b.users.add(row.anonymousId)
      if (isNew) b.newUsers.add(row.anonymousId)
    }
  }
  for (const row of visitorDays) {
    for (const platform of ["all", row.platform]) bucket(row.day, platform).sessions += row.sessions
  }
  for (const e of toolEvents) {
    for (const platform of ["all", e.platform]) bucket(e.day, platform).toolUses += 1
  }

  return [...buckets.values()]
    .map((b) => ({
      date: b.date,
      platform: b.platform,
      active_users: b.users.size,
      new_users: b.newUsers.size,
      returning_users: b.users.size - b.newUsers.size,
      sessions: sessionsStart !== null && b.date >= sessionsStart ? b.sessions : null,
      tool_uses: b.toolUses,
    }))
    .sort((a, b) => (a.date === b.date ? a.platform.localeCompare(b.platform) : a.date.localeCompare(b.date)))
}

/** @param {{ day: string, toolId: string, toolName?: string|null }[]} events */
export function computeToolUsage(events) {
  const map = new Map()
  for (const e of events) {
    const key = `${e.day}|${e.toolId}`
    const cur = map.get(key)
    if (cur) cur.uses += 1
    else map.set(key, { date: e.day, tool_id: e.toolId, tool_name: e.toolName ?? null, uses: 1 })
  }
  return [...map.values()].sort((a, b) => (a.date === b.date ? a.tool_id.localeCompare(b.tool_id) : a.date.localeCompare(b.date)))
}

/** Distinct users active in the inclusive window ending on `today`. */
export function computeActiveWindows(activity, today) {
  const count = (days) => {
    const from = addDays(today, -(days - 1))
    const ids = new Set()
    for (const r of activity) if (r.day >= from && r.day <= today) ids.add(r.anonymousId)
    return ids.size
  }
  return { dau: count(1), wau: count(7), mau: count(30) }
}

/**
 * Day-N retention: of users whose first active day is F (F + N <= today), the share active exactly on F + N.
 * Optional cohort window [sinceDay, ...]. Rate is null when no cohort has matured.
 * @param {{ day: string, anonymousId: string }[]} activity
 * @param {string} today
 * @param {number[]} [offsets]
 * @param {string|null} [sinceDay]
 * @returns {Record<string, { cohort: number, retained: number, rate: number|null }>}
 */
export function computeRetention(activity, today, offsets = [1, 7, 30], sinceDay = null) {
  const byUser = new Map()
  for (const r of activity) {
    let set = byUser.get(r.anonymousId)
    if (!set) byUser.set(r.anonymousId, (set = new Set()))
    set.add(r.day)
  }
  const result = {}
  for (const n of offsets) {
    let cohort = 0
    let retained = 0
    for (const days of byUser.values()) {
      const first = [...days].reduce((m, d) => (d < m ? d : m))
      if (sinceDay && first < sinceDay) continue
      if (addDays(first, n) > today) continue
      cohort += 1
      if (days.has(addDays(first, n))) retained += 1
    }
    result[`d${n}`] = { cohort, retained, rate: cohort ? retained / cohort : null }
  }
  return result
}

/**
 * Returning-user %: of the distinct users active in [from, to], the share who have been
 * seen on 2+ different days (ever, in stored data). Null when nobody was active.
 */
export function computeReturningPercent(activity, from, to) {
  const daysByUser = new Map()
  for (const r of activity) {
    let set = daysByUser.get(r.anonymousId)
    if (!set) daysByUser.set(r.anonymousId, (set = new Set()))
    set.add(r.day)
  }
  const inWindow = new Set()
  for (const r of activity) if (r.day >= from && r.day <= to) inWindow.add(r.anonymousId)
  if (!inWindow.size) return null
  let returning = 0
  for (const id of inWindow) if (daysByUser.get(id).size >= 2) returning += 1
  return returning / inWindow.size
}
