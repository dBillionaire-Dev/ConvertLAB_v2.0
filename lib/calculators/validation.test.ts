import { describe, expect, it } from "vitest"
import { calculators } from "./registry"
import { auditCalculatorRegistry } from "./validation"

describe("calculator clinical-definition audit", () => {
  it("finds no structural definition issues", () => {
    expect(auditCalculatorRegistry(calculators)).toEqual([])
  })
})
