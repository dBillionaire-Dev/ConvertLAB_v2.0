import type { CalculatorDefinition } from "../types"
import { num, str, assertPositive, assertNonNegative, round, fmt } from "../helpers"

export const creatinineClearanceCalculator: CalculatorDefinition = {
  id: "creatinine-clearance",
  name: "Creatinine Clearance (Cockcroft-Gault)",
  shortName: "CrCl",
  category: "renal",
  description: "Estimates creatinine clearance using the Cockcroft-Gault equation.",
  isEstimator: true,
  formula: "CrCl = [(140 - age) x weight(kg)] / (72 x Scr(mg/dL)) x (0.85 if female)",
  keywords: ["creatinine clearance", "crcl", "cockcroft-gault", "renal"],
  relatedTools: ["egfr-ckd-epi", "bun-creatinine-ratio"],
  inputs: [
    { id: "age", label: "Age", kind: "number", unit: "years", min: 0, defaultValue: 50 },
    { id: "weight", label: "Weight", kind: "number", unit: "kg", min: 0, defaultValue: 70 },
    { id: "creatinine", label: "Serum Creatinine", kind: "number", unit: "mg/dL", min: 0, step: 0.01, defaultValue: 1.0 },
    {
      id: "sex",
      label: "Sex",
      kind: "select",
      options: [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
      ],
      defaultValue: "male",
    },
  ],
  calculate: (inputs) => {
    const age = num(inputs, "age")
    const weight = num(inputs, "weight")
    const creatinine = num(inputs, "creatinine")
    const sex = str(inputs, "sex")
    assertPositive(weight, "Weight")
    if (creatinine <= 0) throw new Error("Serum creatinine must be greater than zero")

    const crcl = ((140 - age) * weight) / (72 * creatinine) * (sex === "female" ? 0.85 : 1)
    const rounded = round(crcl, 1)

    return {
      value: rounded,
      unit: "mL/min",
      display: fmt(rounded, 1, "mL/min"),
      calculationSteps: [
        `[(140 - ${age}) x ${weight}] / (72 x ${creatinine})${sex === "female" ? " x 0.85" : ""}`,
      ],
      warnings: age < 18 ? ["Cockcroft-Gault is validated for adults; use caution in pediatric patients."] : undefined,
    }
  },
  notes: ["Not adjusted for body surface area. Some institutions cap or adjust weight for obese patients."],
  limitations: ["Less accurate at extremes of body size/muscle mass; eGFR (CKD-EPI) is preferred for CKD staging."],
}

export const egfrCalculator: CalculatorDefinition = {
  id: "egfr-ckd-epi",
  name: "eGFR (CKD-EPI 2021)",
  shortName: "eGFR",
  category: "renal",
  description: "Estimates glomerular filtration rate using the race-free 2021 CKD-EPI creatinine equation.",
  isEstimator: true,
  formula: "eGFR = 142 x min(Scr/κ,1)^α x max(Scr/κ,1)^-1.200 x 0.9938^Age x (1.012 if female)",
  keywords: ["egfr", "gfr", "ckd-epi", "renal", "kidney"],
  relatedTools: ["creatinine-clearance", "bun-creatinine-ratio"],
  inputs: [
    { id: "age", label: "Age", kind: "number", unit: "years", min: 18, defaultValue: 50 },
    { id: "creatinine", label: "Serum Creatinine", kind: "number", unit: "mg/dL", min: 0, step: 0.01, defaultValue: 1.0 },
    {
      id: "sex",
      label: "Sex",
      kind: "select",
      options: [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
      ],
      defaultValue: "male",
    },
  ],
  calculate: (inputs) => {
    const age = num(inputs, "age")
    const creatinine = num(inputs, "creatinine")
    const sex = str(inputs, "sex")
    if (creatinine <= 0) throw new Error("Serum creatinine must be greater than zero")

    const kappa = sex === "female" ? 0.7 : 0.9
    const alpha = sex === "female" ? -0.241 : -0.302
    const ratio = creatinine / kappa
    const egfr =
      142 *
      Math.min(ratio, 1) ** alpha *
      Math.max(ratio, 1) ** -1.2 *
      0.9938 ** age *
      (sex === "female" ? 1.012 : 1)

    const rounded = round(egfr, 0)

    let stage = ""
    if (egfr >= 90) stage = "G1 (normal or high)"
    else if (egfr >= 60) stage = "G2 (mildly decreased)"
    else if (egfr >= 45) stage = "G3a (mildly-moderately decreased)"
    else if (egfr >= 30) stage = "G3b (moderately-severely decreased)"
    else if (egfr >= 15) stage = "G4 (severely decreased)"
    else stage = "G5 (kidney failure)"

    return {
      value: rounded,
      unit: "mL/min/1.73m²",
      display: fmt(rounded, 0, "mL/min/1.73m²"),
      secondary: [{ label: "CKD stage", value: stage }],
      calculationSteps: [`κ=${kappa}, α=${alpha}, Scr/κ=${round(ratio, 2)}`],
      interpretation: `Corresponds to CKD stage ${stage} by KDIGO GFR category.`,
    }
  },
  notes: [
    "Uses the 2021 CKD-EPI creatinine equation, which removed the race coefficient present in earlier versions.",
    "Validated for adults 18 years and older.",
  ],
  limitations: ["Not valid for acute kidney injury, pregnancy, extremes of muscle mass, or pediatric patients."],
}

export const bunCreatinineRatioCalculator: CalculatorDefinition = {
  id: "bun-creatinine-ratio",
  name: "BUN/Creatinine Ratio",
  shortName: "BUN/Cr",
  category: "renal",
  description: "Calculates the ratio of blood urea nitrogen to serum creatinine, both in mg/dL.",
  formula: "BUN/Cr ratio = BUN (mg/dL) / Creatinine (mg/dL)",
  keywords: ["bun", "creatinine ratio", "urea", "prerenal"],
  relatedTools: ["creatinine-clearance", "egfr-ckd-epi"],
  inputs: [
    { id: "bun", label: "BUN", kind: "number", unit: "mg/dL", min: 0, step: 0.1, defaultValue: 14 },
    { id: "creatinine", label: "Serum Creatinine", kind: "number", unit: "mg/dL", min: 0, step: 0.01, defaultValue: 1.0 },
  ],
  calculate: (inputs) => {
    const bun = num(inputs, "bun")
    const creatinine = num(inputs, "creatinine")
    assertNonNegative(bun, "BUN")
    if (creatinine <= 0) throw new Error("Serum creatinine must be greater than zero")

    const ratio = bun / creatinine
    const rounded = round(ratio, 1)

    let interpretation = "Within the typical 10:1-20:1 range."
    if (ratio > 20) interpretation = "Elevated ratio — can suggest a prerenal cause (e.g. dehydration, GI bleed) or high protein intake."
    else if (ratio < 10) interpretation = "Low ratio — can be seen with low protein intake, liver disease, or intrinsic renal causes."

    return {
      value: rounded,
      display: fmt(rounded, 1, ":1"),
      calculationSteps: [`${bun} / ${creatinine}`],
      interpretation,
    }
  },
  notes: ["Reference ranges vary by laboratory; this is a general guide, not a diagnostic threshold."],
}
