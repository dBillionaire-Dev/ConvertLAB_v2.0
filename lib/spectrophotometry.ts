export class SpectroError extends Error {}

/** A = ε b c. Solve for whichever quantity is requested from the other three. */
export function beerLambert(params: { absorbance?: number; epsilon?: number; pathLength?: number; concentration?: number }) {
  const { absorbance, epsilon, pathLength, concentration } = params
  const provided = [absorbance, epsilon, pathLength, concentration].filter((v) => v !== undefined && v !== null)
  if (provided.length !== 3) {
    throw new SpectroError("Provide exactly three of: absorbance, molar absorptivity, path length, concentration.")
  }

  if (absorbance === undefined) {
    if (!epsilon || !pathLength) throw new SpectroError("Molar absorptivity and path length must be non-zero.")
    return { solvedFor: "absorbance" as const, value: epsilon * pathLength * (concentration as number) }
  }
  if (epsilon === undefined) {
    if (!pathLength || !concentration) throw new SpectroError("Path length and concentration must be non-zero.")
    return { solvedFor: "epsilon" as const, value: absorbance / (pathLength * concentration) }
  }
  if (pathLength === undefined) {
    if (!epsilon || !concentration) throw new SpectroError("Molar absorptivity and concentration must be non-zero.")
    return { solvedFor: "pathLength" as const, value: absorbance / (epsilon * concentration) }
  }
  if (!epsilon || !pathLength) throw new SpectroError("Molar absorptivity and path length must be non-zero.")
  return { solvedFor: "concentration" as const, value: absorbance / (epsilon * pathLength) }
}

/** A = -log10(T), where T is fractional transmittance (0-1). */
export function absorbanceFromTransmittance(percentT: number): number {
  if (percentT <= 0 || percentT > 100) throw new SpectroError("%T must be between 0 (exclusive) and 100.")
  const fractionalT = percentT / 100
  return -Math.log10(fractionalT)
}

export function transmittanceFromAbsorbance(absorbance: number): number {
  if (absorbance < 0) throw new SpectroError("Absorbance cannot be negative.")
  return 10 ** -absorbance * 100
}

export interface CalibrationPoint {
  concentration: number
  absorbance: number
}

export interface RegressionResult {
  slope: number
  intercept: number
  rSquared: number
}

/** Ordinary least-squares linear regression: absorbance = slope * concentration + intercept. */
export function linearRegression(points: CalibrationPoint[]): RegressionResult {
  const n = points.length
  if (n < 2) throw new SpectroError("At least two standards are required to fit a calibration curve.")

  const sumX = points.reduce((s, p) => s + p.concentration, 0)
  const sumY = points.reduce((s, p) => s + p.absorbance, 0)
  const meanX = sumX / n
  const meanY = sumY / n

  let ssXY = 0
  let ssXX = 0
  let ssYY = 0
  for (const p of points) {
    const dx = p.concentration - meanX
    const dy = p.absorbance - meanY
    ssXY += dx * dy
    ssXX += dx * dx
    ssYY += dy * dy
  }

  if (ssXX === 0) throw new SpectroError("All standard concentrations are identical — cannot fit a line.")

  const slope = ssXY / ssXX
  const intercept = meanY - slope * meanX
  const rSquared = ssYY === 0 ? 1 : (ssXY * ssXY) / (ssXX * ssYY)

  return { slope, intercept, rSquared }
}

export function concentrationFromCalibration(absorbance: number, regression: RegressionResult): number {
  if (regression.slope === 0) throw new SpectroError("Calibration slope is zero — cannot solve for concentration.")
  return (absorbance - regression.intercept) / regression.slope
}
