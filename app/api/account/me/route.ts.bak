import { effectiveStatus } from "@/lib/billing/lifecycle"
import { resolveEntitlements } from "@/lib/billing/entitlements"
import { detectMarket, guard, isResponse, json, requireUser } from "@/lib/billing/route-kit"
import { getPricing, getSubscriptionFor, getUserMarket, listUserOrganisations, loadEntitlementInputs } from "@/lib/billing/store"

export const dynamic = "force-dynamic"

// Who is signed in, and what they are entitled to. Entitlements are always recomputed from the database.
export async function GET(request: Request) {
  const blocked = guard(request)
  if (blocked) return blocked
  const user = await requireUser()
  if (isResponse(user)) return user

  const [pricing, inputs, own, organisations, market] = await Promise.all([getPricing(), loadEntitlementInputs(user.id), getSubscriptionFor({ userId: user.id }), listUserOrganisations(user.id), getUserMarket(user.id)])
  const now = Date.now()
  const entitlements = resolveEntitlements({ ...inputs, now, graceDays: pricing.graceDays })
  return json({
    user,
    market: market ?? detectMarket(request),
    entitlements,
    subscription: own ? { plan: own.plan, specialties: own.specialties, status: effectiveStatus(own, now, pricing.graceDays), currentPeriodEnd: own.currentPeriodEnd, cancelAtPeriodEnd: own.cancelAtPeriodEnd } : null,
    organisations,
  })
}
