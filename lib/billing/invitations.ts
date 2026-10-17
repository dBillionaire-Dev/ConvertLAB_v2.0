import { createHash, randomBytes } from "node:crypto"

export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired"

export const normalizeEmail = (email: string) => email.trim().toLowerCase()
export const isEmail = (v: string) => v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)

export function invitationState(inv: { status: "pending" | "accepted" | "revoked"; expiresAt: string }, now: number): InvitationStatus {
  if (inv.status !== "pending") return inv.status
  return Date.parse(inv.expiresAt) <= now ? "expired" : "pending"
}

/** The token is shown once (in the invite link); only its hash is stored. */
export function newInviteToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url")
  return { token, hash: hashInviteToken(token) }
}
export const hashInviteToken = (token: string) => createHash("sha256").update(token).digest("hex")

/** Bulk invite input: emails separated by commas, semicolons, spaces or new lines. Dedupes and reports bad entries. */
export function parseEmailList(raw: string, max = 100): { emails: string[]; invalid: string[]; tooMany: boolean } {
  const parts = raw.split(/[\s,;]+/).map(normalizeEmail).filter(Boolean)
  const emails: string[] = []
  const invalid: string[] = []
  for (const p of parts) {
    if (!isEmail(p)) invalid.push(p)
    else if (!emails.includes(p)) emails.push(p)
  }
  return { emails: emails.slice(0, max), invalid, tooMany: emails.length > max }
}
