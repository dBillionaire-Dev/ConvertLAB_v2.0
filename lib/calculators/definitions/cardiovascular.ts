import type { CalculatorDefinition } from "../types"
import { num, str, assertPositive, round, fmt } from "../helpers"

const yesNo = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes" },
]

export const meanArterialPressureCalculator: CalculatorDefinition = {
  id: "mean-arterial-pressure",
  name: "Mean Arterial Pressure",
  shortName: "MAP",
  category: "cardiovascular",
  subcategory: "hypertension",
  description: "Estimates mean arterial pressure from systolic and diastolic blood pressure.",
  formula: "MAP ≈ (SBP + 2 × DBP) ÷ 3",
  inputs: [
    { id: "sbp", label: "Systolic BP", kind: "number", unit: "mmHg", min: 1, max: 400, step: 1 },
    { id: "dbp", label: "Diastolic BP", kind: "number", unit: "mmHg", min: 1, max: 300, step: 1 },
  ],
  calculate: (inputs) => {
    const sbp = num(inputs, "sbp"), dbp = num(inputs, "dbp")
    assertPositive(sbp, "Systolic BP"); assertPositive(dbp, "Diastolic BP")
    if (dbp >= sbp) throw new Error("Diastolic BP should be lower than systolic BP.")
    const map = round((sbp + 2 * dbp) / 3, 1)
    return { value: map, unit: "mmHg", display: fmt(map, 1, "mmHg"), calculationSteps: [`(${sbp} + 2 × ${dbp}) ÷ 3 = ${map} mmHg`] }
  },
  notes: ["This is an arithmetic estimate; arterial waveform and clinical context can affect actual mean pressure."]
}

export const ejectionFractionCalculator: CalculatorDefinition = {
  id: "ejection-fraction",
  name: "Left Ventricular Ejection Fraction",
  shortName: "LVEF",
  category: "cardiovascular",
  subcategory: "heart-failure",
  description: "Calculates ejection fraction from end-diastolic and end-systolic ventricular volumes.",
  formula: "EF (%) = (EDV − ESV) ÷ EDV × 100",
  inputs: [
    { id: "edv", label: "End-diastolic volume", kind: "number", unit: "mL", min: 0.1, step: 1 },
    { id: "esv", label: "End-systolic volume", kind: "number", unit: "mL", min: 0, step: 1 },
  ],
  calculate: (inputs) => {
    const edv = num(inputs, "edv"), esv = num(inputs, "esv")
    assertPositive(edv, "End-diastolic volume")
    if (esv < 0 || esv > edv) throw new Error("End-systolic volume must be between 0 and EDV.")
    const ef = round(((edv - esv) / edv) * 100, 1)
    return { value: ef, unit: "%", display: fmt(ef, 1, "%"), calculationSteps: [`(${edv} − ${esv}) ÷ ${edv} × 100 = ${ef}%`] }
  },
  notes: ["Interpret ejection fraction using the imaging method, laboratory/echo context, and applicable guideline definitions."]
}

export const cha2ds2VascCalculator: CalculatorDefinition = {
  id: "cha2ds2-vasc",
  name: "CHA₂DS₂-VASc Score",
  shortName: "CHA₂DS₂-VASc",
  category: "cardiovascular",
  subcategory: "anticoagulation",
  description: "Calculates the CHA₂DS₂-VASc thromboembolic risk score for atrial fibrillation/flutter risk assessment.",
  inputs: [
    { id: "chf", label: "Heart failure / LV dysfunction", kind: "select", options: yesNo },
    { id: "hypertension", label: "Hypertension", kind: "select", options: yesNo },
    { id: "age", label: "Age", kind: "number", unit: "years", min: 18, max: 120, step: 1 },
    { id: "diabetes", label: "Diabetes", kind: "select", options: yesNo },
    { id: "stroke", label: "Prior stroke / TIA / systemic embolism", kind: "select", options: yesNo },
    { id: "vascular", label: "Vascular disease", kind: "select", options: yesNo },
    { id: "sex", label: "Sex", kind: "select", options: [{ value: "male", label: "Male" }, { value: "female", label: "Female" }] },
  ],
  calculate: (inputs) => {
    const age = num(inputs, "age")
    const score = (str(inputs,"chf") === "yes" ? 1 : 0) + (str(inputs,"hypertension") === "yes" ? 1 : 0) + (age >= 75 ? 2 : age >= 65 ? 1 : 0) + (str(inputs,"diabetes") === "yes" ? 1 : 0) + (str(inputs,"stroke") === "yes" ? 2 : 0) + (str(inputs,"vascular") === "yes" ? 1 : 0) + (str(inputs,"sex") === "female" ? 1 : 0)
    return { value: score, display: `CHA₂DS₂-VASc: ${score}`, interpretation: "Risk score only; current AF guidelines use validated risk assessment together with clinical context and shared decision-making.", calculationSteps: ["C = 1, H = 1, A₂ = age ≥75 (2), D = 1, S₂ = prior stroke/TIA/systemic embolism (2), V = 1, A = age 65–74 (1), Sc = female sex (1)."] }
  },
  notes: ["The 2023 ACC/AHA/ACCP/HRS AF guideline continues to use validated clinical risk scores such as CHA₂DS₂-VASc to assess thromboembolic risk."]
}

export const daptScoreCalculator: CalculatorDefinition = {
  id: "dapt-score",
  name: "DAPT Score",
  shortName: "DAPT Score",
  category: "cardiovascular",
  subcategory: "antiplatelet",
  description: "Calculates the Dual Antiplatelet Therapy score from the documented clinical and PCI factors used in the original score.",
  inputs: [
    { id: "age", label: "Age", kind: "number", unit: "years", min: 18, max: 120, step: 1 },
    { id: "smoker", label: "Current cigarette smoker", kind: "select", options: yesNo },
    { id: "diabetes", label: "Diabetes mellitus", kind: "select", options: yesNo },
    { id: "miPresentation", label: "MI at presentation", kind: "select", options: yesNo },
    { id: "priorPciMi", label: "Prior PCI or prior MI", kind: "select", options: yesNo },
    { id: "smallStent", label: "Stent diameter <3 mm", kind: "select", options: yesNo },
    { id: "paclitaxelStent", label: "Paclitaxel-eluting stent", kind: "select", options: yesNo },
    { id: "chfLowEf", label: "CHF or LVEF <30%", kind: "select", options: yesNo },
    { id: "veinGraft", label: "Saphenous vein graft PCI", kind: "select", options: yesNo },
  ],
  calculate: (inputs) => {
    const age = num(inputs, "age")
    const score = (age >= 75 ? -2 : age >= 65 ? -1 : 0) + (str(inputs,"smoker") === "yes" ? 1 : 0) + (str(inputs,"diabetes") === "yes" ? 1 : 0) + (str(inputs,"miPresentation") === "yes" ? 1 : 0) + (str(inputs,"priorPciMi") === "yes" ? 1 : 0) + (str(inputs,"smallStent") === "yes" ? 1 : 0) + (str(inputs,"paclitaxelStent") === "yes" ? 1 : 0) + (str(inputs,"chfLowEf") === "yes" ? 2 : 0) + (str(inputs,"veinGraft") === "yes" ? 2 : 0)
    return { value: score, display: `DAPT score: ${score}`, interpretation: "Use the score only in the population and timing for which the DAPT score was validated; do not use it alone to prescribe or extend antiplatelet therapy.", calculationSteps: ["Age: ≥75 = −2; 65–74 = −1; <65 = 0.", "Smoking, diabetes, MI at presentation, prior PCI/MI, stent <3 mm and paclitaxel-eluting stent each add 1 point; CHF/LVEF <30% adds 2; vein-graft PCI adds 2."] }
  },
  notes: ["The ACC/AHA DAPT focused update documents these component weights and cautions that the score is intended to inform duration decisions in appropriate post-PCI patients."]
}

export const qtcCalculator: CalculatorDefinition = {
  id: "qtc-correction",
  name: "QTc Correction",
  shortName: "QTc",
  category: "cardiovascular",
  subcategory: "arrhythmia",
  description: "Calculates corrected QT using Bazett and Fridericia methods from QT interval and heart rate.",
  inputs: [
    { id: "qt", label: "QT interval", kind: "number", unit: "ms", min: 1, step: 1 },
    { id: "heartRate", label: "Heart rate", kind: "number", unit: "bpm", min: 1, max: 300, step: 1 },
  ],
  calculate: (inputs) => {
    const qt = num(inputs,"qt"), hr = num(inputs,"heartRate")
    assertPositive(qt,"QT interval"); assertPositive(hr,"Heart rate")
    const rr = 60 / hr
    const qts = qt / 1000
    const bazett = round((qts / Math.sqrt(rr)) * 1000, 0)
    const fridericia = round((qts / Math.cbrt(rr)) * 1000, 0)
    return { value: bazett, unit: "ms", display: `QTc Bazett: ${bazett} ms`, secondary: [{label:"QTc Fridericia", value:`${fridericia} ms`}], calculationSteps:[`RR = 60 ÷ ${hr} = ${round(rr,3)} s`, `Bazett: QTc = QT ÷ √RR = ${bazett} ms`, `Fridericia: QTc = QT ÷ RR^(1/3) = ${fridericia} ms`], warnings:["QTc interpretation depends on ECG quality, heart rate, measurement method, medications, electrolytes and clinical context."] }
  },
  notes: ["Bazett and Fridericia are correction formulas; the result is not a diagnosis of long-QT syndrome or an indication to change medication by itself."]
}

export const atherogenicIndexCalculator: CalculatorDefinition = {
  id: "atherogenic-index-plasma",
  name: "Atherogenic Index of Plasma",
  shortName: "AIP",
  category: "cardiovascular",
  subcategory: "risk-prevention",
  description: "Calculates the logarithm of the triglyceride-to-HDL cholesterol ratio using mmol/L inputs.",
  formula: "AIP = log10(TG / HDL-C)",
  inputs: [
    { id: "triglycerides", label: "Triglycerides", kind: "number", unit: "mmol/L", min: 0.001, step: 0.01 },
    { id: "hdl", label: "HDL cholesterol", kind: "number", unit: "mmol/L", min: 0.001, step: 0.01 },
  ],
  calculate: (inputs) => {
    const tg = num(inputs,"triglycerides"), hdl = num(inputs,"hdl")
    assertPositive(tg,"Triglycerides"); assertPositive(hdl,"HDL cholesterol")
    const aip = round(Math.log10(tg / hdl), 3)
    return { value:aip, display:`AIP: ${aip}`, interpretation:"AIP is a calculated lipid-derived marker. Published cut-points vary by population and assay context; interpret with the complete cardiovascular risk profile rather than as a stand-alone treatment trigger.", calculationSteps:[`log10(${tg} ÷ ${hdl}) = ${aip}`] }
  },
  notes:["Use mmol/L for both triglyceride and HDL inputs; do not mix units."]
}
