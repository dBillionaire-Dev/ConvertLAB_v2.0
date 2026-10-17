// Shared helpers for the billing API routes: the on/off gate, same-origin check, JSON helpers and error mapping.
import { NextResponse } from "next/server"
import { billingEnabled, marketFromCountry, type Market } from "./config"
import { currentUser, type AccountUser } from "./session"
import type { Failure } from "./org-actions"

const STATUS: Record<Failure["code"], number> = { not_found: 404, forbidden: 403, invalid: 400, subscription_inactive: 402, conflict: 409 }

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } })
export const problem = (error: string, status: number) => json({ error }, status)
export const failure = (f: Failure) => problem(f.message, STATUS[f.code])

/** Returns a response to send straight back (404 while billing is off, 403 for cross-site writes), or null to continue. */
export function guard(request: Request, opts: { write?: boolean } = {}): NextResponse | null {
  if (!billingEnabled()) return new NextResponse(null, { status: 404 })
  if (opts.write) {
    const origin = request.headers.get("origin")
    if (origin && origin !== new URL(request.url).origin) return problem("Cross-origin request rejected.", 403)
  }
  return null
}

export async function readJson(request: Request, maxBytes = 20_000): Promise<unknown> {
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes) throw new Error("too large")
  return request.json()
}

export const clientKey = (request: Request) => (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim()

export async function requireUser(): Promise<AccountUser | NextResponse> {
  const user = await currentUser().catch(() => null)
  return user ?? problem("Please sign in.", 401)
}
export const isResponse = (v: unknown): v is NextResponse => v instanceof NextResponse

/** Which price list a visitor sees when nothing is stored yet: Nigeria by IP country, everyone else international. */
export const detectMarket = (request: Request): Market => marketFromCountry(request.headers.get("x-vercel-ip-country"))
