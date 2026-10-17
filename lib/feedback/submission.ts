import { validateAnswers, type FeedbackAnswers } from "./questions"

export interface Submission {
  anonymousId: string
  surveyVersion: number
  platform: "web" | "pwa" | "android" | "windows"
  appVersion: string
  environment: string
  answers: FeedbackAnswers
}

export type SubmissionResult = { ok: true; value: Submission } | { ok: false; error: string; status: number }

const PLATFORMS = ["web", "pwa", "android", "windows"] as const

/** Validates the whole request body. A filled-in hidden field means a bot: it is refused quietly like any bad request. */
export function validateSubmission(body: unknown): SubmissionResult {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid request.", status: 400 }
  const b = body as Record<string, unknown>
  if (typeof b.website === "string" && b.website.trim()) return { ok: false, error: "Invalid request.", status: 400 }

  const anonymousId = typeof b.anonymousId === "string" ? b.anonymousId.trim() : ""
  if (!anonymousId || anonymousId.length > 100) return { ok: false, error: "Invalid request.", status: 400 }
  const surveyVersion = Number(b.surveyVersion)
  if (!Number.isInteger(surveyVersion) || surveyVersion < 1 || surveyVersion > 10_000) return { ok: false, error: "Invalid request.", status: 400 }

  const answers = validateAnswers(b.answers)
  if (!answers.ok) return { ok: false, error: answers.error, status: 422 }

  const platform = PLATFORMS.find((p) => p === b.platform) ?? "web"
  const appVersion = typeof b.appVersion === "string" ? b.appVersion.slice(0, 40) : "unknown"
  const environment = typeof b.environment === "string" && b.environment.trim() ? b.environment.trim().slice(0, 40) : "production"
  return { ok: true, value: { anonymousId, surveyVersion, platform, appVersion, environment, answers: answers.value } }
}

export function toRow(s: Submission) {
  const a = s.answers
  return {
    survey_version: s.surveyVersion,
    anonymous_id: s.anonymousId,
    environment: s.environment,
    platform: s.platform,
    app_version: s.appVersion,
    rating: a.rating,
    background: a.background,
    role: a.role,
    devices: a.devices,
    use_context: a.context,
    office_type: a.officeType ?? null,
    pay_interest: a.payInterest,
    pay_who: a.payWho ?? null,
    price_individual: a.priceIndividual ?? null,
    price_team: a.priceTeam ?? null,
    improve: a.improve ?? null,
    missing: a.missing ?? null,
    other: a.other ?? null,
    updated_at: new Date().toISOString(),
  }
}
