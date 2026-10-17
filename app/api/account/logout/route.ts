import { guard, json } from "@/lib/billing/route-kit"
import { clearSessionCookies } from "@/lib/billing/session"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const blocked = guard(request, { write: true })
  if (blocked) return blocked
  await clearSessionCookies()
  return json({ ok: true })
}
