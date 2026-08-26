import type { CalculatorDefinition } from "../types"
import { num, assertPositive, assertNonNegative, safeDivide, round, fmt } from "../helpers"

export const cfuCalculator: CalculatorDefinition = {
  id: "cfu-per-ml",
  name: "CFU/mL Estimation",
  shortName: "CFU/mL",
  category: "microbiology",
  description: "Estimates colony-forming units per mL from a plated colony count.",
  isEstimator: true,
  formula: "CFU/mL = (colonies counted / volume plated[mL]) x dilution factor",
  keywords: ["cfu", "colony forming units", "plate count", "microbiology"],
  relatedTools: ["dilution-factor", "concentration-after-dilution"],
  inputs: [
    { id: "colonies", label: "Colonies counted", kind: "number", min: 0, step: 1, defaultValue: 150 },
    { id: "volumePlated", label: "Volume plated", kind: "number", unit: "mL", min: 0, step: 0.01, defaultValue: 0.1 },
    { id: "dilutionFactor", label: "Dilution factor", kind: "number", min: 1, step: 1, defaultValue: 1000, helpText: "e.g. enter 1000 for a 10⁻³ dilution" },
  ],
  calculate: (inputs) => {
    const colonies = num(inputs, "colonies")
    const volumePlated = num(inputs, "volumePlated")
    const dilutionFactor = num(inputs, "dilutionFactor")
    assertNonNegative(colonies, "Colony count")
    assertPositive(volumePlated, "Volume plated")
    assertPositive(dilutionFactor, "Dilution factor")

    const cfuPerMl = safeDivide(colonies, volumePlated, "volume plated") * dilutionFactor
    const rounded = round(cfuPerMl, 0)

    return {
      value: rounded,
      unit: "CFU/mL",
      display: `${rounded.toLocaleString()} CFU/mL`,
      calculationSteps: [`(${colonies} / ${volumePlated}) x ${dilutionFactor}`],
      warnings:
        colonies < 30 || colonies > 300
          ? ["Plates with 30-300 colonies are generally considered statistically reliable for counting; this count falls outside that range."]
          : undefined,
    }
  },
  notes: ["Countable range is conventionally 30-300 colonies per plate for reliable statistics."],
}

export const dilutionFactorCalculator: CalculatorDefinition = {
  id: "dilution-factor",
  name: "Dilution Factor",
  shortName: "Dilution Factor",
  category: "microbiology",
  description: "Calculates the dilution factor from initial and final volumes (or concentrations).",
  formula: "Dilution factor = final volume / initial (aliquot) volume",
  keywords: ["dilution factor", "dilution ratio", "microbiology"],
  relatedTools: ["cfu-per-ml", "concentration-after-dilution"],
  inputs: [
    { id: "aliquotVolume", label: "Aliquot (sample) volume", kind: "number", unit: "mL", min: 0, step: 0.01, defaultValue: 1 },
    { id: "finalVolume", label: "Final total volume", kind: "number", unit: "mL", min: 0, step: 0.01, defaultValue: 10 },
  ],
  calculate: (inputs) => {
    const aliquot = num(inputs, "aliquotVolume")
    const final = num(inputs, "finalVolume")
    assertPositive(aliquot, "Aliquot volume")
    assertPositive(final, "Final volume")

    const factor = safeDivide(final, aliquot, "aliquot volume")
    const rounded = round(factor, 2)

    return {
      value: rounded,
      display: `1:${rounded}`,
      secondary: [{ label: "As a fraction", value: `1/${rounded}` }],
      calculationSteps: [`${final} / ${aliquot}`],
    }
  },
}

export const concentrationAfterDilutionCalculator: CalculatorDefinition = {
  id: "concentration-after-dilution",
  name: "Concentration After Dilution",
  shortName: "Post-Dilution Conc.",
  category: "microbiology",
  description: "Calculates the resulting concentration after a single dilution step.",
  formula: "C2 = C1 / dilution factor",
  keywords: ["concentration after dilution", "microbiology", "dilution"],
  relatedTools: ["dilution-factor", "cfu-per-ml"],
  inputs: [
    { id: "initialConcentration", label: "Initial concentration", kind: "number", min: 0, step: 0.0001, defaultValue: 1000000 },
    { id: "dilutionFactor", label: "Dilution factor", kind: "number", min: 1, step: 0.01, defaultValue: 10, helpText: "e.g. enter 10 for a 1:10 dilution" },
  ],
  calculate: (inputs) => {
    const initial = num(inputs, "initialConcentration")
    const factor = num(inputs, "dilutionFactor")
    assertNonNegative(initial, "Initial concentration")
    assertPositive(factor, "Dilution factor")

    const final = safeDivide(initial, factor, "dilution factor")

    return {
      value: final,
      display: fmt(final, final < 1 ? 6 : 2),
      calculationSteps: [`${initial} / ${factor}`],
    }
  },
  notes: ["Use the same concentration units for input and output — this tool does not convert units."],
}
