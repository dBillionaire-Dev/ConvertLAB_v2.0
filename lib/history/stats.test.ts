import { describe, expect, it } from "vitest"
import { computeActivityStats } from "./stats"
import type { HistoryItem } from "./db"

function item(overrides: Partial<HistoryItem>): HistoryItem {
  return {
    id: overrides.id ?? Math.random().toString(),
    calculatorId: overrides.calculatorId ?? "bmi",
    calculatorName: overrides.calculatorName ?? "BMI",
    category: overrides.category ?? "clinical",
    inputs: overrides.inputs ?? {},
    result: overrides.result ?? 22.5,
    unit: overrides.unit,
    timestamp: overrides.timestamp ?? new Date().toISOString(),
  }
}

const DAY_MS = 24 * 60 * 60 * 1000

describe("computeActivityStats", () => {
  it("returns zeros/null for an empty history", () => {
    const stats = computeActivityStats([])
    expect(stats.calculationsThisWeek).toBe(0)
    expect(stats.calculatorsUsedCount).toBe(0)
    expect(stats.mostUsed).toBeNull()
  })

  it("counts calculations within the last 7 days", () => {
    const now = Date.now()
    const items = [
      item({ timestamp: new Date(now).toISOString() }),
      item({ timestamp: new Date(now - 3 * DAY_MS).toISOString() }),
      item({ timestamp: new Date(now - 6 * DAY_MS).toISOString() }),
      item({ timestamp: new Date(now - 10 * DAY_MS).toISOString() }), // outside the week
    ]
    expect(computeActivityStats(items).calculationsThisWeek).toBe(3)
  })

  it("counts distinct calculators used", () => {
    const items = [
      item({ calculatorId: "bmi" }),
      item({ calculatorId: "bmi" }),
      item({ calculatorId: "ldl-friedewald" }),
      item({ calculatorId: "egfr-ckd-epi" }),
    ]
    expect(computeActivityStats(items).calculatorsUsedCount).toBe(3)
  })

  it("identifies the most-used calculator", () => {
    const items = [
      item({ calculatorId: "dilution-factor", calculatorName: "Dilution Factor" }),
      item({ calculatorId: "dilution-factor", calculatorName: "Dilution Factor" }),
      item({ calculatorId: "dilution-factor", calculatorName: "Dilution Factor" }),
      item({ calculatorId: "bmi", calculatorName: "BMI" }),
    ]
    const stats = computeActivityStats(items)
    expect(stats.mostUsed?.calculatorId).toBe("dilution-factor")
    expect(stats.mostUsed?.count).toBe(3)
  })

  it("handles a single history item", () => {
    const stats = computeActivityStats([item({ calculatorId: "bmi" })])
    expect(stats.mostUsed?.calculatorId).toBe("bmi")
    expect(stats.mostUsed?.count).toBe(1)
    expect(stats.calculatorsUsedCount).toBe(1)
  })
})
