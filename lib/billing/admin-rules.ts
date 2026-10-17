// Safety rules for destructive administrator actions (pure, tested). The admin must type the account's email (or the
// organisation's name) to delete it, and a reason is mandatory so the notice and the audit trail always say why.
export function cleanReason(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  // eslint-disable-next-line no-control-regex
  const t = raw.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim()
  return t.length >= 5 && t.length <= 500 ? t : null
}

export const confirmationMatches = (typed: unknown, expected: string) => typeof typed === "string" && expected.length > 0 && typed.trim().toLowerCase() === expected.trim().toLowerCase()

export type DeleteVerdict = { ok: true } | { ok: false; error: string }

/** A person who owns organisations cannot be deleted until those organisations are dealt with (deleted or reassigned). */
export function canDeleteUser(input: { ownedOrganisations: number }): DeleteVerdict {
  if (input.ownedOrganisations > 0) return { ok: false, error: `This person owns ${input.ownedOrganisations} organisation${input.ownedOrganisations === 1 ? "" : "s"}. Delete or reassign them first.` }
  return { ok: true }
}

export const suspendedMessage = (notice: string | null | undefined) =>
  notice?.trim() ? `Your account is suspended. ${notice.trim()}` : "Your account is suspended. Please contact Clinexia support."
