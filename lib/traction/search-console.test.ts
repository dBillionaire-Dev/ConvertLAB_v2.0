import { generateKeyPairSync, createVerify } from "node:crypto"
import { describe, expect, it } from "vitest"
import { chunkRange, dedupeRows, mapRow, signJwt } from "./search-console.mjs"
import { csvCell, toCsv } from "./csv.mjs"

describe("search console helpers", () => {
  it("maps API rows to table rows", () => {
    expect(mapRow({ keys: ["2026-01-01", "bmi calculator", "https://x.test/bmi", "nga", "MOBILE"], clicks: 3, impressions: 40, ctr: 0.075, position: 6.2 })).toEqual({
      date: "2026-01-01", query: "bmi calculator", page: "https://x.test/bmi", country: "nga", device: "MOBILE",
      clicks: 3, impressions: 40, ctr: 0.075, position: 6.2,
    })
  })
  it("chunks ranges inclusively without gaps or overlap", () => {
    expect(chunkRange("2026-01-01", "2026-01-10", 4)).toEqual([["2026-01-01", "2026-01-04"], ["2026-01-05", "2026-01-08"], ["2026-01-09", "2026-01-10"]])
  })
  it("dedupes identical keys", () => {
    const row = { date: "d", query: "q", page: "p", country: "c", device: "x", clicks: 1, impressions: 1, ctr: 1, position: 1 }
    expect(dedupeRows([row, { ...row, clicks: 2 }])).toHaveLength(1)
  })
  it("signs a verifiable RS256 JWT", () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 })
    const jwt = signJwt({ client_email: "sa@x.iam", private_key: privateKey.export({ type: "pkcs8", format: "pem" }) as string }, 1000)
    const [h, c, s] = jwt.split(".")
    const v = createVerify("RSA-SHA256"); v.update(`${h}.${c}`)
    expect(v.verify(publicKey, Buffer.from(s, "base64url"))).toBe(true)
    expect(JSON.parse(Buffer.from(c, "base64url").toString())).toMatchObject({ iss: "sa@x.iam", iat: 1000, exp: 4600 })
  })
})

describe("csv", () => {
  it("escapes quotes, commas and newlines", () => {
    expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"')
  })
  it("neutralises spreadsheet formulas in text but keeps negative numbers", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)")
    expect(csvCell(-5)).toBe("-5")
  })
  it("builds rows with a header", () => {
    expect(toCsv(["a", "b"], [{ a: 1, b: "x" }])).toBe("a,b\r\n1,x\r\n")
  })
})
