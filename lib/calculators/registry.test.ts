import { describe, expect, it } from "vitest"
import { calculators, getCalculatorById, getCalculatorsByCategory, searchCalculators } from "./registry"

describe("calculator registry integrity", () => {
  it("has no duplicate ids", () => {
    const ids = calculators.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("every calculator has at least one input and a calculate function", () => {
    for (const c of calculators) {
      expect(c.inputs.length).toBeGreaterThan(0)
      expect(typeof c.calculate).toBe("function")
    }
  })

  it("every calculator runs without throwing when given its own default values", () => {
    for (const c of calculators) {
      const inputs: Record<string, number | string> = {}
      for (const input of c.inputs) {
        if (input.defaultValue !== undefined) inputs[input.id] = input.defaultValue
      }
      expect(() => c.calculate(inputs), `${c.id} threw with its own default inputs`).not.toThrow()
    }
  })

  it("every relatedTools reference points to a real calculator", () => {
    for (const c of calculators) {
      for (const relatedId of c.relatedTools ?? []) {
        expect(getCalculatorById(relatedId), `${c.id} references missing related tool ${relatedId}`).toBeDefined()
      }
    }
  })

  it("getCalculatorsByCategory only returns calculators in that category", () => {
    const chemistry = getCalculatorsByCategory("chemistry")
    expect(chemistry.length).toBeGreaterThan(0)
    expect(chemistry.every((c) => c.category === "chemistry")).toBe(true)
  })

  it("searchCalculators finds a known calculator by name and keyword", () => {
    expect(searchCalculators("bmi").some((c) => c.id === "bmi")).toBe(true)
    expect(searchCalculators("body mass index").some((c) => c.id === "bmi")).toBe(true)
  })

  it("searchCalculators returns nothing for an empty query", () => {
    expect(searchCalculators("")).toEqual([])
  })
})
