// Central billing configuration. Every price, policy number and switch lives here (or in the billing_settings row that
// overrides it), so nothing is hardcoded in pages or routes. All money is integer MINOR units (kobo for naira, cents for dollars).
import type { CalculatorGroup } from "../calculators/types"

export const SPECIALTIES = ["laboratory", "pharmacy", "nursing", "renal", "cardiology", "oncology", "general-medicine"] as const
export type Specialty = (typeof SPECIALTIES)[number]

export const SPECIALTY_LABELS: Record<Specialty, string> = {
  laboratory: "Laboratory medicine",
  pharmacy: "Pharmacy",
  nursing: "Nursing",
  renal: "Renal / nephrology",
  cardiology: "Cardiology",
  oncology: "Oncology & transplant",
  "general-medicine": "General medicine",
}

/**
 * Which specialty each existing calculator category belongs to. Typed as a Record over CalculatorGroup so adding a new
 * category to the registry without mapping it here is a compile error, never a silent hole in access control.
 * "nursing" has no calculators yet; it is ready for when they exist.
 */
export const CATEGORY_SPECIALTY: Record<CalculatorGroup, Specialty> = {
  general: "general-medicine",
  renal: "renal",
  chemistry: "laboratory",
  hematology: "laboratory",
  microbiology: "laboratory",
  "lab-solutions": "laboratory",
  spectrophotometry: "laboratory",
  dosing: "pharmacy",
  oncology: "oncology",
  "stem-cell-transplant": "oncology",
  cardiovascular: "cardiology",
}

/**
 * Free/premium designation. PROPOSED default: the "general" category stays free; every other category is premium once
 * enforcement is switched on. Per-calculator overrides win over the category rule. Nothing is enforced until
 * BILLING_ENFORCE_PREMIUM=true, so today every calculator stays free.
 */
export const FREE_CATEGORIES: ReadonlySet<CalculatorGroup> = new Set<CalculatorGroup>(["general"])
export const FREE_CALCULATOR_IDS: ReadonlySet<string> = new Set<string>()
export const PREMIUM_CALCULATOR_IDS: ReadonlySet<string> = new Set<string>()

export type Currency = "NGN" | "USD"
export type Market = "ng" | "intl"
export const MARKETS: Record<Market, { label: string; currency: Currency }> = {
  ng: { label: "Nigeria", currency: "NGN" },
  intl: { label: "International", currency: "USD" },
}

/** Prices for one market, in MINOR units (kobo for naira, cents for dollars). */
export interface MarketPricing {
  currency: Currency
  individual: { specialtyMinor: number; additionalSpecialtyMinor: number; allAccessMinor: number }
  enterprise: {
    specialtyPerSeatMinor: number
    additionalSpecialtyPerSeatMinor: number
    allAccessPerSeatMinor: number
    /** All-access is capped at this amount for up to `allAccessBlockSeats` seats... */
    allAccessBlockMinor: number
    allAccessBlockSeats: number
    /** ...and every seat beyond the block adds this amount. */
    extraSeatMinor: number
  }
}

export interface PricingConfig {
  markets: Record<Market, MarketPricing>
  /** Discount for verified, centrally managed organisations, in basis points (1000 = 10%). Customer pays 90%. */
  managedDiscountBps: number
  maxSeats: number
  graceDays: number
  invitationTtlHours: number
}

export const DEFAULT_PRICING: PricingConfig = {
  markets: {
    ng: {
      currency: "NGN",
      individual: { specialtyMinor: 250_000, additionalSpecialtyMinor: 100_000, allAccessMinor: 500_000 }, // N2,500 / +N1,000 / N5,000 (N6,000 = 600_000)
      enterprise: {
        specialtyPerSeatMinor: 250_000,
        additionalSpecialtyPerSeatMinor: 100_000,
        allAccessPerSeatMinor: 500_000,
        allAccessBlockMinor: 4_500_000, // N45,000
        allAccessBlockSeats: 10,
        extraSeatMinor: 250_000, // N2,500
      },
    },
    // PLACEHOLDER dollar prices: set the real ones in the admin Pricing tab before charging anyone in USD.
    intl: {
      currency: "USD",
      individual: { specialtyMinor: 300, additionalSpecialtyMinor: 150, allAccessMinor: 600 },
      enterprise: {
        specialtyPerSeatMinor: 300,
        additionalSpecialtyPerSeatMinor: 150,
        allAccessPerSeatMinor: 600,
        allAccessBlockMinor: 5_000,
        allAccessBlockSeats: 10,
        extraSeatMinor: 250,
      },
    },
  },
  managedDiscountBps: 1000,
  maxSeats: 5000,
  graceDays: 7,
  invitationTtlHours: 168,
}

const isMinor = (v: unknown, max = 1_000_000_000): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= max

function overlay(target: Record<string, number>, source: unknown, keys: string[]) {
  if (!source || typeof source !== "object") return
  for (const k of keys) if (isMinor((source as any)[k])) target[k] = (source as any)[k]
}

function parseMarket(base: MarketPricing, raw: any): MarketPricing {
  if (!raw || typeof raw !== "object") return base
  overlay(base.individual, raw.individual, ["specialtyMinor", "additionalSpecialtyMinor", "allAccessMinor"])
  overlay(base.enterprise, raw.enterprise, ["specialtyPerSeatMinor", "additionalSpecialtyPerSeatMinor", "allAccessPerSeatMinor", "allAccessBlockMinor", "extraSeatMinor"])
  const seats = raw.enterprise?.allAccessBlockSeats
  if (Number.isInteger(seats) && seats >= 1 && seats <= 5000) base.enterprise.allAccessBlockSeats = seats
  return base
}

/**
 * Merges a stored override (billing_settings.config) over the defaults, ignoring anything invalid. An older flat config
 * (no "markets" key) is treated as the Nigeria prices.
 */
export function parsePricingConfig(raw: unknown): PricingConfig {
  const base = structuredClone(DEFAULT_PRICING)
  if (!raw || typeof raw !== "object") return base
  const r = raw as Record<string, any>
  const legacy = r.markets === undefined && (r.individual || r.enterprise)
  const markets = legacy ? { ng: { individual: r.individual, enterprise: r.enterprise } } : r.markets
  if (markets && typeof markets === "object") {
    parseMarket(base.markets.ng, markets.ng)
    parseMarket(base.markets.intl, markets.intl)
  }
  if (Number.isInteger(r.managedDiscountBps) && r.managedDiscountBps >= 0 && r.managedDiscountBps <= 5000) base.managedDiscountBps = r.managedDiscountBps
  if (Number.isInteger(r.graceDays) && r.graceDays >= 0 && r.graceDays <= 60) base.graceDays = r.graceDays
  return base
}

/** Nigeria pays naira prices; everywhere else pays dollar prices. Unknown location defaults to Nigeria (the home market). */
export function marketFromCountry(code: string | null | undefined): Market {
  const c = (code ?? "").trim().toUpperCase()
  return c && c !== "NG" ? "intl" : "ng"
}

type Env = Record<string, string | undefined>

/**
 * Master switch. ON by default so /login, /register and the account pages can be tested now; set BILLING_ENABLED=false to
 * switch the whole feature off (every page and API then answers 404). Nothing links to it from the home page.
 */
export const billingEnabled = (env: Env = process.env) => env.BILLING_ENABLED !== "false"
/** Separate switch for actually locking premium calculators. Stays off until you are ready to charge. */
export const premiumEnforced = (env: Env = process.env) => billingEnabled(env) && env.BILLING_ENFORCE_PREMIUM === "true"

export const ORGANISATION_TYPES = [
  { value: "laboratory", label: "Laboratory" },
  { value: "hospital", label: "Hospital" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "clinic", label: "Clinic / health centre" },
  { value: "university", label: "University / school" },
  { value: "other_healthcare", label: "Other healthcare organisation" },
] as const
