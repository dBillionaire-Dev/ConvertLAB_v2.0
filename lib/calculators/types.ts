export type InputKind = "number" | "select"

export interface SelectOption {
  value: string
  label: string
}

export interface InputDefinition {
  id: string
  label: string
  kind: InputKind
  unit?: string
  placeholder?: string
  min?: number
  max?: number
  step?: number
  defaultValue?: number | string
  options?: SelectOption[]
  helpText?: string
  optional?: boolean
}

export interface CalculationField {
  label: string
  value: string
}

export interface CalculationResult {
  /** Primary numeric or textual result */
  value: number | string
  /** Unit for the primary result, if any */
  unit?: string
  /** Human readable formatted result, e.g. "24.7 kg/m²" */
  display: string
  /** Secondary values worth surfacing (e.g. category, interpretation) */
  secondary?: CalculationField[]
  /** Step-by-step substitution, e.g. "70 / (1.75 x 1.75)" */
  calculationSteps?: string[]
  /** Free-form interpretation text (never a diagnosis) */
  interpretation?: string
  /** Non-fatal warnings, e.g. "value outside typical range" */
  warnings?: string[]
}

export type CalculatorGroup =
  | "general"
  | "renal"
  | "chemistry"
  | "hematology"
  | "microbiology"
  | "lab-solutions"
  | "spectrophotometry"
  | "dosing"
  | "oncology"
  | "cardiovascular"
  | "stem-cell-transplant"

export interface CalculatorDefinition {
  id: string
  name: string
  shortName?: string
  category: CalculatorGroup
  /** Optional second-level navigation bucket inside the top-level clinical domain. */
  subcategory?: string
  description: string
  isEstimator?: boolean
  inputs: InputDefinition[]
  calculate: (inputs: Record<string, number | string>) => CalculationResult
  formula?: string
  notes?: string[]
  limitations?: string[]
  relatedTools?: string[]
  keywords?: string[]
}

export const CALCULATOR_CATEGORY_LABELS: Record<CalculatorGroup, string> = {
  general: "General",
  renal: "Renal",
  chemistry: "Clinical Chemistry",
  hematology: "Hematology",
  microbiology: "Microbiology",
  "lab-solutions": "Laboratory Solutions",
  spectrophotometry: "Spectrophotometry",
  dosing: "Drug Dosing",
  oncology: "Oncology",
  cardiovascular: "Cardiovascular",
  "stem-cell-transplant": "Stem Cell & Transplant",
}

export const CALCULATOR_SUBCATEGORY_LABELS: Record<CalculatorGroup, Record<string, string>> = {
  general: {},
  renal: {},
  chemistry: {},
  microbiology: {},
  "lab-solutions": {},
  spectrophotometry: {},
  hematology: {
    anemia: "Anemia",
    coagulation: "Coagulation",
    transfusion: "Transfusion",
    "blood-products": "Blood Products",
    "hematologic-malignancy": "Hematologic Malignancy",
  },
  dosing: {
    "general-dosing": "General Dosing",
    antimalarial: "Antimalarial",
    antibiotic: "Antibiotic",
    "renal-adjustment": "Renal Adjustment",
    "therapeutic-drug-monitoring": "Therapeutic Drug Monitoring",
  },
  oncology: {
    "body-surface-area": "Body Surface Area",
    "chemotherapy-dosing": "Chemotherapy Dosing",
    "dose-modifications": "Dose Modifications",
    "cycle-course-calculations": "Cycle / Course Calculations",
    "supportive-care": "Supportive Care",
    "toxicity-safety-checks": "Toxicity / Safety Checks",
  },
  cardiovascular: {
    hypertension: "Hypertension",
    "heart-failure": "Heart Failure",
    anticoagulation: "Anticoagulation",
    antiplatelet: "Antiplatelet",
    arrhythmia: "Arrhythmia",
    "risk-prevention": "Risk / Prevention",
  },
  "stem-cell-transplant": {
    hct: "HCT",
    conditioning: "Conditioning",
    "stem-cell-collection": "Stem Cell Collection",
    "cell-dose": "Cell Dose",
    engraftment: "Engraftment",
    "transplant-support": "Transplant Support",
  },
}

/** Standard disclaimer shown on every calculator result. */
export const CALCULATION_DISCLAIMER =
  "ConvertLAB provides mathematical calculations and estimates for educational and laboratory utility purposes. Results should be interpreted according to applicable laboratory procedures, validated methods, clinical context, and professional judgment. Reference ranges and formulas may vary."

/** Shown on laboratory preparation tools (dilutions, solutions, density/molar conversions). */
export const LAB_PREP_DISCLAIMER =
  "Always follow your laboratory's validated SOPs, reagent manufacturer's instructions, and applicable safety procedures."
