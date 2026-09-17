import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"

const required = [
  "app/error.tsx",
  "app/loading.tsx",
  "app/calculators/loading.tsx",
  "app/api/health/route.ts",
  "app/robots.ts",
  "app/sitemap.ts",
  "public/service-worker.js",
  "lib/calculators/clinical-audit.ts",
  "lib/calculators/service-worker-routes.test.ts",
  ".github/workflows/ci.yml",
]

const missing = required.filter((file) => !existsSync(resolve(process.cwd(), file)))
if (missing.length) {
  console.error("Release audit failed. Missing:")
  for (const file of missing) console.error(`- ${file}`)
  process.exit(1)
}

const config = readFileSync(resolve(process.cwd(), "next.config.mjs"), "utf8")
const checks = ["ignoreBuildErrors: false", "poweredByHeader: false", "X-Content-Type-Options", "X-Frame-Options", "Strict-Transport-Security"]
const failed = checks.filter((text) => !config.includes(text))
if (failed.length) {
  console.error("Release audit failed. Missing security/configuration checks:")
  for (const check of failed) console.error(`- ${check}`)
  process.exit(1)
}

console.log(`ConvertLAB release audit passed (${required.length} required artifacts checked).`)
