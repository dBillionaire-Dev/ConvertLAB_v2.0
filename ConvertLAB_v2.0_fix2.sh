#!/usr/bin/env bash
set -euo pipefail
ROOT="$(pwd)"

if [[ ! -f "$ROOT/package.json" || ! -d "$ROOT/app" || ! -d "$ROOT/components" ]]; then
  echo "Error: run this script from the ConvertLAB project root."
  exit 1
fi

python3 - <<'PY'
from pathlib import Path
import re
root = Path.cwd()

# Remove metadata exports from pages that are already Client Components.
for rel in ("app/favorites/page.tsx", "app/history/page.tsx", "app/recent/page.tsx", "app/settings/page.tsx"):
    p = root / rel
    if p.exists():
        s = p.read_text()
        s = re.sub(r'^export const metadata\s*=\s*\{\s*robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}\s*\}\s*\n?', '', s, flags=re.M)
        p.write_text(s)

# The reset button is presentational only. The calculator owns its state.
reset = root / "components/calculators/calculator-reset-button.tsx"
reset.parent.mkdir(parents=True, exist_ok=True)
reset.write_text('''"use client"\n\nimport { RotateCcw } from "lucide-react"\nimport { Button } from "@/components/ui/button"\n\ntype CalculatorResetButtonProps = {\n  onReset: () => void\n}\n\nexport function CalculatorResetButton({ onReset }: CalculatorResetButtonProps) {\n  return (\n    <Button\n      type="button"\n      variant="ghost"\n      size="icon"\n      aria-label="Reset calculator"\n      title="Reset calculator"\n      onClick={onReset}\n    >\n      <RotateCcw className="h-5 w-5" aria-hidden="true" />\n    </Button>\n  )\n}\n''')

# Remove the duplicate dilution handler introduced by the previous patch.
p = root / "components/lab-tools/dilution-calculator.tsx"
if p.exists():
    s = p.read_text()
    s = s.replace('''  const handleReset = () => {\n    setValues({ c1: "", v1: "", c2: "", v2: "" })\n  }\n\n  const handleReset = () => setValues({ c1: "", v1: "", c2: "", v2: "" })\n''', '''  const handleReset = () => {\n    setValues({ c1: "", v1: "", c2: "", v2: "" })\n  }\n''')
    p.write_text(s)

# Never allow a reset implementation to refresh the browser.
for p in (root / "components").rglob("*.tsx"):
    if "window.location.reload" in p.read_text() or "location.reload" in p.read_text():
        raise SystemExit(f"Browser-refresh reset found in {p}; remove reload and use state reset logic.")

# Ensure conversion calculators have reset callbacks and buttons.
RESET_IMPORT = 'import { CalculatorResetButton } from "@/components/calculators/calculator-reset-button"\n'

def ensure_import(rel):
    p = root / rel; s = p.read_text()
    if RESET_IMPORT not in s:
        lines = s.splitlines(True)
        idx = 1 if lines and lines[0].strip() in ('"use client"', "'use client'") else 0
        lines.insert(idx, RESET_IMPORT)
        p.write_text(''.join(lines))

def add_once(rel, anchor, insertion):
    p = root / rel; s = p.read_text()
    if insertion.strip() not in s and anchor in s:
        p.write_text(s.replace(anchor, insertion + anchor, 1))

def replace_once(rel, old, new):
    p = root / rel; s = p.read_text()
    if old in s:
        p.write_text(s.replace(old, new, 1))

# Mass-volume
rel = "components/conversions/mass-volume-converter.tsx"
if (root / rel).exists():
    ensure_import(rel)
    add_once(rel, '  const substance = substances.find((s) => s.id === substanceId)\n', '''  const handleReset = () => {\n    setDirection("mass-to-volume")\n    setSubstanceId("water")\n    setInputValue("")\n    setMassUnit("g")\n    setVolumeUnit("mL")\n    setUseCustomDensity(false)\n    setCustomDensity("")\n  }\n\n''')
    replace_once(rel, '''      <CardHeader>\n        <CardTitle>Mass ↔ Volume</CardTitle>\n        <CardDescription>''', '''      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">\n        <div>\n          <CardTitle>Mass ↔ Volume</CardTitle>\n          <CardDescription className="mt-1.5">''')
    # Close the modified header only if the reset isn't already there.
    p = root / rel; s = p.read_text()
    if "CalculatorResetButton onReset={handleReset}" not in s:
        marker = "      </CardHeader>"
        pos = s.find(marker)
        if pos >= 0:
            # Add the controls immediately before the first header close and close the div.
            s = s[:pos] + '          </CardDescription>\n        </div>\n        <CalculatorResetButton onReset={handleReset} />\n' + s[pos:]
            # Avoid duplicate CardDescription closure if source had one.
            s = s.replace('''          </CardDescription>\n        </div>\n        <CalculatorResetButton onReset={handleReset} />\n      </CardHeader>''', '''          </CardDescription>\n        </div>\n        <CalculatorResetButton onReset={handleReset} />\n      </CardHeader>''', 1)
            p.write_text(s)

# Molar-mass
rel = "components/conversions/molar-mass-converter.tsx"
if (root / rel).exists():
    ensure_import(rel)
    add_once(rel, '  const analyte = getAnalyte(analyteId)\n', '''  const handleReset = () => {\n    setAnalyteId("glucose")\n    setDirection("mass-to-molar")\n    setValue("")\n    setUseCustomMw(false)\n    setCustomMw("")\n  }\n\n''')
    replace_once(rel, '''      <CardHeader>\n        <CardTitle>Molar ↔ Mass Concentration</CardTitle>\n        <CardDescription>Convert mg/dL to mmol/L (and back) using an analyte's molecular weight.</CardDescription>\n      </CardHeader>''', '''      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">\n        <div>\n          <CardTitle>Molar ↔ Mass Concentration</CardTitle>\n          <CardDescription className="mt-1.5">Convert mg/dL to mmol/L (and back) using an analyte's molecular weight.</CardDescription>\n        </div>\n        <CalculatorResetButton onReset={handleReset} />\n      </CardHeader>''')

# Transmittance header
rel = "components/spectrophotometry/transmittance-converter.tsx"
if (root / rel).exists():
    ensure_import(rel)
    replace_once(rel, '''      <CardHeader>\n        <CardTitle>Absorbance ↔ %Transmittance</CardTitle>\n        <CardDescription>A = -log₁₀(T), where T is fractional transmittance.</CardDescription>\n      </CardHeader>''', '''      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">\n        <div>\n          <CardTitle>Absorbance ↔ %Transmittance</CardTitle>\n          <CardDescription className="mt-1.5">A = -log₁₀(T), where T is fractional transmittance.</CardDescription>\n        </div>\n        <CalculatorResetButton onReset={handleReset} />\n      </CardHeader>''')

# Final checks.
for rel in ("app/favorites/page.tsx", "app/history/page.tsx", "app/recent/page.tsx", "app/settings/page.tsx"):
    p = root / rel
    if p.exists() and re.search(r'export const metadata\s*=', p.read_text()):
        raise SystemExit(f"Invalid metadata export still exists in {p}")

required = [
    "components/lab-tools/dilution-calculator.tsx",
    "components/lab-tools/percentage-solution-calculator.tsx",
    "components/lab-tools/serial-dilution-calculator.tsx",
    "components/spectrophotometry/beer-lambert-calculator.tsx",
    "components/spectrophotometry/transmittance-converter.tsx",
    "components/spectrophotometry/calibration-curve-tool.tsx",
    "components/hematology/red-cell-indices-calculator.tsx",
    "components/conversions/mass-volume-converter.tsx",
    "components/conversions/molar-mass-converter.tsx",
]
for rel in required:
    p = root / rel
    if p.exists() and "CalculatorResetButton" not in p.read_text():
        raise SystemExit(f"Reset button missing from {rel}")

print("ConvertLAB fix applied successfully.")
print("- Client metadata exports removed")
print("- Reset component no longer reloads the browser")
print("- Reset uses each calculator's onReset/state handler")
print("- Duplicate dilution reset removed")
PY

echo
echo "Run next:"
echo "  pnpm typecheck"
echo "  pnpm test"
echo "  pnpm build"
echo "  git diff --check"
echo "  git diff --stat"
