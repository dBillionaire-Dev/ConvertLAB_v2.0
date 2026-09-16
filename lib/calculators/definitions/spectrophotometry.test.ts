import { describe, expect, it } from "vitest"
import { beerLambertCalculator } from "./spectrophotometry"

describe("spectrophotometry calculators", () => {
  it("calculates absorbance with Beer-Lambert", () => {
    expect(beerLambertCalculator.calculate({solveFor:"absorbance",epsilon:1000,pathLength:1,concentration:0.001}).value).toBe(1)
  })
  it("solves concentration from absorbance", () => {
    expect(beerLambertCalculator.calculate({solveFor:"concentration",absorbance:1,epsilon:1000,pathLength:1}).value).toBe(0.001)
  })
})
