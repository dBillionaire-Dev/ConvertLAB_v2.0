import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { PRICE_INDIVIDUAL, TEXT_LIMIT, validateAnswers, type FeedbackAnswers } from "./questions"
import {
  DAY_MS,
  DEFAULT_CONFIG,
  HOUR_MS,
  MIN_PAGE_AGE_MS,
  decidePrompt,
  excludedRoute,
  freshState,
  isEngaged,
  markDone,
  normalizeState,
  pauseForHours,
  recordVisit,
  snooze,
  stopAsking,
  type FeedbackConfig,
  type PromptContext,
} from "./schedule"
import { summarize, type FeedbackRow } from "./summary"

const valid = {
  rating: 5,
  background: "medical",
  role: "laboratory",
  devices: ["phone_browser"],
  context: "office",
  officeType: "laboratory",
  payInterest: "yes",
  payWho: "workplace",
  priceIndividual: "3.5_5",
  priceTeam: "35_50",
  improve: " faster loading ",
}

describe("validateAnswers", () => {
  it("accepts a complete answer and tidies the text", () => {
    const r = validateAnswers(valid)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.improve).toBe("faster loading")
  })
  it("needs a 1-5 rating", () => {
    for (const rating of [0, 6, 2.5, "x", undefined]) expect(validateAnswers({ ...valid, rating }).ok).toBe(false)
  })
  it("role must belong to the chosen background", () => {
    expect(validateAnswers({ ...valid, background: "non_medical", role: "laboratory" }).ok).toBe(false)
    expect(validateAnswers({ ...valid, background: "non_medical", role: "student" }).ok).toBe(true)
  })
  it("asks for the workplace kind only when it is work use, and drops it for personal use", () => {
    expect(validateAnswers({ ...valid, officeType: undefined }).ok).toBe(false)
    const personal = validateAnswers({ ...valid, context: "personal", officeType: "hospital" })
    expect(personal.ok && personal.value.officeType).toBeFalsy()
  })
  it("asks for a price only when someone would (maybe) pay, and drops prices for 'no'", () => {
    expect(validateAnswers({ ...valid, priceIndividual: undefined }).ok).toBe(false)
    const no = validateAnswers({ ...valid, payInterest: "no", priceIndividual: undefined })
    expect(no.ok).toBe(true)
    const noWithPrice = validateAnswers({ ...valid, payInterest: "no" })
    expect(noWithPrice.ok && noWithPrice.value.priceIndividual).toBeFalsy()
  })
  it("rejects values that are not on the lists, and needs at least one known device", () => {
    expect(validateAnswers({ ...valid, devices: ["fax_machine"] }).ok).toBe(false)
    expect(validateAnswers({ ...valid, payInterest: "sure" }).ok).toBe(false)
    expect(validateAnswers({ ...valid, devices: ["phone_browser", "bogus", "phone_browser"] })).toMatchObject({ ok: true, value: { devices: ["phone_browser"] } })
  })
  it("limits and cleans free text, and treats blank as nothing", () => {
    const r = validateAnswers({ ...valid, improve: "a".repeat(5000), missing: "   ", other: "x\u0000y" })
    expect(r.ok && r.value.improve?.length).toBe(TEXT_LIMIT)
    expect(r.ok && r.value.missing).toBeUndefined()
    expect(r.ok && r.value.other).toBe("xy")
  })
  it("rejects non-objects", () => {
    expect(validateAnswers(null).ok).toBe(false)
    expect(validateAnswers("hi").ok).toBe(false)
  })
})

const config: FeedbackConfig = { enabled: true, version: 1, remindAfterHours: 7, maxReminders: 3 }
const NOW = 1_800_000_000_000
const ctx = (over: Partial<PromptContext> = {}): PromptContext => ({
  config,
  state: freshState(1),
  now: NOW,
  engaged: true,
  online: true,
  pageAgeMs: MIN_PAGE_AGE_MS + 1,
  onExcludedRoute: false,
  ...over,
})

describe("when the popup shows", () => {
  it("shows to an engaged, online person after the first minute", () => {
    expect(decidePrompt(ctx()).show).toBe(true)
  })
  it("stays away until the app has been used", () => {
    expect(decidePrompt(ctx({ engaged: false })).show).toBe(false)
    expect(isEngaged({ calculations: 3, visitDays: 0 })).toBe(true)
    expect(isEngaged({ calculations: 2, visitDays: 2 })).toBe(false)
    expect(isEngaged({ calculations: null, visitDays: 3 })).toBe(true)
  })
  it("waits for the first minute, and for a connection, and for normal pages", () => {
    expect(decidePrompt(ctx({ pageAgeMs: 5000 })).show).toBe(false)
    expect(decidePrompt(ctx({ online: false })).show).toBe(false)
    expect(decidePrompt(ctx({ onExcludedRoute: true })).show).toBe(false)
    for (const p of ["/admin", "/admin/feedback", "/feedback", "/diagnostics", "/welcome"]) expect(excludedRoute(p)).toBe(true)
    expect(excludedRoute("/calculators/renal")).toBe(false)
    expect(excludedRoute("/feedbacks-are-fun")).toBe(false)
  })
  it("is off while paused", () => {
    expect(decidePrompt(ctx({ config: { ...config, enabled: false } })).show).toBe(false)
    expect(DEFAULT_CONFIG.enabled).toBe(false)
  })
})

describe("later, done and never again", () => {
  it("Later hides it and brings it back after the configured hours", () => {
    const later = snooze(freshState(1), config, NOW)
    expect(decidePrompt(ctx({ state: later })).show).toBe(false)
    expect(decidePrompt(ctx({ state: later, now: NOW + 6 * HOUR_MS })).show).toBe(false)
    expect(decidePrompt(ctx({ state: later, now: NOW + 7 * HOUR_MS })).show).toBe(true)
  })
  it("stops for good after the maximum number of Laters", () => {
    let s = freshState(1)
    for (let i = 0; i < 3; i++) s = snooze(s, config, NOW + i * 10 * DAY_MS)
    expect(s.stoppedAt).not.toBeNull()
    expect(decidePrompt(ctx({ state: s, now: NOW + 100 * DAY_MS })).show).toBe(false)
  })
  it("never returns once answered or once the person says stop", () => {
    expect(decidePrompt(ctx({ state: markDone(freshState(1), NOW), now: NOW + 365 * DAY_MS })).show).toBe(false)
    expect(decidePrompt(ctx({ state: stopAsking(freshState(1), NOW), now: NOW + 365 * DAY_MS })).show).toBe(false)
  })
  it("a short pause after starting the form does not use up a reminder", () => {
    const paused = pauseForHours(freshState(1), NOW, 1)
    expect(paused.laterCount).toBe(0)
    expect(decidePrompt(ctx({ state: paused, now: NOW + DAY_MS })).show).toBe(true)
  })
  it("a new round (higher version) asks everyone again but keeps their visit history", () => {
    const answered = recordVisit(markDone(freshState(1), NOW), "2026-10-01")
    const next = normalizeState(answered, { version: 2 })
    expect(next).toMatchObject({ version: 2, doneAt: null, stoppedAt: null, laterCount: 0, visitDays: ["2026-10-01"] })
    expect(decidePrompt(ctx({ config: { ...config, version: 2 }, state: next })).show).toBe(true)
  })
  it("repairs damaged saved state", () => {
    expect(normalizeState("junk", config)).toEqual(freshState(1))
    expect(normalizeState({ version: 1, laterCount: -4, nextAt: "x", visitDays: [1, "2026-01-01"] }, config)).toMatchObject({ laterCount: 0, nextAt: 0, visitDays: ["2026-01-01"] })
  })
  it("records each visit day once and keeps the latest 14", () => {
    let s = freshState(1)
    for (let d = 1; d <= 20; d++) s = recordVisit(recordVisit(s, `2026-01-${String(d).padStart(2, "0")}`), `2026-01-${String(d).padStart(2, "0")}`)
    expect(s.visitDays).toHaveLength(14)
    expect(s.visitDays[13]).toBe("2026-01-20")
  })
})

const row = (over: Partial<FeedbackRow>): FeedbackRow => ({
  rating: 5, background: "medical", role: "laboratory", devices: ["phone_browser"], use_context: "office", office_type: "laboratory",
  pay_interest: "yes", pay_who: "workplace", price_individual: "3.5_5", price_team: "35_50", ...over,
})

describe("summary", () => {
  const rows = [
    row({}),
    row({ rating: 3, background: "non_medical", role: "student", use_context: "personal", office_type: null, devices: ["android_app", "phone_browser"], pay_interest: "no", price_individual: null, price_team: null }),
    row({ rating: 4, pay_interest: "maybe", price_individual: "1.5_3", price_team: null }),
  ]
  const s = summarize(rows)
  it("averages the rating and tallies stars", () => {
    expect(s.count).toBe(3)
    expect(s.averageRating).toBeCloseTo(4)
    expect(s.ratings.find((r) => r.stars === 5)?.count).toBe(1)
  })
  it("tallies segments, with multi-choice devices counted per choice", () => {
    expect(s.background.find((b) => b.value === "medical")?.count).toBe(2)
    expect(s.devices.find((d) => d.value === "phone_browser")?.count).toBe(3)
    expect(s.officeTypes.find((o) => o.value === "laboratory")?.count).toBe(2)
  })
  it("counts willingness to pay and estimates price from band midpoints among those who would pay", () => {
    expect(s.willingShare).toBeCloseTo(2 / 3)
    expect(s.individualAverageUsd).toBeCloseTo((5000 + 2500) / 2)
    expect(s.teamAverageUsd).toBeCloseTo(45000)
  })
  it("handles no data", () => {
    const empty = summarize([])
    expect(empty.averageRating).toBeNull()
    expect(empty.willingShare).toBeNull()
    expect(empty.individualAverageUsd).toBeNull()
  })
  it("every price band has a value the form can submit", () => {
    expect(PRICE_INDIVIDUAL.map((p) => p.value)).toContain("3.5_5")
  })
})

describe("wiring", () => {
  it("the SQL allows exactly the values the form can send", () => {
    const sql = readFileSync("supabase/feedback.sql", "utf8")
    for (const v of ["medical", "non_medical", "personal", "office", "both", "yes", "maybe", "no"]) expect(sql).toContain(`'${v}'`)
  })
})

import { allowSubmission } from "./rate-limit"
import { toRow, validateSubmission } from "./submission"

describe("submission", () => {
  const body = { anonymousId: "abc", surveyVersion: 2, platform: "pwa", appVersion: "2.0.0", environment: "production", website: "", answers: valid }
  it("accepts a good submission and shapes the database row", () => {
    const r = validateSubmission(body)
    expect(r.ok).toBe(true)
    if (r.ok) {
      const row = toRow(r.value)
      expect(row).toMatchObject({ survey_version: 2, anonymous_id: "abc", platform: "pwa", rating: 5, use_context: "office", price_individual: "3.5_5" })
      expect(Object.keys(row)).not.toContain("ip")
    }
  })
  it("refuses bots (filled hidden field), missing ids and bad versions", () => {
    expect(validateSubmission({ ...body, website: "http://spam" }).ok).toBe(false)
    expect(validateSubmission({ ...body, anonymousId: "" }).ok).toBe(false)
    expect(validateSubmission({ ...body, surveyVersion: 0 }).ok).toBe(false)
    expect(validateSubmission({ ...body, surveyVersion: "x" }).ok).toBe(false)
  })
  it("passes answer problems back as a 422 with a readable message", () => {
    const r = validateSubmission({ ...body, answers: { ...valid, rating: 9 } })
    expect(r).toMatchObject({ ok: false, status: 422 })
  })
  it("falls back to safe defaults for platform and environment", () => {
    const r = validateSubmission({ ...body, platform: "toaster", environment: "" })
    expect(r.ok && r.value.platform).toBe("web")
    expect(r.ok && r.value.environment).toBe("production")
  })
})

describe("rate limit", () => {
  it("allows a few submissions per window per client, then slows down, then recovers", () => {
    const t = 1_000_000
    for (let i = 0; i < 8; i++) expect(allowSubmission("c1", t + i)).toBe(true)
    expect(allowSubmission("c1", t + 10)).toBe(false)
    expect(allowSubmission("c2", t + 10)).toBe(true)
    expect(allowSubmission("c1", t + 16 * 60_000)).toBe(true)
  })
})
