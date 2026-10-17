// When to ask, and when to stop. Pure rules (no storage, no clock of their own) so they can be tested.
// Same spirit as the install prompt: ask once engaged, "Later" comes back after a while, and once the person has
// answered (or said "don't ask again") it never returns, unless the admin starts a new round (a new survey version).

export interface FeedbackConfig {
  enabled: boolean
  version: number
  remindAfterHours: number
  maxReminders: number
}

export const DEFAULT_CONFIG: FeedbackConfig = {
  enabled: false,
  version: 1,
  remindAfterHours: 8,
  maxReminders: 50,
}

export const HOUR_MS = 3_600_000

export interface FeedbackState {
  /** The survey round this state belongs to. A different round starts fresh. */
  version: number
  doneAt: number | null
  stoppedAt: number | null
  laterCount: number
  /** Do not show before this time (ms). */
  nextAt: number
  /** Distinct local days the app was opened (most recent 14), used as a sign of real use. */
  visitDays: string[]
}

export const DAY_MS = 86_400_000
/** People get to use the app for a minute before anything is asked. */
export const MIN_PAGE_AGE_MS = 60_000
export const MIN_CALCULATIONS = 3
export const MIN_VISIT_DAYS = 3

export const freshState = (version: number): FeedbackState => ({ version, doneAt: null, stoppedAt: null, laterCount: 0, nextAt: 0, visitDays: [] })

/** Keeps what was saved, unless the admin started a new round, in which case answers and snoozes are forgotten. */
export function normalizeState(raw: unknown, config: Pick<FeedbackConfig, "version">): FeedbackState {
  const base = freshState(config.version)
  if (!raw || typeof raw !== "object") return base
  const s = raw as Partial<FeedbackState>
  const visitDays = Array.isArray(s.visitDays) ? s.visitDays.filter((d): d is string => typeof d === "string").slice(-14) : []
  if (s.version !== config.version) return { ...base, visitDays } // new round: ask again, but keep the visit history
  return {
    version: config.version,
    doneAt: typeof s.doneAt === "number" ? s.doneAt : null,
    stoppedAt: typeof s.stoppedAt === "number" ? s.stoppedAt : null,
    laterCount: typeof s.laterCount === "number" && s.laterCount >= 0 ? Math.floor(s.laterCount) : 0,
    nextAt: typeof s.nextAt === "number" ? s.nextAt : 0,
    visitDays,
  }
}

export function recordVisit(state: FeedbackState, day: string): FeedbackState {
  if (state.visitDays.includes(day)) return state
  return { ...state, visitDays: [...state.visitDays, day].slice(-14) }
}

export function isEngaged(input: { calculations: number | null; visitDays: number }): boolean {
  return (input.calculations ?? 0) >= MIN_CALCULATIONS || input.visitDays >= MIN_VISIT_DAYS
}

export interface PromptContext {
  config: FeedbackConfig
  state: FeedbackState
  now: number
  engaged: boolean
  online: boolean
  pageAgeMs: number
  onExcludedRoute: boolean
}

export function decidePrompt(c: PromptContext): { show: boolean; reason: string } {
  if (!c.config.enabled) return { show: false, reason: "paused" }
  if (c.state.doneAt) return { show: false, reason: "already answered" }
  if (c.state.stoppedAt) return { show: false, reason: "asked not to be asked again" }
  if (c.onExcludedRoute) return { show: false, reason: "not on this page" }
  if (!c.online) return { show: false, reason: "offline" }
  if (c.now < c.state.nextAt) return { show: false, reason: "snoozed" }
  if (!c.engaged) return { show: false, reason: "not used enough yet" }
  if (c.pageAgeMs < MIN_PAGE_AGE_MS) return { show: false, reason: "just opened" }
  return { show: true, reason: "ok" }
}

/** "Later": hide, come back after the configured days, and stop for good after the maximum number of reminders. */
/** "Later": hide, come back after the configured hours, and stop after the maximum reminders. */
export function snooze(
  state: FeedbackState,
  config: FeedbackConfig,
  now: number,
): FeedbackState {
  const laterCount = state.laterCount + 1

  if (laterCount >= Math.max(1, config.maxReminders)) {
    return { ...state, laterCount, stoppedAt: now }
  }

  return {
    ...state,
    laterCount,
    nextAt: now + config.remindAfterHours * HOUR_MS,
  }
}

/** A short pause that does not count as "Later" (used when someone starts the form but has not finished). */
/** A short pause that does not count as "Later". */
export function pauseForHours(
  state: FeedbackState,
  now: number,
  hours: number,
): FeedbackState {
  return {
    ...state,
    nextAt: Math.max(state.nextAt, now + hours * HOUR_MS),
  }
}

export const markDone = (state: FeedbackState, now: number): FeedbackState => ({ ...state, doneAt: now })
export const stopAsking = (state: FeedbackState, now: number): FeedbackState => ({ ...state, stoppedAt: now })

export function excludedRoute(pathname: string): boolean {
  return ["/admin", "/feedback", "/diagnostics", "/welcome"].some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/** Reads the config the server sends, rejecting anything odd. */
export function parseConfig(raw: unknown): FeedbackConfig | null {
  if (!raw || typeof raw !== "object") return null

  const c = raw as Record<string, unknown>
  const version = Number(c.version)
  // An older server sent days; convert so a cached or older response still works.
  const remindAfterHours = c.remindAfterHours !== undefined ? Number(c.remindAfterHours) : Number(c.remindAfterDays) * 24
  const maxReminders = Number(c.maxReminders)

  if (![version, remindAfterHours, maxReminders].every(Number.isFinite)) {
    return null
  }

  return {
    enabled: c.enabled === true,
    version: Math.max(1, Math.floor(version)),
    remindAfterHours: Math.min(8760, Math.max(1, Math.floor(remindAfterHours))),
    maxReminders: Math.min(50, Math.max(0, Math.floor(maxReminders))),
  }
}
