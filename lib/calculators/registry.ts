import type { CalculatorDefinition, CalculatorGroup } from "./types"
import { CALCULATOR_CATEGORY_LABELS } from "./types"
import { bmiCalculator, bsaCalculator, idealBodyWeightCalculator, bmrCalculator } from "./definitions/clinical"
import { creatinineClearanceCalculator, egfrCalculator } from "./definitions/renal"
import {
  ldlCalculator,
  nonHdlCalculator,
  vldlCalculator,
  anionGapCalculator,
  correctedCalciumCalculator,
} from "./definitions/chemistry"
import { mcvCalculator, mchCalculator, mchcCalculator, absoluteCellCountCalculator } from "./definitions/hematology"
import { molarityCalculator, normalityCalculator } from "./definitions/lab-solutions"
import { cfuCalculator, dilutionFactorCalculator, concentrationAfterDilutionCalculator } from "./definitions/microbiology"

export const calculators: CalculatorDefinition[] = [
  bmiCalculator,
  bsaCalculator,
  idealBodyWeightCalculator,
  bmrCalculator,
  creatinineClearanceCalculator,
  egfrCalculator,
  ldlCalculator,
  nonHdlCalculator,
  vldlCalculator,
  anionGapCalculator,
  correctedCalciumCalculator,
  mcvCalculator,
  mchCalculator,
  mchcCalculator,
  absoluteCellCountCalculator,
  molarityCalculator,
  normalityCalculator,
  cfuCalculator,
  dilutionFactorCalculator,
  concentrationAfterDilutionCalculator,
]

export function getCalculatorById(id: string): CalculatorDefinition | undefined {
  return calculators.find((c) => c.id === id)
}

export function getCalculatorsByCategory(category: CalculatorGroup): CalculatorDefinition[] {
  return calculators.filter((c) => c.category === category)
}

export function getRelatedCalculators(def: CalculatorDefinition): CalculatorDefinition[] {
  if (!def.relatedTools?.length) return []
  return def.relatedTools.map((id) => getCalculatorById(id)).filter((c): c is CalculatorDefinition => Boolean(c))
}

export const calculatorCategories: { id: CalculatorGroup; label: string; count: number }[] = (
  Object.keys(CALCULATOR_CATEGORY_LABELS) as CalculatorGroup[]
)
  .map((id) => ({
    id,
    label: CALCULATOR_CATEGORY_LABELS[id],
    count: getCalculatorsByCategory(id).length,
  }))
  .filter((c) => c.count > 0)

export function searchCalculators(query: string): CalculatorDefinition[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return calculators.filter((c) => {
    const haystack = [c.name, c.shortName ?? "", c.description, ...(c.keywords ?? [])].join(" ").toLowerCase()
    return haystack.includes(q)
  })
}

export * from "./types"
