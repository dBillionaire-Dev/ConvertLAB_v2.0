import { describe, expect, it } from "vitest"
import { isLikelyBot } from "./bots"

describe("isLikelyBot", () => {
  it("recognises search and preview crawlers", () => {
    expect(isLikelyBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true)
    expect(isLikelyBot("Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36 (compatible; Googlebot/2.1)")).toBe(true)
    expect(isLikelyBot("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)")).toBe(true)
    expect(isLikelyBot("facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)")).toBe(true)
    expect(isLikelyBot("WhatsApp/2.23.20.0 A")).toBe(true)
    expect(isLikelyBot("Mozilla/5.0 (compatible; Applebot/0.1)")).toBe(true)
  })
  it("recognises automated browsers, monitors and scripts", () => {
    expect(isLikelyBot("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/126.0.0.0 Safari/537.36")).toBe(true)
    expect(isLikelyBot("Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 Chrome-Lighthouse")).toBe(true)
    expect(isLikelyBot("Mozilla/5.0+(compatible; UptimeRobot/2.0; http://www.uptimerobot.com/)")).toBe(true)
    expect(isLikelyBot("vercel-screenshot/1.0")).toBe(true)
    expect(isLikelyBot("curl/8.4.0")).toBe(true)
    expect(isLikelyBot("python-requests/2.31.0")).toBe(true)
  })
  it("does not flag real phones and browsers, including brands with 'bot' in the name", () => {
    expect(isLikelyBot("Mozilla/5.0 (Linux; Android 13; TECNO KJ5 Build/TP1A.220624.014) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36")).toBe(false)
    expect(isLikelyBot("Mozilla/5.0 (Linux; Android 12; CUBOT X30) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36")).toBe(false)
    expect(isLikelyBot("Mozilla/5.0 (Linux; Android 10; itel A56; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/110.0.0.0 Mobile Safari/537.36")).toBe(false)
    expect(isLikelyBot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1")).toBe(false)
    expect(isLikelyBot("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0")).toBe(false)
  })
  it("treats a missing user agent as not a bot, so nothing is lost by accident", () => {
    expect(isLikelyBot(null)).toBe(false)
    expect(isLikelyBot(undefined)).toBe(false)
    expect(isLikelyBot("")).toBe(false)
  })
})
