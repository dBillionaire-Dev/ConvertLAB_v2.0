import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8")

describe("release hardening", () => {
  it("keeps the requested category page navigation implementation", () => {
    const source = read("app/calculators/[category]/page.tsx")
    expect(source).toContain('className="sticky top-16 z-30')
    expect(source).toContain('aria-label={`${category.label} sections`}')
    expect(source).toContain('href={`#${bucket.id}`}')
  })

  it("exposes an accessible calculator form and result announcement", () => {
    const source = read("components/calculators/calculator-runner.tsx")
    expect(source).toContain("aria-label={`${definition.name} calculator`}")
    expect(source).toContain("aria-live=\"polite\"")
    expect(source).toContain('type="submit"')
    expect(source).toContain("aria-busy={calculating}")
  })

  it("keeps production security headers configured", () => {
    const source = read("next.config.mjs")
    for (const header of ["X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy", "Strict-Transport-Security", "Cross-Origin-Opener-Policy"]) {
      expect(source).toContain(header)
    }
  })

  it("keeps service worker calculator coverage testable", () => {
    const source = read("lib/calculators/service-worker-routes.test.ts")
    expect(source).toContain("contains every registered calculator route")
  })
})
