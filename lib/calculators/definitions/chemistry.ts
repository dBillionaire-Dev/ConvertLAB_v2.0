import type { CalculatorDefinition } from "../types"
import { num, str, round, fmt } from "../helpers"

const unitOption = (opts: { value: string; label: string }[]) => opts

export const ldlCalculator: CalculatorDefinition = {
  id: "ldl-friedewald",
  name: "LDL Cholesterol (Friedewald)",
  shortName: "LDL",
  category: "chemistry",
  description: "Estimates LDL cholesterol from total cholesterol, HDL, and triglycerides.",
  isEstimator: true,
  formula: "LDL = TC - HDL - TG/5 (mg/dL) or TC - HDL - TG/2.2 (mmol/L)",
  keywords: ["ldl", "cholesterol", "friedewald", "lipid"],
  relatedTools: ["non-hdl-cholesterol", "vldl-estimate"],
  inputs: [
    {
      id: "unit",
      label: "Units",
      kind: "select",
      options: unitOption([
        { value: "mg/dL", label: "mg/dL" },
        { value: "mmol/L", label: "mmol/L" },
      ]),
      defaultValue: "mg/dL",
    },
    { id: "tc", label: "Total Cholesterol", kind: "number", min: 0, step: 0.01, defaultValue: 200 },
    { id: "hdl", label: "HDL", kind: "number", min: 0, step: 0.01, defaultValue: 50 },
    { id: "tg", label: "Triglycerides", kind: "number", min: 0, step: 0.01, defaultValue: 150 },
  ],
  calculate: (inputs) => {
    const unit = str(inputs, "unit")
    const tc = num(inputs, "tc")
    const hdl = num(inputs, "hdl")
    const tg = num(inputs, "tg")
    const divisor = unit === "mmol/L" ? 2.2 : 5

    if (tg > (unit === "mmol/L" ? 4.5 : 400)) {
      return {
        value: "N/A",
        display: "Not valid, TG too high",
        warnings: [
          "The Friedewald equation is unreliable when triglycerides exceed ~400 mg/dL (4.5 mmol/L). Use direct LDL measurement instead.",
        ],
      }
    }

    const ldl = tc - hdl - tg / divisor
    const rounded = round(ldl, unit === "mmol/L" ? 2 : 1)

    return {
      value: rounded,
      unit,
      display: fmt(rounded, unit === "mmol/L" ? 2 : 1, unit),
      calculationSteps: [`${tc} - ${hdl} - (${tg} / ${divisor})`],
      warnings: ldl < 0 ? ["Calculated LDL is negative, check input values."] : undefined,
    }
  },
  notes: ["The Friedewald equation is an estimate, not a directly measured value."],
  limitations: ["Not valid for triglycerides above ~400 mg/dL (4.5 mmol/L) or in non-fasting samples."],
}

export const nonHdlCalculator: CalculatorDefinition = {
  id: "non-hdl-cholesterol",
  name: "Non-HDL Cholesterol",
  shortName: "Non-HDL",
  category: "chemistry",
  description: "Calculates non-HDL cholesterol (total cholesterol minus HDL).",
  formula: "Non-HDL = TC - HDL",
  keywords: ["non-hdl", "cholesterol", "lipid"],
  relatedTools: ["ldl-friedewald", "vldl-estimate"],
  inputs: [
    { id: "tc", label: "Total Cholesterol", kind: "number", unit: "mg/dL", min: 0, step: 0.01, defaultValue: 200 },
    { id: "hdl", label: "HDL", kind: "number", unit: "mg/dL", min: 0, step: 0.01, defaultValue: 50 },
  ],
  calculate: (inputs) => {
    const tc = num(inputs, "tc")
    const hdl = num(inputs, "hdl")
    const value = round(tc - hdl, 1)
    return {
      value,
      unit: "mg/dL",
      display: fmt(value, 1, "mg/dL"),
      calculationSteps: [`${tc} - ${hdl}`],
    }
  },
}

export const vldlCalculator: CalculatorDefinition = {
  id: "vldl-estimate",
  name: "VLDL Estimation",
  shortName: "VLDL",
  category: "chemistry",
  description: "Estimates VLDL cholesterol from triglycerides.",
  isEstimator: true,
  formula: "VLDL = TG / 5 (mg/dL)",
  keywords: ["vldl", "cholesterol", "triglycerides"],
  relatedTools: ["ldl-friedewald", "non-hdl-cholesterol"],
  inputs: [{ id: "tg", label: "Triglycerides", kind: "number", unit: "mg/dL", min: 0, step: 0.01, defaultValue: 150 }],
  calculate: (inputs) => {
    const tg = num(inputs, "tg")
    const value = round(tg / 5, 1)
    return {
      value,
      unit: "mg/dL",
      display: fmt(value, 1, "mg/dL"),
      calculationSteps: [`${tg} / 5`],
      warnings: tg > 400 ? ["Estimate is unreliable above ~400 mg/dL triglycerides."] : undefined,
    }
  },
  limitations: ["Only valid when triglycerides are below ~400 mg/dL."],
}

export const anionGapCalculator: CalculatorDefinition = {
  id: "anion-gap",
  name: "Anion Gap",
  shortName: "AG",
  category: "chemistry",
  description: "Calculates the serum anion gap, with optional albumin correction.",
  formula: "AG = Na - (Cl + HCO3); Corrected AG = AG + 2.5 x (4 - albumin[g/dL])",
  keywords: ["anion gap", "electrolytes", "acid-base"],
  relatedTools: ["corrected-calcium"],
  inputs: [
    { id: "na", label: "Sodium", kind: "number", unit: "mmol/L", min: 0, defaultValue: 140 },
    { id: "cl", label: "Chloride", kind: "number", unit: "mmol/L", min: 0, defaultValue: 104 },
    { id: "hco3", label: "Bicarbonate", kind: "number", unit: "mmol/L", min: 0, defaultValue: 24 },
    {
      id: "albumin",
      label: "Albumin (optional, for correction)",
      kind: "number",
      unit: "g/dL",
      min: 0,
      step: 0.1,
      optional: true,
    },
  ],
  calculate: (inputs) => {
    const na = num(inputs, "na")
    const cl = num(inputs, "cl")
    const hco3 = num(inputs, "hco3")
    const albuminRaw = inputs["albumin"]

    const ag = na - (cl + hco3)
    const rounded = round(ag, 1)

    const secondary = []
    if (albuminRaw !== undefined && albuminRaw !== "") {
      const albumin = num(inputs, "albumin")
      const corrected = ag + 2.5 * (4 - albumin)
      secondary.push({ label: "Albumin-corrected AG", value: fmt(round(corrected, 1), 1, "mmol/L") })
    }

    return {
      value: rounded,
      unit: "mmol/L",
      display: fmt(rounded, 1, "mmol/L"),
      secondary: secondary.length ? secondary : undefined,
      calculationSteps: [`${na} - (${cl} + ${hco3})`],
      interpretation: "Typical reference interval is approximately 8-16 mmol/L, but varies by laboratory and method.",
    }
  },
  notes: ["Low albumin lowers the measured anion gap; correct for albumin when interpreting in hypoalbuminemia."],
}

export const correctedCalciumCalculator: CalculatorDefinition = {
  id: "corrected-calcium",
  name: "Corrected Calcium",
  shortName: "Corr. Ca",
  category: "chemistry",
  description: "Corrects total serum calcium for abnormal albumin concentration.",
  formula: "Corrected Ca (mg/dL) = Measured Ca + 0.8 x (4 - Albumin[g/dL])",
  keywords: ["calcium", "corrected calcium", "albumin"],
  relatedTools: ["anion-gap"],
  inputs: [
    { id: "calcium", label: "Measured Calcium", kind: "number", unit: "mg/dL", min: 0, step: 0.01, defaultValue: 9 },
    { id: "albumin", label: "Albumin", kind: "number", unit: "g/dL", min: 0, step: 0.1, defaultValue: 4 },
  ],
  calculate: (inputs) => {
    const calcium = num(inputs, "calcium")
    const albumin = num(inputs, "albumin")
    const corrected = calcium + 0.8 * (4 - albumin)
    const rounded = round(corrected, 2)

    return {
      value: rounded,
      unit: "mg/dL",
      display: fmt(rounded, 2, "mg/dL"),
      calculationSteps: [`${calcium} + 0.8 x (4 - ${albumin})`],
    }
  },
  limitations: ["An approximation, ionized calcium measurement is more accurate when available, particularly in critical illness."],
}
