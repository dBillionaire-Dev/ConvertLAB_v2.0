import { describe, expect, it } from "vitest"
import { meanArterialPressureCalculator, ejectionFractionCalculator, cha2ds2VascCalculator, daptScoreCalculator, qtcCalculator, atherogenicIndexCalculator } from "./cardiovascular"

describe("cardiovascular calculators", () => {
  it("calculates MAP", () => expect(meanArterialPressureCalculator.calculate({sbp:120,dbp:80}).value).toBe(93.3))
  it("calculates EF", () => expect(ejectionFractionCalculator.calculate({edv:120,esv:48}).value).toBe(60))
  it("calculates CHA2DS2-VASc", () => expect(cha2ds2VascCalculator.calculate({chf:"yes",hypertension:"yes",age:76,diabetes:"no",stroke:"yes",vascular:"no",sex:"female"}).value).toBe(7))
  it("calculates DAPT score", () => expect(daptScoreCalculator.calculate({age:70,smoker:"yes",diabetes:"yes",miPresentation:"yes",priorPciMi:"no",smallStent:"no",paclitaxelStent:"no",chfLowEf:"no",veinGraft:"no"}).value).toBe(2))
  it("calculates QTc", () => expect(qtcCalculator.calculate({qt:400,heartRate:60}).secondary?.[0].value).toBe("400 ms"))
  it("calculates AIP", () => expect(atherogenicIndexCalculator.calculate({triglycerides:1.5,hdl:1}).value).toBeCloseTo(0.176,3))
})
