import { describe, expect, it } from "vitest"
import { globalSearch } from "./search"

describe("globalSearch", () => {
  it("finds a registered calculator by name", () => {
    const results = globalSearch("bmi")
    expect(results.some((r) => r.type === "calculator" && r.id === "bmi")).toBe(true)
  })

  it("finds a conversion category", () => {
    const results = globalSearch("temperature")
    expect(results.some((r) => r.type === "conversion" && r.id === "temperature")).toBe(true)
  })

  it("finds standalone lab tools not backed by the calculator registry (spec section 37)", () => {
    expect(globalSearch("dilution").some((r) => r.id === "c1v1-dilution")).toBe(true)
    expect(globalSearch("mass volume").some((r) => r.id === "mass-volume")).toBe(true)
    expect(globalSearch("mass ↔ volume").length).toBeGreaterThanOrEqual(0) // symbol variants shouldn't throw
  })

  it("finds the combined Red Cell Indices tool by MCV/MCH/MCHC keywords", () => {
    expect(globalSearch("mcv").some((r) => r.id === "red-cell-indices")).toBe(true)
    expect(globalSearch("mchc").some((r) => r.id === "red-cell-indices")).toBe(true)
  })

  it("returns nothing for an empty query", () => {
    expect(globalSearch("")).toEqual([])
    expect(globalSearch("   ")).toEqual([])
  })

  it("returns nothing for a query matching nothing", () => {
    expect(globalSearch("zzzznonexistentquery")).toEqual([])
  })

  it("is case-insensitive", () => {
    expect(globalSearch("BMI").some((r) => r.id === "bmi")).toBe(true)
  })
})
