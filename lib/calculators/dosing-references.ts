import type { CalculatorDefinition } from "./types"

export interface CalculatorReference {
  source: string
  version: string
  url?: string
  applicablePopulation?: string
  indication?: string
  lastVerified: string
  status?: "current" | "review-needed" | "supporting"
  note?: string
}

const VERIFIED_ON = "2026-09-14"

const WHO_MALARIA: CalculatorReference = {
  source: "World Health Organization — WHO guidelines for malaria",
  version: "10 September 2026",
  url: "https://www.who.int/publications/i/item/guidelines-for-malaria/",
  applicablePopulation: "Patients with malaria; use the specific regimen and weight/age bands shown by the calculator.",
  lastVerified: VERIFIED_ON,
  status: "current",
}

const WHO_AWARE: CalculatorReference = {
  source: "World Health Organization — AWaRe antibiotic book",
  version: "2022 edition",
  url: "https://www.who.int/publications/i/item/9789240062382",
  applicablePopulation: "Children and adults for the infection-specific regimens covered by the source.",
  lastVerified: VERIFIED_ON,
  status: "supporting",
  note: "WHO states that the AWaRe antibiotic book is being updated to reflect newer 2024–2025 guidelines. Verify newer syndrome-specific guidance where applicable.",
}

const WHO_INFANTS: CalculatorReference = {
  source: "World Health Organization — Serious bacterial infections in infants aged 0–59 days",
  version: "8 December 2024 guideline",
  url: "https://www.who.int/publications/i/item/9789240102903/",
  applicablePopulation: "Infants aged 0–59 days with suspected serious bacterial infection.",
  lastVerified: VERIFIED_ON,
  status: "current",
}

const TDM_VANCOMYCIN: CalculatorReference = {
  source: "ASHP/IDSA/PIDS/SIDP — Vancomycin monitoring consensus guideline",
  version: "2020 consensus guideline",
  url: "https://www.idsociety.org/practice-guideline/vancomycin/",
  applicablePopulation: "Serious invasive MRSA infections where AUC-guided monitoring is applicable.",
  lastVerified: VERIFIED_ON,
  status: "supporting",
  note: "AUC targets and monitoring strategy require patient-specific pharmacokinetic context; this calculator is a target/check aid, not a dosing model.",
}

const GENERIC: CalculatorReference = {
  source: "ConvertLAB calculation method",
  version: "Mathematical reference",
  applicablePopulation: "General calculation use; no drug-specific regimen is selected.",
  lastVerified: VERIFIED_ON,
  status: "current",
  note: "For drug-specific decisions, use the applicable current product information, guideline and local protocol.",
}

const MALARIA_IDS = new Set([
  "artemether-lumefantrine-uncomplicated-malaria",
  "artesunate-amodiaquine-uncomplicated-malaria",
  "artesunate-mefloquine-uncomplicated-malaria",
  "dihydroartemisinin-piperaquine-uncomplicated-malaria",
  "artesunate-sulfadoxine-pyrimethamine-uncomplicated-malaria",
  "artesunate-pyronaridine-uncomplicated-malaria",
  "artesunate-severe-malaria",
])

const INFANT_IDS = new Set([
  "who-young-infant-sepsis-pneumonia",
  "who-young-infant-meningitis",
])

const VANCOMYCIN_IDS = new Set(["vancomycin-pediatric-dose", "vancomycin-auc24-target-check"])

const GENERIC_DOSING_IDS = new Set([
  "mg-per-kg-dose",
  "mg-per-kg-per-day-dose",
  "mg-per-m2-dose",
  "dose-per-administration",
  "dose-to-volume",
  "drug-concentration",
  "infusion-rate",
  "drops-per-minute",
  "maximum-dose-check",
  "oral-liquid-dose-volume",
  "tablet-capsule-dose-count",
  "dose-volume-rounding",
  "loading-dose",
  "maintenance-dose",
  "infusion-duration",
  "course-total-dose",
])

export function getCalculatorReferences(definition: CalculatorDefinition): CalculatorReference[] {
  if (MALARIA_IDS.has(definition.id)) return [WHO_MALARIA]
  if (INFANT_IDS.has(definition.id)) return [WHO_INFANTS]
  if (VANCOMYCIN_IDS.has(definition.id)) return [TDM_VANCOMYCIN]
  if (GENERIC_DOSING_IDS.has(definition.id)) return [GENERIC]
  if (definition.category === "dosing") return [WHO_AWARE]
  return [GENERIC]
}
