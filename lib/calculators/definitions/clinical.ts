import type { CalculatorDefinition } from "../types"
import { num, str, assertPositive, safeDivide, round, fmt } from "../helpers"

const heightToMeters = (value: number, unit: string) => {
  switch (unit) {
    case "cm":
      return value / 100
    case "m":
      return value
    case "ft":
      return value * 0.3048
    case "in":
      return value * 0.0254
    default:
      return value
  }
}

const weightToKg = (value: number, unit: string) => (unit === "lb" ? value * 0.453592 : value)

export const bmiCalculator: CalculatorDefinition = {
  id: "bmi",
  name: "BMI (Body Mass Index)",
  shortName: "BMI",
  category: "clinical",
  description: "Calculates body mass index from weight and height.",
  formula: "BMI = weight (kg) / height (m)²",
  keywords: ["bmi", "body mass index", "weight"],
  relatedTools: ["bsa", "ideal-body-weight", "bmr"],
  inputs: [
    { id: "weight", label: "Weight", kind: "number", unit: "kg", min: 0, defaultValue: 70 },
    {
      id: "weightUnit",
      label: "Weight unit",
      kind: "select",
      options: [
        { value: "kg", label: "kg" },
        { value: "lb", label: "lb" },
      ],
      defaultValue: "kg",
    },
    { id: "height", label: "Height", kind: "number", unit: "cm", min: 0, defaultValue: 170 },
    {
      id: "heightUnit",
      label: "Height unit",
      kind: "select",
      options: [
        { value: "cm", label: "cm" },
        { value: "m", label: "m" },
        { value: "ft", label: "ft" },
        { value: "in", label: "in" },
      ],
      defaultValue: "cm",
    },
  ],
  calculate: (inputs) => {
    const weight = num(inputs, "weight")
    const height = num(inputs, "height")
    assertPositive(weight, "Weight")
    assertPositive(height, "Height")

    const weightKg = weightToKg(weight, str(inputs, "weightUnit"))
    const heightM = heightToMeters(height, str(inputs, "heightUnit"))

    const bmi = safeDivide(weightKg, heightM * heightM, "height²")
    const rounded = round(bmi, 1)

    let category = "Normal weight"
    if (bmi < 18.5) category = "Underweight"
    else if (bmi >= 25 && bmi < 30) category = "Overweight"
    else if (bmi >= 30) category = "Obesity"

    return {
      value: rounded,
      unit: "kg/m²",
      display: fmt(rounded, 1, "kg/m²"),
      secondary: [{ label: "Category", value: category }],
      calculationSteps: [`${round(weightKg, 1)} kg / (${round(heightM, 2)} m)²`],
      interpretation: `${category} range (WHO adult classification).`,
      warnings: bmi < 10 || bmi > 80 ? ["BMI is outside the typical human range — check inputs."] : undefined,
    }
  },
  notes: ["Standard WHO adult BMI categories are used; they may not apply to children, pregnant patients, or highly muscular individuals."],
  limitations: ["BMI does not account for body composition (fat vs. muscle mass) or fat distribution."],
}

export const bsaCalculator: CalculatorDefinition = {
  id: "bsa",
  name: "Body Surface Area",
  shortName: "BSA",
  category: "clinical",
  description: "Estimates body surface area using the Mosteller formula.",
  isEstimator: true,
  formula: "BSA (m²) = sqrt[(height(cm) x weight(kg)) / 3600]",
  keywords: ["bsa", "body surface area", "mosteller"],
  relatedTools: ["bmi", "ideal-body-weight"],
  inputs: [
    { id: "height", label: "Height", kind: "number", unit: "cm", min: 0, defaultValue: 170 },
    { id: "weight", label: "Weight", kind: "number", unit: "kg", min: 0, defaultValue: 70 },
  ],
  calculate: (inputs) => {
    const height = num(inputs, "height")
    const weight = num(inputs, "weight")
    assertPositive(height, "Height")
    assertPositive(weight, "Weight")

    const bsa = Math.sqrt((height * weight) / 3600)
    const rounded = round(bsa, 2)

    return {
      value: rounded,
      unit: "m²",
      display: fmt(rounded, 2, "m²"),
      calculationSteps: [`sqrt((${height} x ${weight}) / 3600)`],
      interpretation: "Mosteller formula — commonly used for drug dosing (e.g. chemotherapy) calculations.",
    }
  },
  notes: ["The Mosteller formula is the most widely used BSA estimate; DuBois & DuBois is a common alternative."],
  limitations: ["An estimate only — clinical dosing decisions should follow validated institutional protocols."],
}

export const idealBodyWeightCalculator: CalculatorDefinition = {
  id: "ideal-body-weight",
  name: "Ideal Body Weight",
  shortName: "IBW",
  category: "clinical",
  description: "Estimates ideal body weight using the Devine formula.",
  isEstimator: true,
  formula: "Male: 50 + 2.3 x (height in inches - 60)\nFemale: 45.5 + 2.3 x (height in inches - 60)",
  keywords: ["ibw", "ideal body weight", "devine"],
  relatedTools: ["bmi", "bsa"],
  inputs: [
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
    { id: "height", label: "Height", kind: "number", unit: "cm", min: 0, defaultValue: 170 },
  ],
  calculate: (inputs) => {
    const sex = str(inputs, "sex")
    const height = num(inputs, "height")
    assertPositive(height, "Height")

    const heightInches = height / 2.54
    const base = sex === "male" ? 50 : 45.5
    const inchesOver5Feet = Math.max(heightInches - 60, 0)
    const ibw = base + 2.3 * inchesOver5Feet
    const rounded = round(ibw, 1)

    return {
      value: rounded,
      unit: "kg",
      display: fmt(rounded, 1, "kg"),
      calculationSteps: [
        `Height: ${round(heightInches, 1)} in`,
        `${base} + 2.3 x (${round(heightInches, 1)} - 60)`,
      ],
      warnings: heightInches < 60 ? ["Devine formula is defined for heights ≥ 5 ft (152 cm); result is extrapolated below that."] : undefined,
    }
  },
  notes: ["The Devine formula is the most commonly used IBW equation in clinical dosing contexts."],
  limitations: ["Less accurate for very short or very tall individuals; several alternative formulas exist (Robinson, Miller, Hamwi)."],
}

export const bmrCalculator: CalculatorDefinition = {
  id: "bmr",
  name: "Basal Metabolic Rate",
  shortName: "BMR",
  category: "clinical",
  description: "Estimates basal metabolic rate using the Mifflin-St Jeor equation.",
  isEstimator: true,
  formula: "Male: 10W + 6.25H - 5A + 5\nFemale: 10W + 6.25H - 5A - 161",
  keywords: ["bmr", "basal metabolic rate", "mifflin"],
  relatedTools: ["bmi"],
  inputs: [
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
    { id: "weight", label: "Weight", kind: "number", unit: "kg", min: 0, defaultValue: 70 },
    { id: "height", label: "Height", kind: "number", unit: "cm", min: 0, defaultValue: 170 },
    { id: "age", label: "Age", kind: "number", unit: "years", min: 0, defaultValue: 30 },
  ],
  calculate: (inputs) => {
    const sex = str(inputs, "sex")
    const weight = num(inputs, "weight")
    const height = num(inputs, "height")
    const age = num(inputs, "age")
    assertPositive(weight, "Weight")
    assertPositive(height, "Height")

    const base = 10 * weight + 6.25 * height - 5 * age
    const bmr = sex === "male" ? base + 5 : base - 161
    const rounded = round(bmr, 0)

    return {
      value: rounded,
      unit: "kcal/day",
      display: fmt(rounded, 0, "kcal/day"),
      calculationSteps: [`(10 x ${weight}) + (6.25 x ${height}) - (5 x ${age}) ${sex === "male" ? "+ 5" : "- 161"}`],
      interpretation: "Estimated energy expenditure at complete rest (Mifflin-St Jeor equation).",
    }
  },
  notes: ["Mifflin-St Jeor is generally considered more accurate than the older Harris-Benedict equation."],
  limitations: ["Does not account for body composition, medical conditions, or activity level (see TDEE)."],
}
