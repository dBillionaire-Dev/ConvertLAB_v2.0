import { describe, expect, it } from "vitest"
import { ldlCalculator, nonHdlCalculator, vldlCalculator, anionGapCalculator, correctedCalciumCalculator } from "./chemistry"

describe("ldlCalculator", () => {
  it("computes LDL via the Friedewald equation (mg/dL)", () => {
    const result = ldlCalculator.calculate({ unit: "mg/dL", tc: 200, hdl: 50, tg: 150 })
    expect(result.value).toBeCloseTo(200 - 50 - 150 / 5, 1)
  })

  it("computes LDL in mmol/L using the 2.2 divisor", () => {
    const result = ldlCalculator.calculate({ unit: "mmol/L", tc: 5.2, hdl: 1.3, tg: 1.7 })
    expect(result.value).toBeCloseTo(5.2 - 1.3 - 1.7 / 2.2, 2)
  })

  it("refuses to calculate when triglycerides are too high", () => {
    const result = ldlCalculator.calculate({ unit: "mg/dL", tc: 200, hdl: 50, tg: 500 })
    expect(result.value).toBe("N/A")
    expect(result.warnings?.length).toBeGreaterThan(0)
  })

  it("warns when the result is negative", () => {
    const result = ldlCalculator.calculate({ unit: "mg/dL", tc: 100, hdl: 90, tg: 100 })
    expect(result.warnings?.length).toBeGreaterThan(0)
  })

  it("throws for missing inputs", () => {
    expect(() => ldlCalculator.calculate({ unit: "mg/dL", tc: 200, hdl: 50 })).toThrow()
  })
})

describe("nonHdlCalculator", () => {
  it("computes non-HDL cholesterol", () => {
    const result = nonHdlCalculator.calculate({ tc: 200, hdl: 50 })
    expect(result.value).toBe(150)
  })

  it("handles zero HDL", () => {
    const result = nonHdlCalculator.calculate({ tc: 200, hdl: 0 })
    expect(result.value).toBe(200)
  })
})

describe("vldlCalculator", () => {
  it("computes VLDL as TG/5", () => {
    const result = vldlCalculator.calculate({ tg: 150 })
    expect(result.value).toBe(30)
  })

  it("warns above 400 mg/dL triglycerides", () => {
    const result = vldlCalculator.calculate({ tg: 450 })
    expect(result.warnings?.length).toBeGreaterThan(0)
  })
})

describe("anionGapCalculator", () => {
  it("computes the anion gap", () => {
    const result = anionGapCalculator.calculate({ na: 140, cl: 104, hco3: 24 })
    expect(result.value).toBe(12)
  })

  it("computes the albumin-corrected anion gap when albumin is provided", () => {
    const result = anionGapCalculator.calculate({ na: 140, cl: 104, hco3: 24, albumin: 2 })
    expect(result.secondary?.length).toBe(1)
    expect(result.secondary?.[0].label).toContain("corrected")
  })

  it("omits the corrected value when albumin is not provided", () => {
    const result = anionGapCalculator.calculate({ na: 140, cl: 104, hco3: 24 })
    expect(result.secondary).toBeUndefined()
  })

  it("throws for missing inputs", () => {
    expect(() => anionGapCalculator.calculate({ na: 140, cl: 104 })).toThrow()
  })
})

describe("correctedCalciumCalculator", () => {
  it("returns the measured value unchanged when albumin is normal (4 g/dL)", () => {
    const result = correctedCalciumCalculator.calculate({ calcium: 9, albumin: 4 })
    expect(result.value).toBe(9)
  })

  it("corrects upward for low albumin", () => {
    const result = correctedCalciumCalculator.calculate({ calcium: 8, albumin: 2 })
    expect(result.value).toBeCloseTo(8 + 0.8 * (4 - 2), 2)
  })

  it("handles decimal inputs", () => {
    const result = correctedCalciumCalculator.calculate({ calcium: 8.7, albumin: 3.1 })
    expect(Number.isFinite(result.value)).toBe(true)
  })

  it("throws for missing inputs", () => {
    expect(() => correctedCalciumCalculator.calculate({ calcium: 9 })).toThrow()
  })
})
