import { describe, expect, it } from "vitest"
import { parseLatestApk } from "./latest-apk"

const repo = "dBillionaire-Dev/Clinexia_V3.0-Mobile"
const good = {
  versionCode: 30018,
  versionName: "3.0.18",
  apkUrl: `https://github.com/${repo}/releases/download/v3.0.18/Clinexia-3.0.18.apk`,
  sha256: "a".repeat(64),
}

describe("parseLatestApk", () => {
  it("accepts the release asset of the expected repo", () => {
    expect(parseLatestApk(good, repo)).toEqual({ version: "3.0.18", url: good.apkUrl })
  })
  it("ignores repo name capitalisation", () => {
    expect(parseLatestApk(good, repo.toLowerCase())).not.toBeNull()
  })
  it("rejects links to anywhere else", () => {
    expect(parseLatestApk({ ...good, apkUrl: "https://evil.example/Clinexia.apk" }, repo)).toBeNull()
    expect(parseLatestApk({ ...good, apkUrl: `https://github.com/someone-else/app/releases/download/v1/a.apk` }, repo)).toBeNull()
    expect(parseLatestApk({ ...good, apkUrl: `http://github.com/${repo}/releases/download/v3.0.18/a.apk` }, repo)).toBeNull()
  })
  it("rejects odd paths and non-APK files", () => {
    expect(parseLatestApk({ ...good, apkUrl: `https://github.com/${repo}/releases/download/../x.apk` }, repo)).toBeNull()
    expect(parseLatestApk({ ...good, apkUrl: `https://github.com/${repo}/releases/download/v1/a.zip` }, repo)).toBeNull()
    expect(parseLatestApk({ ...good, apkUrl: `https://github.com/${repo}/releases/download/v1/a b.apk` }, repo)).toBeNull()
  })
  it("rejects a bad version or non-object input", () => {
    expect(parseLatestApk({ ...good, versionName: "latest" }, repo)).toBeNull()
    expect(parseLatestApk({ ...good, versionName: "3.0" }, repo)).toBeNull()
    expect(parseLatestApk(null, repo)).toBeNull()
    expect(parseLatestApk("x", repo)).toBeNull()
  })
})

import { readFileSync } from "node:fs"

describe("landing wiring", () => {
  it("the welcome layout provides the latest release and the Android buttons read it", () => {
    expect(readFileSync("app/welcome/layout.tsx", "utf8")).toContain("LatestApkProvider")
    expect(readFileSync("components/landing/install-buttons.tsx", "utf8")).toContain("useLatestApk()")
  })
  it("the welcome page itself no longer passes a `latest` prop (the earlier approach)", () => {
    const page = readFileSync("app/welcome/page.tsx", "utf8")
    expect(page).not.toContain("latest={")
    expect(page).not.toContain("getLatestApk")
  })
})
