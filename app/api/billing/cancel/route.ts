import { can } from "@/lib/billing/roles"
import { guard, isResponse, json, problem, readJson, requireUser } from "@/lib/billing/route-kit"
import { cancelAtPeriodEnd, orgStore, recordAudit } from "@/lib/billing/store"

export const dynamic = "force-dynamic"

// Cancelling keeps access until the period that was already paid for ends. There are no refunds or automatic renewals to stop.
export async function POST(request: Request) {
  const blocked = guard(request, { write: true })
  if (blocked) return blocked
  const user = await requireUser()
  if (isResponse(user)) return user
  let body: any
  try {
    body = await readJson(request)
  } catch {
    return problem("Invalid request.", 400)
  }
  let orgId: string | undefined
  if (typeof body?.orgId === "string") {
    const id: string = body.orgId
    orgId = id
    const me = await orgStore.getMember(id, user.id)
    if (!me) return problem("Organisation not found.", 404)
    if (!can(me.role, "org.billing")) return problem("Only the organisation owner can manage billing.", 403)
  }
  const done = await cancelAtPeriodEnd(orgId ? { orgId } : { userId: user.id })
  if (!done) return problem("There is no active subscription to cancel.", 400)
  await recordAudit({ orgId, actorUserId: user.id, action: "subscription.cancelled" })
  return json({ ok: true })
}
