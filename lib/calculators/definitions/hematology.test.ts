import { describe, expect, it } from "vitest"
import { mcvCalculator, mchCalculator, mchcCalculator, absoluteCellCountCalculator } from "./hematology"

describe("mcvCalculator", () => {
  it("computes MCV", () => {
    const result = mcvCalculator.calculate({ hct: 42, rbc: 4.8 })
    expect(result.value).toBeCloseTo((42 * 10) / 4.8, 1)
  })

  it("throws for zero/negative RBC count", () => {
    expect(() => mcvCalculator.calculate({ hct: 42, rbc: 0 })).toThrow()
    expect(() => mcvCalculator.calculate({ hct: 42, rbc: -1 })).toThrow()
  })

  it("throws for missing inputs", () => {
    expect(() => mcvCalculator.calculate({ hct: 42 })).toThrow()
  })
})

describe("mchCalculator", () => {
  it("computes MCH", () => {
    const result = mchCalculator.calculate({ hgb: 14, rbc: 4.8 })
    expect(result.value).toBeCloseTo((14 * 10) / 4.8, 1)
  })

  it("throws for zero RBC count", () => {
    expect(() => mchCalculator.calculate({ hgb: 14, rbc: 0 })).toThrow()
  })
})

describe("mchcCalculator", () => {
  it("computes MCHC", () => {
    const result = mchcCalculator.calculate({ hgb: 14, hct: 42 })
    expect(result.value).toBeCloseTo((14 / 42) * 100, 1)
  })

  it("throws for zero hematocrit", () => {
    expect(() => mchcCalculator.calculate({ hgb: 14, hct: 0 })).toThrow()
  })

  it("warns for physiologically implausible high MCHC", () => {
    const result = mchcCalculator.calculate({ hgb: 20, hct: 40 })
    expect(result.warnings?.length).toBeGreaterThan(0)
  })
})

describe("absoluteCellCountCalculator", () => {
  it("computes an absolute neutrophil count", () => {
    const result = absoluteCellCountCalculator.calculate({ cellType: "neutrophil", wbc: 7.5, percent: 60 })
    expect(result.value).toBeCloseTo(4.5, 2)
  })

  it("handles 0% and 100% differential", () => {
    const zero = absoluteCellCountCalculator.calculate({ cellType: "lymphocyte", wbc: 7.5, percent: 0 })
    const full = absoluteCellCountCalculator.calculate({ cellType: "lymphocyte", wbc: 7.5, percent: 100 })
    expect(zero.value).toBe(0)
    expect(full.value).toBeCloseTo(7.5, 2)
  })

  it("flags severe neutropenia range", () => {
    const result = absoluteCellCountCalculator.calculate({ cellType: "neutrophil", wbc: 1.0, percent: 20 })
    expect(result.interpretation).toContain("Severe neutropenia")
  })

  it("throws for out-of-range percentage", () => {
    expect(() => absoluteCellCountCalculator.calculate({ cellType: "neutrophil", wbc: 7.5, percent: 150 })).toThrow()
    expect(() => absoluteCellCountCalculator.calculate({ cellType: "neutrophil", wbc: 7.5, percent: -10 })).toThrow()
  })

  it("throws for zero/negative WBC", () => {
    expect(() => absoluteCellCountCalculator.calculate({ cellType: "neutrophil", wbc: 0, percent: 60 })).toThrow()
  })
})
