import type { CalculatorDefinition } from "../types"
import { num, str, assertPositive, safeDivide, round, fmt } from "../helpers"

export const redCellIndicesCalculator: CalculatorDefinition = {
  id: "red-cell-indices",
  name: "Red Cell Indices",
  shortName: "RBC Indices",
  category: "hematology",
  description:
    "Calculates MCV, MCH, and MCHC from hemoglobin, hematocrit, and RBC count.",
  formula:
    "MCV = (Hct × 10) / RBC; MCH = (Hgb × 10) / RBC; MCHC = (Hgb / Hct) × 100",
  keywords: [
    "red cell indices",
    "rbc indices",
    "mcv",
    "mch",
    "mchc",
    "mean corpuscular volume",
    "mean corpuscular hemoglobin",
    "mean corpuscular hemoglobin concentration",
  ],
  relatedTools: ["absolute-cell-count", "hematocrit-estimate"],
  inputs: [
    {
      id: "hgb",
      label: "Hemoglobin",
      kind: "number",
      unit: "g/dL",
      min: 0,
      step: 0.1,
      defaultValue: 14,
    },
    {
      id: "hct",
      label: "Hematocrit",
      kind: "number",
      unit: "%",
      min: 0,
      step: 0.1,
      defaultValue: 42,
    },
    {
      id: "rbc",
      label: "RBC Count",
      kind: "number",
      unit: "10¹²/L",
      min: 0,
      step: 0.01,
      defaultValue: 4.8,
    },
  ],
  calculate: (inputs) => {
    const hgb = num(inputs, "hgb")
    const hct = num(inputs, "hct")
    const rbc = num(inputs, "rbc")

    assertPositive(rbc, "RBC count")
    assertPositive(hct, "Hematocrit")

    const mcv = round(safeDivide(hct * 10, rbc, "RBC count"), 1)
    const mch = round(safeDivide(hgb * 10, rbc, "RBC count"), 1)
    const mchc = round(safeDivide(hgb, hct, "Hematocrit") * 100, 1)

    return {
      value: mcv,
      unit: "fL",
      display: `MCV: ${fmt(mcv, 1, "fL")}`,
      secondary: [
        {
          label: "MCH",
          value: fmt(mch, 1, "pg"),
        },
        {
          label: "MCHC",
          value: fmt(mchc, 1, "g/dL"),
        },
      ],
      calculationSteps: [
        `MCV = (${hct} x 10) / ${rbc}`,
        `MCH = (${hgb} x 10) / ${rbc}`,
        `MCHC = (${hgb} / ${hct}) x 100`,
      ],
      warnings:
        mchc > 38
          ? [
              "MCHC above ~36-38 g/dL is physiologically unusual and may indicate a specimen or analyzer artifact.",
            ]
          : undefined,
    }
  },
  notes: [
    "MCV, MCH, and MCHC are commonly interpreted together as red cell indices.",
    "Reference intervals vary by laboratory, age, and clinical context.",
  ],
}

export const mcvCalculator: CalculatorDefinition = {
  id: "mcv",
  name: "Mean Corpuscular Volume",
  shortName: "MCV",
  category: "hematology",
  description: "Calculates mean corpuscular volume from hematocrit and RBC count.",
  formula: "MCV (fL) = (Hct[%] x 10) / RBC(10¹²/L)",
  keywords: ["mcv", "mean corpuscular volume", "red cell indices"],
  relatedTools: ["mch", "mchc"],
  inputs: [
    { id: "hct", label: "Hematocrit", kind: "number", unit: "%", min: 0, step: 0.1, defaultValue: 42 },
    { id: "rbc", label: "RBC Count", kind: "number", unit: "10¹²/L", min: 0, step: 0.01, defaultValue: 4.8 },
  ],
  calculate: (inputs) => {
    const hct = num(inputs, "hct")
    const rbc = num(inputs, "rbc")
    assertPositive(rbc, "RBC count")
    const mcv = safeDivide(hct * 10, rbc, "RBC count")
    const rounded = round(mcv, 1)
    return {
      value: rounded,
      unit: "fL",
      display: fmt(rounded, 1, "fL"),
      calculationSteps: [`(${hct} x 10) / ${rbc}`],
    }
  },
}

export const mchCalculator: CalculatorDefinition = {
  id: "mch",
  name: "Mean Corpuscular Hemoglobin",
  shortName: "MCH",
  category: "hematology",
  description: "Calculates mean corpuscular hemoglobin from hemoglobin and RBC count.",
  formula: "MCH (pg) = (Hgb[g/dL] x 10) / RBC(10¹²/L)",
  keywords: ["mch", "mean corpuscular hemoglobin", "red cell indices"],
  relatedTools: ["mcv", "mchc"],
  inputs: [
    { id: "hgb", label: "Hemoglobin", kind: "number", unit: "g/dL", min: 0, step: 0.1, defaultValue: 14 },
    { id: "rbc", label: "RBC Count", kind: "number", unit: "10¹²/L", min: 0, step: 0.01, defaultValue: 4.8 },
  ],
  calculate: (inputs) => {
    const hgb = num(inputs, "hgb")
    const rbc = num(inputs, "rbc")
    assertPositive(rbc, "RBC count")
    const mch = safeDivide(hgb * 10, rbc, "RBC count")
    const rounded = round(mch, 1)
    return {
      value: rounded,
      unit: "pg",
      display: fmt(rounded, 1, "pg"),
      calculationSteps: [`(${hgb} x 10) / ${rbc}`],
    }
  },
}

export const mchcCalculator: CalculatorDefinition = {
  id: "mchc",
  name: "Mean Corpuscular Hemoglobin Concentration",
  shortName: "MCHC",
  category: "hematology",
  description: "Calculates mean corpuscular hemoglobin concentration from hemoglobin and hematocrit.",
  formula: "MCHC (g/dL) = (Hgb[g/dL] / Hct[%]) x 100",
  keywords: ["mchc", "hemoglobin concentration", "red cell indices"],
  relatedTools: ["mcv", "mch"],
  inputs: [
    { id: "hgb", label: "Hemoglobin", kind: "number", unit: "g/dL", min: 0, step: 0.1, defaultValue: 14 },
    { id: "hct", label: "Hematocrit", kind: "number", unit: "%", min: 0, step: 0.1, defaultValue: 42 },
  ],
  calculate: (inputs) => {
    const hgb = num(inputs, "hgb")
    const hct = num(inputs, "hct")
    assertPositive(hct, "Hematocrit")
    const mchc = safeDivide(hgb, hct, "Hematocrit") * 100
    const rounded = round(mchc, 1)
    return {
      value: rounded,
      unit: "g/dL",
      display: fmt(rounded, 1, "g/dL"),
      calculationSteps: [`(${hgb} / ${hct}) x 100`],
      warnings: mchc > 38 ? ["Result above ~36-38 g/dL is physiologically unusual and may indicate a specimen or analyzer artifact."] : undefined,
    }
  },
}

const CELL_TYPES = [
  { value: "neutrophil", label: "Neutrophils (ANC)" },
  { value: "lymphocyte", label: "Lymphocytes (ALC)" },
  { value: "eosinophil", label: "Eosinophils (AEC)" },
  { value: "monocyte", label: "Monocytes (AMC)" },
]

export const absoluteCellCountCalculator: CalculatorDefinition = {
  id: "absolute-cell-count",
  name: "Absolute Cell Count",
  shortName: "Abs. Count",
  category: "hematology",
  description: "Calculates an absolute white cell count (e.g. ANC, ALC) from total WBC and differential percentage.",
  formula: "Absolute count = WBC(x10⁹/L) x (differential % / 100)",
  keywords: ["anc", "absolute neutrophil count", "alc", "aec", "amc", "differential"],
  relatedTools: ["mcv", "mch", "mchc", "corrected-wbc"],
  inputs: [
    {
      id: "cellType",
      label: "Cell type",
      kind: "select",
      options: CELL_TYPES,
      defaultValue: "neutrophil",
    },
    { id: "wbc", label: "Total WBC", kind: "number", unit: "x10⁹/L", min: 0, step: 0.01, defaultValue: 7.5 },
    { id: "percent", label: "Differential %", kind: "number", unit: "%", min: 0, max: 100, step: 0.1, defaultValue: 60 },
  ],
  calculate: (inputs) => {
    const cellType = str(inputs, "cellType")
    const wbc = num(inputs, "wbc")
    const percent = num(inputs, "percent")
    assertPositive(wbc, "WBC")
    if (percent < 0 || percent > 100) throw new Error("Differential percentage must be between 0 and 100")

    const absoluteK = wbc * (percent / 100)
    const rounded = round(absoluteK, 2)
    const label = CELL_TYPES.find((c) => c.value === cellType)?.label ?? "Absolute count"

    let interpretation: string | undefined
    if (cellType === "neutrophil") {
      if (absoluteK < 0.5) interpretation = "Severe neutropenia range (<0.5 ×10⁹/L)."
      else if (absoluteK < 1.0) interpretation = "Moderate neutropenia range (0.5-1.0 ×10⁹/L)."
      else if (absoluteK < 1.5) interpretation = "Mild neutropenia range (1.0-1.5 ×10⁹/L)."
    }

    return {
      value: rounded,
      unit: "x10⁹/L",
      display: fmt(rounded, 2, "x10⁹/L"),
      secondary: [{ label: "In cells/µL", value: fmt(round(absoluteCells, 0), 0, "cells/µL") }],
      calculationSteps: [`${wbc} x (${percent} / 100)`],
      interpretation: interpretation ? `${label}: ${interpretation}` : undefined,
    }
  },
  notes: ["Reference ranges vary by age, laboratory, and analyzer; interpret against your local reference interval."],
}

export const correctedWbcCalculator: CalculatorDefinition = {
  id: "corrected-wbc",
  name: "Corrected WBC Count",
  shortName: "Corr. WBC",
  category: "hematology",
  description: "Corrects the total WBC count for the presence of nucleated red blood cells (nRBCs).",
  formula: "Corrected WBC = (Uncorrected WBC x 100) / (100 + nRBC per 100 WBC)",
  keywords: ["corrected wbc", "nucleated red blood cells", "nrbc"],
  relatedTools: ["absolute-cell-count"],
  inputs: [
    { id: "wbc", label: "Uncorrected WBC", kind: "number", unit: "x10⁹/L", min: 0, step: 0.01, defaultValue: 15 },
    { id: "nrbc", label: "nRBC per 100 WBC", kind: "number", min: 0, step: 1, defaultValue: 10 },
  ],
  calculate: (inputs) => {
    const wbc = num(inputs, "wbc")
    const nrbc = num(inputs, "nrbc")
    assertPositive(wbc, "Uncorrected WBC")
    if (nrbc < 0) throw new Error("nRBC count cannot be negative")

    const corrected = (wbc * 100) / (100 + nrbc)
    const rounded = round(corrected, 2)

    return {
      value: rounded,
      unit: "x10⁹/L",
      display: fmt(rounded, 2, "x10⁹/L"),
      calculationSteps: [`(${wbc} x 100) / (100 + ${nrbc})`],
      warnings: nrbc === 0 ? ["No correction needed when nRBC count is zero. Corrected value equals the uncorrected count."] : undefined,
    }
  },
  notes: ["Automated analyzers count nucleated RBCs as WBCs; this correction removes that overestimate when a manual differential reports nRBCs."],
}

export const hematocritEstimateCalculator: CalculatorDefinition = {
  id: "hematocrit-estimate",
  name: "Hematocrit Estimation",
  shortName: "Est. Hct",
  category: "hematology",
  description: "Estimates hematocrit from hemoglobin using the commonly cited 'rule of three'.",
  isEstimator: true,
  formula: "Hct (%) ≈ Hgb (g/dL) x 3",
  keywords: ["hematocrit estimation", "rule of three", "hgb hct relationship"],
  relatedTools: ["mcv", "mchc"],
  inputs: [{ id: "hgb", label: "Hemoglobin", kind: "number", unit: "g/dL", min: 0, step: 0.1, defaultValue: 14 }],
  calculate: (inputs) => {
    const hgb = num(inputs, "hgb")
    assertPositive(hgb, "Hemoglobin")

    const hct = hgb * 3
    const rounded = round(hct, 1)

    return {
      value: rounded,
      unit: "%",
      display: fmt(rounded, 1, "%"),
      calculationSteps: [`${hgb} x 3`],
      warnings: ["This is a rough approximation, actual Hgb:Hct ratio varies with red cell size (MCV) and shape; a measured hematocrit should be used whenever available."],
    }
  },
  notes: ["The 'rule of three' (Hct ≈ 3 x Hgb) is a bedside approximation, not a substitute for a measured hematocrit."],
  limitations: ["Less accurate with abnormal MCV (microcytosis/macrocytosis) or abnormal red cell morphology."],
}
