export interface ReferenceRange {
  analyte: string
  range: string
  unit: string
  note?: string
}

export interface ReferenceRangeGroup {
  id: string
  title: string
  ranges: ReferenceRange[]
}

/**
 * Widely-published "typical adult" reference ranges, shown as general
 * examples only. These are NOT diagnostic cutoffs — every group carries
 * the required vary-by-lab caveat wherever it is rendered.
 */
export const hematologyReferenceRanges: ReferenceRangeGroup = {
  id: "hematology",
  title: "Hematology",
  ranges: [
    { analyte: "Hemoglobin (male)", range: "13.3-18.0", unit: "g/dL" },
    { analyte: "Hemoglobin (female)", range: "12.0-16.0", unit: "g/dL" },
    { analyte: "Hematocrit (male)", range: "40.0-54.0", unit: "%" },
    { analyte: "Hematocrit (female)", range: "36.0-46.0", unit: "%" },
    { analyte: "WBC count", range: "4.5-11.0", unit: "x10³/µL" },
    { analyte: "RBC count (male)", range: "4.5-5.9", unit: "million/µL" },
    { analyte: "RBC count (female)", range: "4.0-5.2", unit: "million/µL" },
    { analyte: "Platelet count", range: "150-400", unit: "x10³/µL" },
    { analyte: "MCV", range: "80-100", unit: "fL" },
    { analyte: "MCH", range: "27-33", unit: "pg" },
    { analyte: "MCHC", range: "32-36", unit: "g/dL" },
    { analyte: "Neutrophils", range: "40-70", unit: "%" },
    { analyte: "Lymphocytes", range: "20-40", unit: "%" },
    { analyte: "Absolute neutrophil count", range: "1500-8000", unit: "cells/µL" },
  ],
}

export const chemistryReferenceRanges: ReferenceRangeGroup = {
  id: "chemistry",
  title: "Clinical Chemistry",
  ranges: [
    { analyte: "Glucose, fasting", range: "70-120", unit: "mg/dL" },
    { analyte: "BUN", range: "7-20", unit: "mg/dL" },
    { analyte: "Creatinine (male)", range: "0.5-1.3", unit: "mg/dL" },
    { analyte: "Creatinine (female)", range: "0.5-1.1", unit: "mg/dL" },
    { analyte: "Sodium", range: "135-145", unit: "mmol/L" },
    { analyte: "Potassium", range: "3.5-5.0", unit: "mmol/L" },
    { analyte: "Chloride", range: "96-108", unit: "mmol/L" },
    { analyte: "Bicarbonate (CO₂)", range: "22-28", unit: "mmol/L" },
    { analyte: "Calcium, total", range: "8.5-10.5", unit: "mg/dL" },
    { analyte: "Total protein", range: "6.0-8.3", unit: "g/dL" },
    { analyte: "Albumin", range: "3.5-5.0", unit: "g/dL" },
    { analyte: "Total bilirubin", range: "0.2-1.3", unit: "mg/dL" },
    { analyte: "ALT", range: "<41", unit: "U/L" },
    { analyte: "AST", range: "<31", unit: "U/L" },
    { analyte: "Total cholesterol", range: "<200", unit: "mg/dL", note: "desirable" },
    { analyte: "LDL cholesterol", range: "50-150", unit: "mg/dL", note: "optimal" },
    { analyte: "HDL cholesterol (male)", range: "35-85", unit: "mg/dL" },
    { analyte: "HDL cholesterol (female)", range: "50-85", unit: "mg/dL" },
    { analyte: "Triglycerides", range: "65-185", unit: "mg/dL" },
    { analyte: "TSH", range: "0.4-4.0", unit: "mIU/L" },
  ],
}

export const REFERENCE_RANGE_DISCLAIMER =
  "Reference ranges vary by laboratory, analytical method, population, age, sex, and local validation. These are general examples only, not diagnostic cutoffs. Always use your own laboratory's validated reference intervals."
