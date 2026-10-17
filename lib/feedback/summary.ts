// Turns stored responses into the numbers the admin sees. Averages of price bands use the band midpoints and are
// labelled as estimates in the page.
import { BACKGROUND, DEVICES, MED_ROLES, NON_MED_ROLES, OFFICE_TYPES, PAY_INTEREST, PRICE_INDIVIDUAL, PRICE_TEAM, USE_CONTEXT, type Option } from "./questions"

export interface FeedbackRow {
  rating: number
  background: string
  role: string
  devices: string[]
  use_context: string
  office_type: string | null
  pay_interest: string
  pay_who: string | null
  price_individual: string | null
  price_team: string | null
}

export interface Tally {
  value: string
  label: string
  count: number
  share: number
}

function tally(rows: string[], options: Option[], base: number): Tally[] {
  const counts = new Map<string, number>()
  for (const r of rows) counts.set(r, (counts.get(r) ?? 0) + 1)
  const known = options.map((o) => ({ value: o.value, label: o.label, count: counts.get(o.value) ?? 0, share: base ? (counts.get(o.value) ?? 0) / base : 0 }))
  const unknown = [...counts].filter(([v]) => !options.some((o) => o.value === v)).map(([v, count]) => ({ value: v, label: v, count, share: base ? count / base : 0 }))
  return [...known, ...unknown]
}

const average = (nums: number[]) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null)

export function summarize(rows: FeedbackRow[]) {
  const n = rows.length
  const willing = rows.filter((r) => r.pay_interest !== "no")
  const midOf = (options: (Option & { mid: number })[], v: string | null) => options.find((o) => o.value === v)?.mid
  const individualMids = willing.map((r) => midOf(PRICE_INDIVIDUAL, r.price_individual)).filter((m): m is number => m !== undefined)
  const teamMids = willing.map((r) => midOf(PRICE_TEAM, r.price_team)).filter((m): m is number => m !== undefined)

  return {
    count: n,
    averageRating: average(rows.map((r) => r.rating)),
    ratings: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: rows.filter((r) => r.rating === stars).length, share: n ? rows.filter((r) => r.rating === stars).length / n : 0 })),
    background: tally(rows.map((r) => r.background), BACKGROUND, n),
    roles: tally(rows.map((r) => r.role), [...MED_ROLES, ...NON_MED_ROLES].filter((o, i, all) => all.findIndex((x) => x.value === o.value) === i), n),
    devices: tally(rows.flatMap((r) => r.devices), DEVICES, n), // a person can pick several, so shares can add to more than 100%
    context: tally(rows.map((r) => r.use_context), USE_CONTEXT, n),
    officeTypes: tally(rows.map((r) => r.office_type).filter((v): v is string => Boolean(v)), OFFICE_TYPES, rows.filter((r) => r.office_type).length),
    payInterest: tally(rows.map((r) => r.pay_interest), PAY_INTEREST, n),
    willingShare: n ? willing.length / n : null,
    individualPrices: tally(willing.map((r) => r.price_individual).filter((v): v is string => Boolean(v)), PRICE_INDIVIDUAL, willing.length),
    teamPrices: tally(willing.map((r) => r.price_team).filter((v): v is string => Boolean(v)), PRICE_TEAM, willing.filter((r) => r.price_team).length),
    individualAverageUsd: average(individualMids), // estimate from band midpoints, among people who would pay
    teamAverageUsd: average(teamMids),
  }
}
