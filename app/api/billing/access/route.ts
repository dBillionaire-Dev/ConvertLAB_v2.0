import { NextResponse } from "next/server"
import { getCalculatorById } from "@/lib/calculators/registry"
import { CATEGORY_SPECIALTY, SPECIALTY_LABELS, billingEnabled, premiumEnforced } from "@/lib/billing/config"
import { hasSpecialty, isPremiumCalculator, resolveEntitlements } from "@/lib/billing/entitlements"
import { currentUser } from "@/lib/billing/session"
import { getPricing, loadEntitlementInputs } from "@/lib/billing/store"
import type { CalculatorGroup } from "@/lib/calculators/types"

export const dynamic = "force-dynamic"

const reply = (data: Record<string, unknown>) => NextResponse.json(data, { headers: { "Cache-Control": "no-store" } })

// Asked by every calculator page. Answers {enforced:false} (nothing locked) unless BILLING_ENFORCE_PREMIUM=true.
// Query: ?id=<calculator id> (preferred) or ?category=<category>. Free tools always answer allowed.
export async function GET(request: Request) {
  if (!billingEnabled() || !premiumEnforced()) return reply({ enforced: false, allowed: true })

  const url = new URL(request.url)
  const id = url.searchParams.get("id") ?? ""
  let category = url.searchParams.get("category") ?? ""
  if (id) {
    const calc = getCalculatorById(id)
    if (!calc) return reply({ enforced: true, allowed: true, premium: false })
    category = calc.category
  }
  if (!(category in CATEGORY_SPECIALTY)) return reply({ enforced: true, allowed: true, premium: false })
  const group = category as CalculatorGroup
  if (!isPremiumCalculator({ id, category: group })) return reply({ enforced: true, allowed: true, premium: false })

  const specialty = CATEGORY_SPECIALTY[group]
  const user = await currentUser().catch(() => null)
  let allowed = false
  if (user) {
    try {
      const [pricing, inputs] = await Promise.all([getPricing(), loadEntitlementInputs(user.id)])
      allowed = hasSpecialty(resolveEntitlements({ ...inputs, now: Date.now(), graceDays: pricing.graceDays }), specialty)
    } catch {
      allowed = false // cannot verify: do not unlock premium tools
    }
  }
  return reply({ enforced: true, premium: true, allowed, signedIn: Boolean(user), specialty, specialtyLabel: SPECIALTY_LABELS[specialty] })
}
