// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

// The website redirects every landing-host page to the app host, but a POST that is redirected is not followed by the
// phone's network layer. API paths must therefore pass straight through on every host.
const saved = { l: process.env.NEXT_PUBLIC_LANDING_URL, a: process.env.NEXT_PUBLIC_APP_URL }
let proxy: (r: NextRequest) => Response

const req = (host: string, path: string, method = "GET") => new NextRequest(`https://${host}${path}`, { method, headers: { host } })
const passes = (res: Response) => res.headers.get("x-middleware-next") === "1"

beforeAll(async () => {
  process.env.NEXT_PUBLIC_LANDING_URL = "https://clinexia.app"
  process.env.NEXT_PUBLIC_APP_URL = "https://app.clinexia.app"
  vi.resetModules()
  proxy = (await import("../proxy")).proxy as unknown as (r: NextRequest) => Response
})
afterAll(() => {
  process.env.NEXT_PUBLIC_LANDING_URL = saved.l
  process.env.NEXT_PUBLIC_APP_URL = saved.a
})

describe("proxy and the API", () => {
  it("lets API calls through on the www and landing hosts instead of redirecting them", () => {
    for (const host of ["www.clinexia.app", "clinexia.app"]) {
      for (const path of ["/api/analytics", "/api/analytics/presence", "/api/feedback", "/api/feedback/config"]) {
        expect(passes(proxy(req(host, path, "POST")))).toBe(true)
      }
    }
  })
  it("lets API calls through on the app host too", () => {
    expect(passes(proxy(req("app.clinexia.app", "/api/feedback", "POST")))).toBe(true)
  })
  it("still redirects ordinary pages from the website hosts to the app", () => {
    const www = proxy(req("www.clinexia.app", "/calculators"))
    const landing = proxy(req("clinexia.app", "/calculators"))
    for (const res of [www, landing]) {
      expect(res.status).toBe(308)
      expect(res.headers.get("location")).toBe("https://app.clinexia.app/calculators")
    }
  })
  it("keeps the landing home page and the www redirect for it", () => {
    expect(proxy(req("www.clinexia.app", "/")).headers.get("location")).toBe("https://clinexia.app/")
    expect(proxy(req("clinexia.app", "/")).headers.get("x-middleware-rewrite")).toContain("/welcome")
  })
  it("does not match paths that merely start with api", () => {
    expect(proxy(req("clinexia.app", "/apiary")).status).toBe(308)
  })
})
