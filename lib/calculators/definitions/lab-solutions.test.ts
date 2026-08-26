import { describe, expect, it } from "vitest"
import { molarityCalculator, normalityCalculator } from "./lab-solutions"

describe("molarityCalculator", () => {
  it("computes molarity for NaCl (0.9% saline analog: 5.85g / 58.44 MW / 1L ≈ 0.1M)", () => {
    const result = molarityCalculator.calculate({ mass: 5.85, molecularWeight: 58.44, volume: 1 })
    expect(result.value).toBeCloseTo(0.1, 2)
  })

  it("scales inversely with volume", () => {
    const oneLiter = molarityCalculator.calculate({ mass: 10, molecularWeight: 100, volume: 1 })
    const twoLiter = molarityCalculator.calculate({ mass: 10, molecularWeight: 100, volume: 2 })
    expect(twoLiter.value as number).toBeCloseTo((oneLiter.value as number) / 2, 4)
  })

  it("throws for zero/negative molecular weight or volume", () => {
    expect(() => molarityCalculator.calculate({ mass: 10, molecularWeight: 0, volume: 1 })).toThrow()
    expect(() => molarityCalculator.calculate({ mass: 10, molecularWeight: 100, volume: 0 })).toThrow()
  })

  it("handles decimal mass values", () => {
    const result = molarityCalculator.calculate({ mass: 2.35, molecularWeight: 58.44, volume: 0.5 })
    expect(Number.isFinite(result.value)).toBe(true)
  })

  it("throws for missing inputs", () => {
    expect(() => molarityCalculator.calculate({ mass: 10, volume: 1 })).toThrow()
  })
})

describe("normalityCalculator", () => {
  it("computes normality", () => {
    const result = normalityCalculator.calculate({ mass: 4.9, equivalentWeight: 49, volume: 1 })
    expect(result.value).toBeCloseTo(0.1, 4)
  })

  it("throws for zero/negative equivalent weight or volume", () => {
    expect(() => normalityCalculator.calculate({ mass: 10, equivalentWeight: 0, volume: 1 })).toThrow()
    expect(() => normalityCalculator.calculate({ mass: 10, equivalentWeight: 50, volume: 0 })).toThrow()
  })
})
