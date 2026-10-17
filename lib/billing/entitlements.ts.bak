// The one place that decides which specialties a person may use. Pages and routes call this; they never compare plan
// names or prices themselves.
import type { CalculatorGroup } from "../calculators/types"
import { CATEGORY_SPECIALTY, FREE_CALCULATOR_IDS, FREE_CATEGORIES, PREMIUM_CALCULATOR_IDS, SPECIALTIES, type Specialty } from "./config"
import { effectiveStatus, grantsAccess, type SubscriptionTiming } from "./lifecycle"
import type { PlanKind } from "./pricing"

export interface PlanRecord extends SubscriptionTiming {
  plan: PlanKind
  specialties: Specialty[]
}

export interface MembershipContext {
  orgId: string
  role: "owner" | "admin" | "staff"
  /** True when the member was given everything the organisation plan covers. */
  allSpecialties: boolean
  /** Otherwise only these (always intersected with what the plan covers). */
  specialties: Specialty[]
  /** 0-based position by join date. A member beyond the paid seat count has no access. */
  seatIndex: number
  orgSeats: number
  orgSuspended: boolean
  orgPlan: PlanRecord | null
}

export interface Entitlements {
  all: boolean
  specialties: Specialty[]
  sources: Array<{ kind: "individual" | "organisation"; orgId?: string; status: "active" | "grace" }>
}

export const NO_ENTITLEMENTS: Entitlements = { all: false, specialties: [], sources: [] }

const covered = (plan: PlanRecord): Specialty[] => (plan.plan === "all_access" ? [...SPECIALTIES] : plan.specialties)

/**
 * Individual plan + organisation memberships, merged. A person's own profile role is NOT an input: changing it can never
 * widen access. Only paid plans and explicit assignments count.
 */
export function resolveEntitlements(input: { individual: PlanRecord | null; memberships: MembershipContext[]; now: number; graceDays: number }): Entitlements {
  const granted = new Set<Specialty>()
  const sources: Entitlements["sources"] = []

  if (input.individual) {
    const status = effectiveStatus(input.individual, input.now, input.graceDays)
    if (grantsAccess(status)) {
      covered(input.individual).forEach((s) => granted.add(s))
      sources.push({ kind: "individual", status: status as "active" | "grace" })
    }
  }

  for (const m of input.memberships) {
    if (m.orgSuspended || !m.orgPlan || m.seatIndex >= m.orgSeats) continue
    const status = effectiveStatus(m.orgPlan, input.now, input.graceDays)
    if (!grantsAccess(status)) continue
    const allowed = covered(m.orgPlan)
    const mine = m.allSpecialties ? allowed : allowed.filter((s) => m.specialties.includes(s))
    mine.forEach((s) => granted.add(s))
    if (mine.length) sources.push({ kind: "organisation", orgId: m.orgId, status: status as "active" | "grace" })
  }

  const specialties = SPECIALTIES.filter((s) => granted.has(s))
  return { all: specialties.length === SPECIALTIES.length, specialties, sources }
}

export const hasSpecialty = (e: Entitlements, s: Specialty) => e.all || e.specialties.includes(s)

export const specialtyOf = (category: CalculatorGroup): Specialty => CATEGORY_SPECIALTY[category]

/** Premium designation: a per-calculator override wins, then the category rule. */
export function isPremiumCalculator(calc: { id: string; category: CalculatorGroup }): boolean {
  if (FREE_CALCULATOR_IDS.has(calc.id)) return false
  if (PREMIUM_CALCULATOR_IDS.has(calc.id)) return true
  return !FREE_CATEGORIES.has(calc.category)
}

/**
 * Free tools are always allowed. Premium tools need the matching specialty, but only when enforcement is on; with it off
 * (today's default) nothing is locked.
 */
export function canUseCalculator(calc: { id: string; category: CalculatorGroup }, ent: Entitlements, enforce: boolean): boolean {
  if (!enforce) return true
  if (!isPremiumCalculator(calc)) return true
  return hasSpecialty(ent, specialtyOf(calc.category))
}
