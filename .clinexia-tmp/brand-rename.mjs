// Renames the product brand Clinexia -> Clinexia in text files of the current project (run from the project root).
// Changes: visible text, metadata, comments, docs, the Android app id, the package name, example domains.
// Deliberately NOT changed (renaming would break saved data, the live database or existing links):
//   - storage keys and event names such as  convertlab:favorites  convertlab:settings  (users' saved history would vanish)
//   - IndexedDB names ("convertlab") and the SQL table/function names  convertlab_devices, convertlab_usage_summary_v3, ...
//   - web addresses such as convertlab-nex.vercel.app, and GitHub paths such as .../ConvertLAB_v2.0 (until you rename the repository)
import fs from "node:fs"
import path from "node:path"

const ROOT = process.cwd()
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "out", "android", "ios", ".vercel", "coverage", "dist", ".convertlab-backups", ".clinexia-backups"])
const SKIP_FILES = new Set(["pnpm-lock.yaml", "package-lock.json", "yarn.lock"])
const EXT = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".md", ".css", ".html", ".xml", ".txt", ".yml", ".yaml", ".sql", ".webmanifest", ".sh", ".properties", ".gradle", ".svg"])

const RULES = [
  [/com\.convertlab\.app/g, "com.clinexia.app", "Android app id"],
  [/(?<![A-Za-z0-9_\/.-])Clinexia(?![A-Za-z0-9_])/g, "Clinexia", "Clinexia"],
  [/(?<![A-Za-z0-9_\/.-])CLINEXIA(?![A-Za-z0-9_])/g, "CLINEXIA", "CLINEXIA"],
  [/(?<![A-Za-z0-9_\/.-])Clinexia(?![A-Za-z0-9_])/g, "Clinexia", "Clinexia"],
  [/app\.convertlab\.co(?![a-z])/g, "app.example.com", "example domain"],
  [/(?<![A-Za-z0-9_.-])convertlab\.co(?![a-z])/g, "example.com", "example domain"],
]

const counts = new Map()
const changedFiles = []

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* walk(path.join(dir, entry.name))
    } else if (!SKIP_FILES.has(entry.name) && EXT.has(path.extname(entry.name).toLowerCase())) {
      yield path.join(dir, entry.name)
    }
  }
}

for (const file of walk(ROOT)) {
  const original = fs.readFileSync(file, "utf8")
  let text = original
  for (const [re, to, label] of RULES) {
    text = text.replace(re, () => { counts.set(label, (counts.get(label) ?? 0) + 1); return to })
  }
  if (text !== original) {
    fs.writeFileSync(file, text)
    changedFiles.push(path.relative(ROOT, file))
  }
}

// package.json name
const pkgPath = path.join(ROOT, "package.json")
if (fs.existsSync(pkgPath)) {
  const raw = fs.readFileSync(pkgPath, "utf8")
  const pkg = JSON.parse(raw)
  if (typeof pkg.name === "string" && /convertlab/i.test(pkg.name)) {
    pkg.name = fs.existsSync(path.join(ROOT, "capacitor.config.ts")) ? "clinexia-mobile" : "clinexia-web"
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + (raw.endsWith("\n") ? "\n" : ""))
    counts.set("package name", 1)
  }
}

// Report what was kept on purpose
const kept = new Map()
for (const file of walk(ROOT)) {
  const t = fs.readFileSync(file, "utf8")
  for (const m of t.matchAll(/convertlab[a-z0-9_:.-]{0,24}/gi)) {
    const key = m[0].replace(/(convertlab[:_-][a-z]{0,12}).*/i, "$1")
    kept.set(key, (kept.get(key) ?? 0) + 1)
  }
}

console.log(`  renamed in ${changedFiles.length} files:`, [...counts].map(([k, v]) => `${k} x${v}`).join(", ") || "nothing (already done)")
if (kept.size) {
  console.log("  kept on purpose (saved data, database and links):")
  for (const [k, v] of [...kept].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`    ${k}  x${v}`)
}
