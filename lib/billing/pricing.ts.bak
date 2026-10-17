// Server-side price calculation. The browser may show a quote, but only a quote computed here is ever charged.
import { SPECIALTIES, type Currency, type Market, type MarketPricing, type PricingConfig, type Specialty } from "./config"

export type PlanKind = "specialty" | "all_access"
export type ManagedStatus = "none" | "requested" | "verified" | "rejected"

export interface QuoteInput {
  kind: "individual" | "enterprise"
  plan: PlanKind
  specialties?: unknown
  seats?: unknown
  /** Comes from the organisation's stored record, never from the request. */
  managedStatus?: ManagedStatus
}

export interface QuoteLine { label: string; amountMinor: number }

export interface Quote {
  currency: Currency
  market: Market
  kind: "individual" | "enterprise"
  plan: PlanKind
  specialties: Specialty[]
  seats: number
  periodMonths: 1
  lines: QuoteLine[]
  subtotalMinor: number
  discount: { applied: boolean; bps: number; amountMinor: number; reason: string }
  totalMinor: number
  /** True when the chosen specialties cost as much as (or more than) all-access. */
  allAccessIsCheaper: boolean
}

export type QuoteResult = { ok: true; quote: Quote } | { ok: false; error: string }

export function formatMoney(minor: number, currency: Currency): string {
  const major = (minor / 100).toLocaleString(currency === "USD" ? "en-US" : "en-NG", { minimumFractionDigits: minor % 100 ? 2 : 0, maximumFractionDigits: 2 })
  return `${currency === "USD" ? "$" : "₦"}${major}`
}
export const naira = (minor: number) => formatMoney(minor, "NGN")

export function cleanSpecialties(raw: unknown): Specialty[] | null {
  if (!Array.isArray(raw)) return null
  const out: Specialty[] = []
  for (const s of raw) {
    if (typeof s !== "string" || !(SPECIALTIES as readonly string[]).includes(s)) return null
    if (!out.includes(s as Specialty)) out.push(s as Specialty)
  }
  return out
}

/** Monthly all-access price for an organisation: capped for the first block of seats, then a flat amount per extra seat. */
export function enterpriseAllAccessMinor(seats: number, c: MarketPricing["enterprise"]): number {
  if (seats <= c.allAccessBlockSeats) return Math.min(seats * c.allAccessPerSeatMinor, c.allAccessBlockMinor)
  return c.allAccessBlockMinor + (seats - c.allAccessBlockSeats) * c.extraSeatMinor
}

export function computeQuote(input: QuoteInput, pricing: PricingConfig, market: Market = "ng"): QuoteResult {
  const mp = pricing.markets[market]
  const enterprise = input.kind === "enterprise"
  const seatsRaw = enterprise ? Number(input.seats) : 1
  if (!Number.isInteger(seatsRaw) || seatsRaw < 1 || seatsRaw > pricing.maxSeats) return { ok: false, error: `Seats must be a whole number from 1 to ${pricing.maxSeats}.` }
  const seats = seatsRaw

  let specialties: Specialty[] = []
  if (input.plan === "specialty") {
    const cleaned = cleanSpecialties(input.specialties)
    if (!cleaned || cleaned.length < 1) return { ok: false, error: "Choose at least one specialty." }
    specialties = cleaned
  } else if (input.plan !== "all_access") {
    return { ok: false, error: "Unknown plan." }
  }

  const i = mp.individual
  const e = mp.enterprise
  const lines: QuoteLine[] = []
  let allAccessAlt: number

  if (!enterprise) {
    allAccessAlt = i.allAccessMinor
    if (input.plan === "all_access") lines.push({ label: "All-access premium", amountMinor: i.allAccessMinor })
    else {
      lines.push({ label: `${specialties[0]} (first specialty)`, amountMinor: i.specialtyMinor })
      for (const s of specialties.slice(1)) lines.push({ label: `${s} (additional specialty)`, amountMinor: i.additionalSpecialtyMinor })
    }
  } else {
    allAccessAlt = enterpriseAllAccessMinor(seats, e)
    if (input.plan === "all_access") {
      lines.push({ label: `All-access, ${seats} seat${seats === 1 ? "" : "s"}`, amountMinor: allAccessAlt })
    } else {
      lines.push({ label: `First specialty, ${seats} seat${seats === 1 ? "" : "s"}`, amountMinor: seats * e.specialtyPerSeatMinor })
      if (specialties.length > 1) lines.push({ label: `${specialties.length - 1} additional specialt${specialties.length === 2 ? "y" : "ies"}, ${seats} seat${seats === 1 ? "" : "s"}`, amountMinor: (specialties.length - 1) * seats * e.additionalSpecialtyPerSeatMinor })
    }
  }

  const subtotalMinor = lines.reduce((s, l) => s + l.amountMinor, 0)
  const eligible = enterprise && input.managedStatus === "verified" && pricing.managedDiscountBps > 0
  const discountMinor = eligible ? Math.round((subtotalMinor * pricing.managedDiscountBps) / 10_000) : 0
  const reason = !enterprise ? "Discounts apply to enterprise accounts only." : eligible ? "Verified centrally managed organisation." : input.managedStatus === "requested" ? "Pending verification by Clinexia." : "Not applied."

  return {
    ok: true,
    quote: {
      currency: mp.currency,
      market,
      kind: input.kind,
      plan: input.plan,
      specialties,
      seats,
      periodMonths: 1,
      lines,
      subtotalMinor,
      discount: { applied: eligible, bps: eligible ? pricing.managedDiscountBps : 0, amountMinor: discountMinor, reason },
      totalMinor: subtotalMinor - discountMinor,
      allAccessIsCheaper: input.plan === "specialty" && subtotalMinor >= allAccessAlt,
    },
  }
}
