import type { CalculatorDefinition } from "../types"
import { num, assertPositive, safeDivide, round, fmt } from "../helpers"

export const molarityCalculator: CalculatorDefinition = {
  id: "molarity",
  name: "Molarity Calculator",
  shortName: "Molarity",
  category: "lab-solutions",
  description: "Calculates the molar concentration of a solution from mass, molecular weight, and volume.",
  formula: "Molarity (M) = mass (g) / [molecular weight (g/mol) x volume (L)]",
  keywords: ["molarity", "molar concentration", "solution"],
  relatedTools: ["normality"],
  inputs: [
    { id: "mass", label: "Mass of solute", kind: "number", unit: "g", min: 0, step: 0.001, defaultValue: 5.85 },
    { id: "molecularWeight", label: "Molecular weight", kind: "number", unit: "g/mol", min: 0, step: 0.01, defaultValue: 58.44 },
    { id: "volume", label: "Solution volume", kind: "number", unit: "L", min: 0, step: 0.001, defaultValue: 1 },
  ],
  calculate: (inputs) => {
    const mass = num(inputs, "mass")
    const mw = num(inputs, "molecularWeight")
    const volume = num(inputs, "volume")
    assertPositive(mw, "Molecular weight")
    assertPositive(volume, "Volume")

    const moles = safeDivide(mass, mw, "molecular weight")
    const molarity = safeDivide(moles, volume, "volume")
    const rounded = round(molarity, 4)

    return {
      value: rounded,
      unit: "M",
      display: fmt(rounded, 4, "M"),
      secondary: [
        { label: "mM", value: fmt(round(molarity * 1000, 2), 2) },
        { label: "µM", value: fmt(round(molarity * 1_000_000, 1), 1) },
        { label: "Moles of solute", value: fmt(round(moles, 4), 4, "mol") },
      ],
      calculationSteps: [`moles = ${mass} / ${mw} = ${round(moles, 4)} mol`, `M = ${round(moles, 4)} / ${volume} L`],
    }
  },
  notes: ["To prepare a solution of a target molarity, solve for mass: mass = M x MW x volume."],
}

export const normalityCalculator: CalculatorDefinition = {
  id: "normality",
  name: "Normality Calculator",
  shortName: "Normality",
  category: "lab-solutions",
  description: "Calculates normality from mass, equivalent weight, and volume.",
  formula: "Normality (N) = mass (g) / [equivalent weight (g/eq) x volume (L)]",
  keywords: ["normality", "equivalent weight", "solution"],
  relatedTools: ["molarity"],
  inputs: [
    { id: "mass", label: "Mass of solute", kind: "number", unit: "g", min: 0, step: 0.001, defaultValue: 4.9 },
    {
      id: "equivalentWeight",
      label: "Equivalent weight",
      kind: "number",
      unit: "g/eq",
      min: 0,
      step: 0.01,
      defaultValue: 49,
      helpText: "Equivalent weight depends on the reaction context (e.g. valence for acids/bases or redox reactions).",
    },
    { id: "volume", label: "Solution volume", kind: "number", unit: "L", min: 0, step: 0.001, defaultValue: 1 },
  ],
  calculate: (inputs) => {
    const mass = num(inputs, "mass")
    const eqWeight = num(inputs, "equivalentWeight")
    const volume = num(inputs, "volume")
    assertPositive(eqWeight, "Equivalent weight")
    assertPositive(volume, "Volume")

    const equivalents = safeDivide(mass, eqWeight, "equivalent weight")
    const normality = safeDivide(equivalents, volume, "volume")
    const rounded = round(normality, 4)

    return {
      value: rounded,
      unit: "N",
      display: fmt(rounded, 4, "N"),
      secondary: [{ label: "mN", value: fmt(round(normality * 1000, 2), 2) }],
      calculationSteps: [`equivalents = ${mass} / ${eqWeight}`, `N = ${round(equivalents, 4)} / ${volume} L`],
    }
  },
  notes: ["Equivalent weight depends on the reaction context, it is not a fixed property of a substance."],
}
