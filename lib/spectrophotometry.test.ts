import { describe, expect, it } from "vitest"
import {
  beerLambert,
  absorbanceFromTransmittance,
  transmittanceFromAbsorbance,
  linearRegression,
  concentrationFromCalibration,
  SpectroError,
} from "./spectrophotometry"

describe("beerLambert", () => {
  it("solves for absorbance", () => {
    const result = beerLambert({ epsilon: 5000, pathLength: 1, concentration: 0.0001 })
    expect(result.solvedFor).toBe("absorbance")
    expect(result.value).toBeCloseTo(0.5, 6)
  })

  it("solves for concentration", () => {
    const result = beerLambert({ absorbance: 0.5, epsilon: 5000, pathLength: 1 })
    expect(result.solvedFor).toBe("concentration")
    expect(result.value).toBeCloseTo(0.0001, 6)
  })

  it("solves for epsilon", () => {
    const result = beerLambert({ absorbance: 0.5, pathLength: 1, concentration: 0.0001 })
    expect(result.solvedFor).toBe("epsilon")
    expect(result.value).toBeCloseTo(5000, 0)
  })

  it("solves for path length", () => {
    const result = beerLambert({ absorbance: 0.5, epsilon: 5000, concentration: 0.0001 })
    expect(result.solvedFor).toBe("pathLength")
    expect(result.value).toBeCloseTo(1, 6)
  })

  it("throws unless exactly three of four values are given", () => {
    expect(() => beerLambert({ absorbance: 0.5 })).toThrow(SpectroError)
    expect(() => beerLambert({ absorbance: 0.5, epsilon: 5000, pathLength: 1, concentration: 0.0001 })).toThrow(SpectroError)
  })
})

describe("absorbance <-> transmittance round trips", () => {
  it("50% T -> A -> %T returns the original value", () => {
    const a = absorbanceFromTransmittance(50)
    const roundTrip = transmittanceFromAbsorbance(a)
    expect(roundTrip).toBeCloseTo(50, 6)
  })

  it("known value: %T=100 -> A=0", () => {
    expect(absorbanceFromTransmittance(100)).toBeCloseTo(0, 6)
  })

  it("known value: %T=10 -> A=1", () => {
    expect(absorbanceFromTransmittance(10)).toBeCloseTo(1, 6)
  })

  it("throws for %T of 0 or below, or above 100", () => {
    expect(() => absorbanceFromTransmittance(0)).toThrow(SpectroError)
    expect(() => absorbanceFromTransmittance(-5)).toThrow(SpectroError)
    expect(() => absorbanceFromTransmittance(150)).toThrow(SpectroError)
  })

  it("throws for negative absorbance", () => {
    expect(() => transmittanceFromAbsorbance(-1)).toThrow(SpectroError)
  })
})

describe("linearRegression + concentrationFromCalibration", () => {
  const points = [
    { concentration: 0, absorbance: 0.001 },
    { concentration: 10, absorbance: 0.12 },
    { concentration: 20, absorbance: 0.24 },
    { concentration: 30, absorbance: 0.359 },
    { concentration: 40, absorbance: 0.48 },
  ]

  it("fits a near-perfect line to well-behaved data", () => {
    const reg = linearRegression(points)
    expect(reg.rSquared).toBeGreaterThan(0.999)
    expect(reg.slope).toBeCloseTo(0.012, 3)
  })

  it("solves for an unknown's concentration from its absorbance", () => {
    const reg = linearRegression(points)
    const conc = concentrationFromCalibration(0.3, reg)
    expect(conc).toBeCloseTo(25, 0)
  })

  it("throws with fewer than two standards", () => {
    expect(() => linearRegression([{ concentration: 1, absorbance: 0.1 }])).toThrow(SpectroError)
  })

  it("throws when all concentrations are identical", () => {
    expect(() =>
      linearRegression([
        { concentration: 5, absorbance: 0.1 },
        { concentration: 5, absorbance: 0.2 },
      ]),
    ).toThrow(SpectroError)
  })
})
