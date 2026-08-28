import { describe, expect, it } from "vitest"
import { creatinineClearanceCalculator, egfrCalculator, bunCreatinineRatioCalculator } from "./renal"

describe("creatinineClearanceCalculator", () => {
  it("computes CrCl for a male", () => {
    const result = creatinineClearanceCalculator.calculate({ age: 50, weight: 70, creatinine: 1.0, sex: "male" })
    expect(result.value).toBeCloseTo(((140 - 50) * 70) / (72 * 1.0), 1)
  })

  it("applies the 0.85 female correction factor", () => {
    const male = creatinineClearanceCalculator.calculate({ age: 50, weight: 70, creatinine: 1.0, sex: "male" })
    const female = creatinineClearanceCalculator.calculate({ age: 50, weight: 70, creatinine: 1.0, sex: "female" })
    expect(female.value as number).toBeCloseTo((male.value as number) * 0.85, 1)
  })

  it("throws for zero/negative creatinine", () => {
    expect(() => creatinineClearanceCalculator.calculate({ age: 50, weight: 70, creatinine: 0, sex: "male" })).toThrow()
    expect(() => creatinineClearanceCalculator.calculate({ age: 50, weight: 70, creatinine: -1, sex: "male" })).toThrow()
  })

  it("throws for zero/negative weight", () => {
    expect(() => creatinineClearanceCalculator.calculate({ age: 50, weight: 0, creatinine: 1, sex: "male" })).toThrow()
  })

  it("warns for pediatric age", () => {
    const result = creatinineClearanceCalculator.calculate({ age: 10, weight: 30, creatinine: 0.5, sex: "male" })
    expect(result.warnings?.length).toBeGreaterThan(0)
  })

  it("throws for missing inputs", () => {
    expect(() => creatinineClearanceCalculator.calculate({ age: 50, weight: 70, sex: "male" })).toThrow()
  })
})

describe("egfrCalculator", () => {
  it("computes eGFR for a male with normal creatinine", () => {
    const result = egfrCalculator.calculate({ age: 50, creatinine: 1.0, sex: "male" })
    expect(result.value).toBeGreaterThan(0)
    expect(result.value).toBeLessThan(200)
  })

  it("computes eGFR for a female with normal creatinine", () => {
    const result = egfrCalculator.calculate({ age: 50, creatinine: 1.0, sex: "female" })
    expect(result.value).toBeGreaterThan(0)
  })

  it("assigns CKD stage G1 for high eGFR and lower stages as creatinine rises", () => {
    const g1 = egfrCalculator.calculate({ age: 25, creatinine: 0.7, sex: "male" })
    const worse = egfrCalculator.calculate({ age: 70, creatinine: 4.0, sex: "male" })
    expect(g1.secondary?.[0].value).toContain("G1")
    expect((worse.value as number)).toBeLessThan(g1.value as number)
  })

  it("throws for zero/negative creatinine", () => {
    expect(() => egfrCalculator.calculate({ age: 50, creatinine: 0, sex: "male" })).toThrow()
    expect(() => egfrCalculator.calculate({ age: 50, creatinine: -0.5, sex: "male" })).toThrow()
  })

  it("throws for missing inputs", () => {
    expect(() => egfrCalculator.calculate({ age: 50, sex: "male" })).toThrow()
  })

  it("handles decimal creatinine values", () => {
    const result = egfrCalculator.calculate({ age: 45, creatinine: 0.83, sex: "female" })
    expect(Number.isFinite(result.value)).toBe(true)
  })
})

describe("bunCreatinineRatioCalculator", () => {
  it("computes the BUN/creatinine ratio", () => {
    const result = bunCreatinineRatioCalculator.calculate({ bun: 14, creatinine: 1.0 })
    expect(result.value).toBe(14)
  })

  it("interprets a high ratio", () => {
    const result = bunCreatinineRatioCalculator.calculate({ bun: 40, creatinine: 1.0 })
    expect(result.interpretation).toContain("Elevated")
  })

  it("interprets a low ratio", () => {
    const result = bunCreatinineRatioCalculator.calculate({ bun: 5, creatinine: 1.0 })
    expect(result.interpretation).toContain("Low")
  })

  it("interprets a normal ratio", () => {
    const result = bunCreatinineRatioCalculator.calculate({ bun: 14, creatinine: 1.0 })
    expect(result.interpretation).toContain("typical")
  })

  it("throws for zero/negative creatinine", () => {
    expect(() => bunCreatinineRatioCalculator.calculate({ bun: 14, creatinine: 0 })).toThrow()
    expect(() => bunCreatinineRatioCalculator.calculate({ bun: 14, creatinine: -1 })).toThrow()
  })

  it("throws for negative BUN", () => {
    expect(() => bunCreatinineRatioCalculator.calculate({ bun: -5, creatinine: 1.0 })).toThrow()
  })

  it("handles zero BUN (a legitimate value)", () => {
    const result = bunCreatinineRatioCalculator.calculate({ bun: 0, creatinine: 1.0 })
    expect(result.value).toBe(0)
  })
})
