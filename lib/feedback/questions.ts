// The survey, in one place. The form, the server check and the admin summary all read from here, so a question can
// never be shown, accepted and reported differently.

export interface Option {
  value: string
  label: string
}

export const BACKGROUND: Option[] = [
  { value: "medical", label: "Medical / healthcare" },
  { value: "non_medical", label: "Non-medical" },
]

export const MED_ROLES: Option[] = [
  { value: "laboratory", label: "Laboratory / lab science" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "nursing", label: "Nursing / midwifery" },
  { value: "doctor", label: "Doctor / physician" },
  { value: "med_student", label: "Medical student" },
  { value: "other_health", label: "Other healthcare" },
]

export const NON_MED_ROLES: Option[] = [
  { value: "student", label: "Student" },
  { value: "researcher", label: "Researcher / academic" },
  { value: "caregiver", label: "Caregiver / family" },
  { value: "other", label: "Something else" },
]

export const DEVICES: Option[] = [
  { value: "phone_browser", label: "Phone browser" },
  { value: "android_app", label: "Android app" },
  { value: "installed_web", label: "Installed web app" },
  { value: "windows_app", label: "Windows app" },
  { value: "computer_browser", label: "Computer browser" },
]

export const USE_CONTEXT: Option[] = [
  { value: "personal", label: "Personal" },
  { value: "office", label: "At work / office" },
  { value: "both", label: "Both" },
]

export const OFFICE_TYPES: Option[] = [
  { value: "laboratory", label: "Laboratory" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "hospital", label: "Hospital" },
  { value: "clinic", label: "Clinic / health centre" },
  { value: "school", label: "School / university" },
  { value: "other", label: "Other" },
]

export const PAY_INTEREST: Option[] = [
  { value: "yes", label: "Yes" },
  { value: "maybe", label: "Maybe, it depends" },
  { value: "no", label: "No, keep it free" },
]

export const PAY_WHO: Option[] = [
  { value: "myself", label: "I would" },
  { value: "workplace", label: "My workplace" },
  { value: "school", label: "My school" },
  { value: "unsure", label: "Not sure" },
]

// Prices are in NG Naira. `mid` is only used for the admin's rough average (band midpoints).
export const PRICE_INDIVIDUAL: (Option & { mid: number })[] = [
  { value: "free", label: "Nothing, free only", mid: 0 },
  { value: "under_1.5", label: "Under ₦1,500", mid: 1500 },
  { value: "1.5_3", label: "₦1,500 – ₦3,000", mid: 2500 },
  { value: "3.5_5", label: "₦3,500 – ₦5,000", mid: 5000 },
  { value: "6_10", label: "₦6,000 – ₦10,000", mid: 7500 },
  { value: "over_10", label: "More than ₦10,000", mid: 10000 },
]

export const PRICE_TEAM: (Option & { mid: number })[] = [
  { value: "none", label: "Not interested", mid: 0 },
  { value: "under_20", label: "Under ₦20,000", mid: 20000 },
  { value: "20_30", label: "₦20,000 – ₦30,000", mid: 22500 },
  { value: "35_50", label: "₦35,000 – ₦50,000", mid: 45000 },
  { value: "50_100", label: "₦50,000 – ₦100,000", mid: 75000 },
  { value: "over_100", label: "More than ₦100,000", mid: 100000 },
]

export const OPEN_QUESTIONS = [
  { id: "improve", label: "What should we improve or change?", placeholder: "Anything that slowed you down or confused you" },
  { id: "missing", label: "Is a calculator or feature missing?", placeholder: "The tool you wish Clinexia had" },
  { id: "other", label: "Anything else you want to tell us?", placeholder: "Optional" },
] as const

export const TEXT_LIMIT = 1000

export const values = (options: Option[]) => options.map((o) => o.value)
export const labelOf = (options: Option[], value: string | null | undefined) => options.find((o) => o.value === value)?.label ?? value ?? ""

export const rolesFor = (background: string | undefined): Option[] => (background === "medical" ? MED_ROLES : background === "non_medical" ? NON_MED_ROLES : [])

export interface FeedbackAnswers {
  rating: number
  background: string
  role: string
  devices: string[]
  context: string
  officeType?: string
  payInterest: string
  payWho?: string
  priceIndividual?: string
  priceTeam?: string
  improve?: string
  missing?: string
  other?: string
}

export type Validation = { ok: true; value: FeedbackAnswers } | { ok: false; error: string }

const clean = (v: unknown): string | undefined => {
  if (typeof v !== "string") return undefined
  // eslint-disable-next-line no-control-regex
  const text = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, TEXT_LIMIT)
  return text || undefined
}
const oneOf = (v: unknown, options: Option[]): string | undefined => (typeof v === "string" && values(options).includes(v) ? v : undefined)

/** Checks answers from the form (also run on the server, so the database only ever holds known values). */
export function validateAnswers(input: unknown): Validation {
  if (!input || typeof input !== "object") return { ok: false, error: "No answers." }
  const a = input as Record<string, unknown>

  const rating = Number(a.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok: false, error: "Please choose a rating from 1 to 5." }

  const background = oneOf(a.background, BACKGROUND)
  if (!background) return { ok: false, error: "Please say whether you work in healthcare." }
  const role = oneOf(a.role, rolesFor(background))
  if (!role) return { ok: false, error: "Please choose what describes you best." }

  const devices = Array.isArray(a.devices) ? [...new Set(a.devices.filter((d): d is string => typeof d === "string" && values(DEVICES).includes(d)))] : []
  if (!devices.length) return { ok: false, error: "Please choose how you use Clinexia." }

  const context = oneOf(a.context, USE_CONTEXT)
  if (!context) return { ok: false, error: "Please say where you use Clinexia." }
  const officeType = oneOf(a.officeType, OFFICE_TYPES)
  if ((context === "office" || context === "both") && !officeType) return { ok: false, error: "Please choose what kind of workplace." }

  const payInterest = oneOf(a.payInterest, PAY_INTEREST)
  if (!payInterest) return { ok: false, error: "Please tell us if you would pay for a premium version." }
  const priceIndividual = oneOf(a.priceIndividual, PRICE_INDIVIDUAL)
  if (payInterest !== "no" && !priceIndividual) return { ok: false, error: "Please choose a price that feels reasonable." }

  return {
    ok: true,
    value: {
      rating,
      background,
      role,
      devices,
      context,
      officeType: context === "personal" ? undefined : officeType,
      payInterest,
      payWho: payInterest === "no" ? undefined : oneOf(a.payWho, PAY_WHO),
      priceIndividual: payInterest === "no" ? undefined : priceIndividual,
      priceTeam: payInterest === "no" ? undefined : oneOf(a.priceTeam, PRICE_TEAM),
      improve: clean(a.improve),
      missing: clean(a.missing),
      other: clean(a.other),
    },
  }
}
