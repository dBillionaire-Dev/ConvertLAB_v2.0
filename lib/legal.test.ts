import { describe, expect, it } from "vitest"
import { isHighRiskCategory, HIGH_RISK_CATEGORIES } from "./legal"
import { calculators } from "./calculators/registry"

describe("clinical-use notice rules", () => {
  it("flags dosing, oncology and stem-cell-transplant, and nothing else", () => {
    expect(isHighRiskCategory("dosing")).toBe(true)
    expect(isHighRiskCategory("oncology")).toBe(true)
    expect(isHighRiskCategory("stem-cell-transplant")).toBe(true)
    expect(isHighRiskCategory("general")).toBe(false)
    expect(isHighRiskCategory("")).toBe(false)
    expect(isHighRiskCategory(undefined)).toBe(false)
  })

  it("covers every registered calculator in those categories", () => {
    const risky = calculators.filter((c) => (HIGH_RISK_CATEGORIES as readonly string[]).includes(c.category))
    expect(risky.length).toBeGreaterThan(0)
    for (const calculator of risky) expect(isHighRiskCategory(calculator.category)).toBe(true)
  })
})
