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
  | "clinical"
  | "renal"
  | "chemistry"
  | "hematology"
  | "microbiology"
  | "lab-solutions"
  | "spectrophotometry"

export interface CalculatorDefinition {
  id: string
  name: string
  shortName?: string
  category: CalculatorGroup
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
  clinical: "Clinical",
  renal: "Renal",
  chemistry: "Clinical Chemistry",
  hematology: "Hematology",
  microbiology: "Microbiology",
  "lab-solutions": "Laboratory Solutions",
  spectrophotometry: "Spectrophotometry",
}

/** Standard disclaimer shown on every calculator result. */
export const CALCULATION_DISCLAIMER =
  "ConvertLAB provides mathematical calculations and estimates for educational and laboratory utility purposes. Results should be interpreted according to applicable laboratory procedures, validated methods, clinical context, and professional judgment. Reference ranges and formulas may vary."
