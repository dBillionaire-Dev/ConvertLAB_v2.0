#!/usr/bin/env bash
#
# Clinexia WEB (PWA): seven new everyday calculators.
#
# Run from the WEB repo root:   bash clinexia-web-calculators.sh [--skip-verify]
#
# Adds (category: General):
#   Daily Water Intake (EFSA adequate intake)   Estimated Due Date (Naegele's rule)   Gestational Age
#   Lean Body Mass (Boer)   Target Heart Rate (Tanaka + Karvonen)   Pack-Years   Alcohol Units (UK)
#
# Also adds a "date" input type (a native date picker) because the calculator framework only had numbers and
# dropdowns. Every calculator carries a verified source (version + date checked), formula, notes and limitations.
#
# This script NEVER touches the landing page: it refuses to run if any planned edit targets a landing or welcome file.
#
# Safety: every edit is checked BEFORE anything is written, originals are backed up to
# .clinexia-fix-backup/<timestamp>/, and any failure restores them automatically.

set -euo pipefail

SKIP_VERIFY=0
for arg in "$@"; do
  case "$arg" in
    --skip-verify) SKIP_VERIFY=1 ;;
    *) echo "Unknown option: $arg"; exit 2 ;;
  esac
done

say()  { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33mwarning:\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31merror:\033[0m %s\n' "$*" >&2; exit 1; }

[ -f package.json ] || die "package.json not found. Run this from the web repo root."
grep -q '"name": *"clinexia-web"' package.json || die "This does not look like the Clinexia WEB repo (package.json name is not clinexia-web)."
[ -f lib/calculators/registry.ts ] && [ -f lib/calculators/dosing-references.ts ] && [ -f components/calculators/calculator-field.tsx ] && [ -f public/service-worker.js ] \
  || die "Expected calculator files are missing. Is this the right branch/version?"
command -v node >/dev/null 2>&1 || die "node is required."

if [ -f lib/calculators/definitions/everyday.ts ]; then
  say "Already applied (lib/calculators/definitions/everyday.ts exists). Nothing to do."
  exit 0
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR=".clinexia-fix-backup/$STAMP"
CREATED_LIST="$(mktemp)"
TMP_DIR="$(mktemp -d)"
APPLIED=0

cleanup() { rm -rf "$TMP_DIR" "$CREATED_LIST"; }

rollback() {
  [ "$APPLIED" -eq 1 ] && return 0
  warn "Something failed. Restoring your original files..."
  if [ -d "$BACKUP_DIR" ]; then
    (cd "$BACKUP_DIR" && find . -type f) | while read -r f; do
      mkdir -p "$(dirname "$f")"; cp "$BACKUP_DIR/$f" "$f"
    done
  fi
  while read -r f; do [ -n "$f" ] && rm -f "$f"; done < "$CREATED_LIST" || true
  warn "Restored. No changes were kept."
}
trap 'rollback; cleanup' ERR
trap 'cleanup' EXIT

backup() {
  local f="$1"
  if [ -f "$f" ] && [ ! -f "$BACKUP_DIR/$f" ]; then
    mkdir -p "$BACKUP_DIR/$(dirname "$f")"; cp "$f" "$BACKUP_DIR/$f"
  fi
}

write_file() {  # write_file <path>  (content on stdin)
  local f="$1"
  case "$f" in *landing*|*welcome*) die "Refusing to write a landing/welcome file: $f" ;; esac
  if [ -f "$f" ]; then backup "$f"; else echo "$f" >> "$CREATED_LIST"; fi
  mkdir -p "$(dirname "$f")"
  cat > "$f"
}

cat > "$TMP_DIR/patch.mjs" <<'__CLINEXIA_EOF__'
// Applies anchored edits from edits.json. Each anchor must match exactly `count` times
// or the run aborts before anything is written.
import fs from "node:fs"
const edits = JSON.parse(fs.readFileSync(process.argv[2], "utf8"))
const dryRun = process.argv.includes("--check")
const staged = new Map()
try {
  for (const e of edits) {
    const current = staged.has(e.file) ? staged.get(e.file) : fs.readFileSync(e.file, "utf8")
    const found = current.split(e.find).length - 1
    if (found !== (e.count ?? 1)) {
      throw new Error(`${e.file}: expected ${e.count ?? 1} match(es) but found ${found} for:\n${e.find.slice(0, 140)}`)
    }
    staged.set(e.file, current.split(e.find).join(e.replace))
  }
  if (!dryRun) for (const [file, text] of staged) fs.writeFileSync(file, text)
  console.log(`${dryRun ? "checked" : "patched"} ${staged.size} files: ${[...staged.keys()].join(", ")}`)
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
__CLINEXIA_EOF__

cat > "$TMP_DIR/edits.json" <<'__CLINEXIA_EOF__'
[
 {
  "file": "lib/calculators/types.ts",
  "find": "export type InputKind = \"number\" | \"select\"\n",
  "replace": "export type InputKind = \"number\" | \"select\" | \"date\"\n"
 },
 {
  "file": "lib/calculators/registry.ts",
  "find": "import { withDoseVolume } from \"./dose-volume\"\n",
  "replace": "import { withDoseVolume } from \"./dose-volume\"\nimport {\n  dailyWaterIntakeCalculator,\n  estimatedDueDateCalculator,\n  gestationalAgeCalculator,\n  leanBodyMassCalculator,\n  targetHeartRateCalculator,\n  packYearsCalculator,\n  alcoholUnitsCalculator,\n} from \"./definitions/everyday\"\n"
 },
 {
  "file": "lib/calculators/registry.ts",
  "find": "  waistToHipRatioCalculator,\n  creatinineClearanceCalculator,\n",
  "replace": "  waistToHipRatioCalculator,\n  dailyWaterIntakeCalculator,\n  estimatedDueDateCalculator,\n  gestationalAgeCalculator,\n  leanBodyMassCalculator,\n  targetHeartRateCalculator,\n  packYearsCalculator,\n  alcoholUnitsCalculator,\n  creatinineClearanceCalculator,\n"
 },
 {
  "file": "lib/calculators/dosing-references.ts",
  "find": "import type { CalculatorDefinition } from \"./types\"\n",
  "replace": "import type { CalculatorDefinition } from \"./types\"\nimport { EVERYDAY_REFERENCES } from \"./everyday-references\"\n"
 },
 {
  "file": "lib/calculators/dosing-references.ts",
  "find": "export function getCalculatorReferences(definition: CalculatorDefinition): CalculatorReference[] {\n",
  "replace": "export function getCalculatorReferences(definition: CalculatorDefinition): CalculatorReference[] {\n  if (EVERYDAY_REFERENCES[definition.id]) return [EVERYDAY_REFERENCES[definition.id]]\n"
 },
 {
  "file": "components/calculators/calculator-field.tsx",
  "find": "  return (\n    <div className=\"space-y-1.5\">\n      <Label htmlFor={input.id}>\n        {input.label}\n        {input.optional ? <span className=\"text-muted-foreground font-normal\"> (optional)</span> : null}\n      </Label>\n      <div className=\"relative\">",
  "replace": "  if (input.kind === \"date\") {\n    return (\n      <div className=\"space-y-1.5\">\n        <Label htmlFor={input.id}>\n          {input.label}\n          {input.optional ? <span className=\"text-muted-foreground font-normal\"> (optional)</span> : null}\n        </Label>\n        <Input\n          id={input.id}\n          type=\"date\"\n          value={value}\n          aria-required={!input.optional}\n          aria-describedby={input.helpText ? `${input.id}-help` : undefined}\n          onChange={(e) => onChange(e.target.value)}\n          onKeyDown={(e) => {\n            if (e.key === \"Enter\") onEnter?.()\n          }}\n        />\n        {input.helpText ? <p id={`${input.id}-help`} className=\"text-xs text-muted-foreground\">{input.helpText}</p> : null}\n      </div>\n    )\n  }\n\n  return (\n    <div className=\"space-y-1.5\">\n      <Label htmlFor={input.id}>\n        {input.label}\n        {input.optional ? <span className=\"text-muted-foreground font-normal\"> (optional)</span> : null}\n      </Label>\n      <div className=\"relative\">"
 },
 {
  "file": "public/service-worker.js",
  "find": "  \"/calculators/general/waist-to-hip-ratio\",\n",
  "replace": "  \"/calculators/general/waist-to-hip-ratio\",\n  \"/calculators/general/daily-water-intake\",\n  \"/calculators/general/estimated-due-date\",\n  \"/calculators/general/gestational-age\",\n  \"/calculators/general/lean-body-mass\",\n  \"/calculators/general/target-heart-rate\",\n  \"/calculators/general/pack-years\",\n  \"/calculators/general/alcohol-units\",\n"
 }
]
__CLINEXIA_EOF__

say "Checking that your files match what this change expects..."
CHECK_OUT="$(node "$TMP_DIR/patch.mjs" "$TMP_DIR/edits.json" --check)" || die "Your files differ from the version this change was built for (see above). Nothing was changed."
echo "$CHECK_OUT"
case "$CHECK_OUT" in *landing*|*welcome*) die "A planned edit targets a landing/welcome file. Refusing to continue. Nothing was changed." ;; esac

say "Backing up originals to $BACKUP_DIR"
for f in lib/calculators/types.ts lib/calculators/registry.ts lib/calculators/dosing-references.ts components/calculators/calculator-field.tsx public/service-worker.js; do backup "$f"; done

say "Writing new files..."
write_file lib/calculators/date-helpers.ts <<'__CLINEXIA_EOF__'
import { CalculatorInputError } from "./helpers"

/**
 * Calendar-date helpers for calculators that take a `date` input (value "YYYY-MM-DD").
 * Dates are handled as UTC midnight timestamps so daylight-saving changes and the phone's time zone
 * can never shift a result by a day.
 */

const DAY_MS = 86_400_000
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** Parses "YYYY-MM-DD" into UTC midnight milliseconds. Rejects impossible dates such as 2025-02-30. */
export function parseIsoDate(raw: unknown, label: string): number {
  if (raw === undefined || raw === null || raw === "") throw new CalculatorInputError(`${label} is required`)
  const match = ISO_DATE.exec(String(raw))
  if (!match) throw new CalculatorInputError(`${label} must be a valid date`)
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const ms = Date.UTC(year, month - 1, day)
  const check = new Date(ms)
  const valid = check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day
  if (!valid || year < 1900 || year > 2200) throw new CalculatorInputError(`${label} must be a valid date`)
  return ms
}

/** Like parseIsoDate, but returns undefined when the input is blank or missing. */
export function optionalIsoDate(inputs: Record<string, number | string>, id: string, label: string): number | undefined {
  const raw = inputs[id]
  if (raw === undefined || raw === null || raw === "") return undefined
  return parseIsoDate(raw, label)
}

/** Today's calendar date on the user's device, as UTC midnight milliseconds. */
export function todayUtcMs(now: Date = new Date()): number {
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
}

export const addDays = (ms: number, days: number): number => ms + days * DAY_MS

/** Whole days from b to a (a - b). */
export const diffDays = (a: number, b: number): number => Math.round((a - b) / DAY_MS)

/** "Mon 12 Oct 2026": fixed wording so it never depends on the phone's locale or ICU data. */
export function formatDate(ms: number): string {
  const d = new Date(ms)
  return `${DAY_NAMES[d.getUTCDay()]} ${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export function formatIsoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

/** "24 weeks 3 days" from a number of days. */
export function weeksAndDays(totalDays: number): string {
  const weeks = Math.floor(totalDays / 7)
  const days = totalDays - weeks * 7
  return `${weeks} week${weeks === 1 ? "" : "s"} ${days} day${days === 1 ? "" : "s"}`
}
__CLINEXIA_EOF__

write_file lib/calculators/everyday-references.ts <<'__CLINEXIA_EOF__'
import type { CalculatorReference } from "./dosing-references"

const VERIFIED_ON = "2026-10-13"

const ACOG_DUE_DATE: CalculatorReference = {
  source: "ACOG Committee Opinion No. 700: Methods for Estimating the Due Date (ACOG, AIUM, SMFM)",
  version: "May 2017 (reaffirmed 2022)",
  url: "https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date",
  applicablePopulation: "Pregnancies dated from the last menstrual period. Early ultrasound dating, and the embryo transfer date after assisted reproduction, take precedence where available.",
  indication: "Estimating gestational age and the estimated due date (EDD).",
  lastVerified: VERIFIED_ON,
  status: "current",
  note: "Gestational age is counted from the first day of the last menstrual period; an average pregnancy is 280 days. Confirm there is no newer ACOG guidance.",
}

export const EVERYDAY_REFERENCES: Record<string, CalculatorReference> = {
  "daily-water-intake": {
    source: "EFSA Panel on Dietetic Products, Nutrition and Allergies (NDA): Scientific Opinion on Dietary Reference Values for water",
    version: "EFSA Journal 2010;8(3):1459",
    url: "https://doi.org/10.2903/j.efsa.2010.1459",
    applicablePopulation: "Healthy people aged 2 years and over, at moderate environmental temperature and moderate physical activity.",
    indication: "Adequate intake of total water (all drinks plus water in food).",
    lastVerified: VERIFIED_ON,
    status: "current",
    note: "Adequate intakes, not requirements. Pregnancy adds 300 mL/day and breastfeeding about 700 mL/day to the adult female value.",
  },
  "estimated-due-date": ACOG_DUE_DATE,
  "gestational-age": ACOG_DUE_DATE,
  "lean-body-mass": {
    source: "Boer P. Estimated lean body mass as an index for normalization of body fluid volumes in humans. Am J Physiol 1984;247(4):F632-F635",
    version: "1984 prediction equations",
    applicablePopulation: "Adults. Not for children.",
    indication: "Estimating lean body mass from sex, weight and height.",
    lastVerified: VERIFIED_ON,
    status: "current",
  },
  "target-heart-rate": {
    source: "Tanaka H, Monahan KD, Seals DR. Age-predicted maximal heart rate revisited. J Am Coll Cardiol 2001;37(1):153-156",
    version: "2001 (HRmax = 208 - 0.7 x age)",
    url: "https://pubmed.ncbi.nlm.nih.gov/11153730/",
    applicablePopulation: "Healthy adults. The equation was independent of sex and habitual activity; individual maximum heart rate varies by about 10 beats per minute or more around the estimate.",
    indication: "Estimating maximum heart rate; target rates use the heart rate reserve (Karvonen) method.",
    lastVerified: VERIFIED_ON,
    status: "current",
  },
  "pack-years": {
    source: "US Preventive Services Task Force: Screening for Lung Cancer (JAMA 2021;325(10):962-970)",
    version: "March 2021",
    url: "https://uspreventiveservicestaskforce.org/uspstf/recommendation/lung-cancer-screening",
    applicablePopulation: "Adults who smoke or have smoked cigarettes. The screening criteria quoted apply to ages 50 to 80.",
    indication: "Quantifying cumulative cigarette exposure. One pack-year is 20 cigarettes per day for one year.",
    lastVerified: VERIFIED_ON,
    status: "current",
    note: "Screening eligibility rules change; check current local guidance.",
  },
  "alcohol-units": {
    source: "UK Chief Medical Officers' Low Risk Drinking Guidelines",
    version: "2016",
    url: "https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/545937/UK_CMOs__report.pdf",
    applicablePopulation: "Adults. One UK unit is 10 mL (8 g) of pure alcohol. Other countries define units and standard drinks differently.",
    indication: "Converting a drink's volume and strength into UK units.",
    lastVerified: VERIFIED_ON,
    status: "current",
    note: "The guideline describes low-risk drinking, not safe drinking. If pregnant or planning a pregnancy, the safest approach is not to drink alcohol.",
  },
}
__CLINEXIA_EOF__

write_file lib/calculators/definitions/everyday.ts <<'__CLINEXIA_EOF__'
import type { CalculatorDefinition } from "../types"
import { CalculatorInputError, assertNonNegative, assertPositive, fmt, num, optionalNum, round, str } from "../helpers"
import { addDays, diffDays, formatDate, formatIsoDate, optionalIsoDate, parseIsoDate, todayUtcMs, weeksAndDays } from "../date-helpers"

/* ------------------------------------------------------------------ unit helpers */

const heightToCm = (value: number, unit: string) => {
  switch (unit) {
    case "m":
      return value * 100
    case "ft":
      return value * 30.48
    case "in":
      return value * 2.54
    default:
      return value
  }
}
const weightToKg = (value: number, unit: string) => (unit === "lb" ? value * 0.453592 : value)

function requireSex(inputs: Record<string, number | string>): "male" | "female" {
  const sex = str(inputs, "sex")
  if (sex !== "male" && sex !== "female") throw new CalculatorInputError("Select male or female")
  return sex
}

const SEX_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
]

/* ------------------------------------------------------------------ pregnancy dating */

const PREGNANCY_DAYS = 280
const STANDARD_CYCLE = 28

/** Naegele's rule: LMP + 280 days, shifted by how far the cycle length is from 28 days. */
export function estimatedDueDateMs(lmpMs: number, cycleLength: number): number {
  return addDays(lmpMs, PREGNANCY_DAYS + (cycleLength - STANDARD_CYCLE))
}

/** Days of gestation on `asOfMs`, counted from the LMP with the same cycle-length shift. */
export function gestationDaysFromLmp(lmpMs: number, asOfMs: number, cycleLength: number): number {
  return diffDays(asOfMs, lmpMs) - (cycleLength - STANDARD_CYCLE)
}

/** Trimester boundaries from ACOG Committee Opinion 700: first to 13w6d, second 14w0d to 27w6d, third from 28w0d. */
export function trimesterLabel(gestationDays: number): string {
  if (gestationDays < 14 * 7) return "First trimester"
  if (gestationDays < 28 * 7) return "Second trimester"
  return "Third trimester"
}

function readCycleLength(inputs: Record<string, number | string>): number {
  const raw = optionalNum(inputs, "cycleLength")
  const cycle = Math.round(raw ?? STANDARD_CYCLE)
  if (cycle < 21 || cycle > 45) throw new CalculatorInputError("Cycle length must be between 21 and 45 days")
  return cycle
}

const PREGNANCY_LIMITATIONS = [
  "Dating from the last menstrual period is unreliable if cycles are irregular, the date is uncertain, or hormonal contraception was used recently.",
  "An early ultrasound is the most accurate way to date a pregnancy and takes precedence when it differs enough from the LMP (ACOG CO 700 sets the thresholds). A pregnancy not confirmed by ultrasound before 22 0/7 weeks is considered suboptimally dated.",
  "After assisted reproduction (IVF, IUI), use the date the ART procedure gives, not the LMP.",
  "An estimate, not a diagnosis. Only a clinician can confirm gestational age and the due date.",
]

/* ------------------------------------------------------------------ 1. daily water intake */

/** EFSA (2010) adequate intake of total water, mL/day: drinks plus water in food. */
function waterAdequateIntake(age: number, sex: "male" | "female"): { ml: number; basis: string } {
  if (age < 4) return { ml: 1300, basis: "children 2 to 3 years" }
  if (age < 9) return { ml: 1600, basis: "children 4 to 8 years" }
  if (age < 14) return sex === "male" ? { ml: 2100, basis: "boys 9 to 13 years" } : { ml: 1900, basis: "girls 9 to 13 years" }
  return sex === "male" ? { ml: 2500, basis: "men (14 years and over)" } : { ml: 2000, basis: "women (14 years and over)" }
}

export const dailyWaterIntakeCalculator: CalculatorDefinition = {
  id: "daily-water-intake",
  name: "Daily Water Intake",
  shortName: "Water Intake",
  category: "general",
  isEstimator: true,
  description: "Adequate daily total water intake for a healthy person by age and sex, with the extra needed in pregnancy and breastfeeding.",
  formula: "Total water (mL/day) = EFSA adequate intake for age and sex + 300 mL (pregnancy) or + 700 mL (breastfeeding)",
  keywords: ["water", "hydration", "fluid", "daily water", "drink", "pregnancy", "breastfeeding", "efsa"],
  relatedTools: ["bmi", "bmr", "estimated-calorie-requirement"],
  inputs: [
    { id: "age", label: "Age", kind: "number", unit: "years", min: 2, max: 120, placeholder: "e.g. 30" },
    { id: "sex", label: "Sex", kind: "select", options: SEX_OPTIONS },
    {
      id: "status",
      label: "Pregnancy or breastfeeding",
      kind: "select",
      options: [
        { value: "none", label: "Neither" },
        { value: "pregnant", label: "Pregnant" },
        { value: "lactating", label: "Breastfeeding" },
      ],
      defaultValue: "none",
    },
  ],
  calculate: (inputs) => {
    const age = num(inputs, "age")
    const sex = requireSex(inputs)
    const status = str(inputs, "status")
    if (age < 2) throw new CalculatorInputError("This calculator covers ages 2 and over. Infants and toddlers under 2 have different needs.")
    if (age > 120) throw new CalculatorInputError("Age must be 120 or less")
    if (status !== "none" && status !== "pregnant" && status !== "lactating") throw new CalculatorInputError("Select a valid pregnancy or breastfeeding option")
    if (status !== "none") {
      if (sex !== "female") throw new CalculatorInputError("Pregnancy and breastfeeding apply to females only")
      if (age < 14) throw new CalculatorInputError("The pregnancy and breastfeeding adjustments apply from age 14")
    }

    const base = waterAdequateIntake(age, sex)
    const extra = status === "pregnant" ? 300 : status === "lactating" ? 700 : 0
    const total = base.ml + extra

    const secondary = [
      { label: "Total water", value: `${total} mL per day` },
      { label: "Adequate intake for", value: `${base.basis}: ${base.ml} mL` },
    ]
    if (extra) secondary.push({ label: status === "pregnant" ? "Added for pregnancy" : "Added for breastfeeding", value: `+${extra} mL` })

    return {
      value: total,
      unit: "mL/day",
      display: fmt(total / 1000, 1, "L per day"),
      secondary,
      calculationSteps: [extra ? `${base.ml} mL + ${extra} mL = ${total} mL` : `${base.ml} mL (${base.basis})`],
      interpretation: "Adequate intake of total water, which includes all drinks and the water in food, for a healthy person at moderate temperature and moderate activity.",
      warnings: ["Needs rise with heat, hard exercise, fever, vomiting or diarrhoea. People told to limit fluids should follow their clinician's target instead."],
    }
  },
  notes: [
    "EFSA adequate intakes of total water (mL/day): 2 to 3 years 1300; 4 to 8 years 1600; 9 to 13 years boys 2100, girls 1900; 14 years and over men 2500, women 2000.",
    "The figure covers water from drinks and from food, so it is not the amount to drink on its own.",
  ],
  limitations: [
    "Adequate intakes apply to healthy people at moderate environmental temperature and moderate physical activity.",
    "Not for people on a fluid restriction or with heart, kidney, liver or sodium-balance conditions; their targets come from their clinician.",
    "Covers ages 2 and over; infants and toddlers under 2 have different needs.",
    "Adequate intake is a population reference value, not an individual requirement.",
  ],
}

/* ------------------------------------------------------------------ 2. estimated due date */

export const estimatedDueDateCalculator: CalculatorDefinition = {
  id: "estimated-due-date",
  name: "Estimated Due Date (EDD)",
  shortName: "Due Date (EDD)",
  category: "general",
  isEstimator: true,
  description: "Estimates the due date from the first day of the last menstrual period (Naegele's rule: 280 days), adjusted for cycle length.",
  formula: "EDD = LMP + 280 days + (cycle length − 28) days",
  keywords: ["edd", "due date", "estimated due date", "pregnancy", "naegele", "lmp", "last menstrual period", "expected delivery", "gestation"],
  relatedTools: ["gestational-age"],
  inputs: [
    { id: "lmp", label: "First day of last menstrual period (LMP)", kind: "date", helpText: "The first day of your last period." },
    { id: "cycleLength", label: "Average cycle length", kind: "number", unit: "days", min: 21, max: 45, placeholder: "28", optional: true, helpText: "Leave blank for a 28-day cycle." },
  ],
  calculate: (inputs) => {
    const lmp = parseIsoDate(inputs.lmp, "Last menstrual period")
    const cycle = readCycleLength(inputs)
    const today = todayUtcMs()
    if (lmp > today) throw new CalculatorInputError("The last menstrual period cannot be in the future")

    const edd = estimatedDueDateMs(lmp, cycle)
    const gaToday = gestationDaysFromLmp(lmp, today, cycle)
    const untilDue = diffDays(edd, today)
    const adjustment = cycle - STANDARD_CYCLE

    const warnings: string[] = []
    if (gaToday > 42 * 7) warnings.push("More than 42 weeks have passed since this LMP. Check the date, or whether the pregnancy has already ended.")

    return {
      value: formatIsoDate(edd),
      display: formatDate(edd),
      secondary: [
        { label: "Gestational age today", value: weeksAndDays(gaToday) },
        { label: "Trimester today", value: trimesterLabel(gaToday) },
        { label: untilDue >= 0 ? "Days until due date" : "Days past due date", value: String(Math.abs(untilDue)) },
        { label: "Cycle length used", value: `${cycle} days` },
      ],
      calculationSteps: [
        `${formatDate(lmp)} + ${PREGNANCY_DAYS} days${adjustment ? ` ${adjustment > 0 ? "+" : "−"} ${Math.abs(adjustment)} days (cycle ${cycle} vs 28)` : ""} = ${formatDate(edd)}`,
      ],
      interpretation: "Estimated due date by last-menstrual-period dating (Naegele's rule). Most pregnancies are dated or confirmed by an early ultrasound; the clinician's date is the one to use.",
      warnings: warnings.length ? warnings : undefined,
    }
  },
  notes: [
    "Gestational age is counted from the first day of the last menstrual period; an average pregnancy lasts 280 days (40 weeks).",
    "Naegele's rule is the same as adding 280 days to the LMP: add 7 days, subtract 3 months, add 1 year.",
    "A cycle longer or shorter than 28 days moves the date by the difference.",
  ],
  limitations: PREGNANCY_LIMITATIONS,
}

/* ------------------------------------------------------------------ 3. gestational age */

export const gestationalAgeCalculator: CalculatorDefinition = {
  id: "gestational-age",
  name: "Gestational Age",
  shortName: "Gestational Age",
  category: "general",
  isEstimator: true,
  description: "Weeks and days of pregnancy on a chosen date, from either the last menstrual period or the due date.",
  formula: "Gestational age = date − LMP (adjusted for cycle length), or 280 days − (EDD − date)",
  keywords: ["gestational age", "weeks pregnant", "pregnancy", "trimester", "lmp", "edd", "gestation", "how far along"],
  relatedTools: ["estimated-due-date"],
  inputs: [
    { id: "lmp", label: "First day of last menstrual period (LMP)", kind: "date", optional: true, helpText: "Enter either the LMP or the due date, not both." },
    { id: "edd", label: "Estimated due date (EDD)", kind: "date", optional: true, helpText: "Use this if you know the due date but not the LMP." },
    { id: "asOf", label: "Calculate for this date", kind: "date", optional: true, helpText: "Leave blank for today." },
    { id: "cycleLength", label: "Average cycle length (LMP method only)", kind: "number", unit: "days", min: 21, max: 45, placeholder: "28", optional: true },
  ],
  calculate: (inputs) => {
    const lmp = optionalIsoDate(inputs, "lmp", "Last menstrual period")
    const edd = optionalIsoDate(inputs, "edd", "Due date")
    if (lmp === undefined && edd === undefined) throw new CalculatorInputError("Enter either the last menstrual period or the due date")
    if (lmp !== undefined && edd !== undefined) throw new CalculatorInputError("Enter either the last menstrual period or the due date, not both")
    const asOf = optionalIsoDate(inputs, "asOf", "Calculation date") ?? todayUtcMs()
    const cycle = readCycleLength(inputs)

    let gestationDays: number
    let dueMs: number
    let method: string
    if (lmp !== undefined) {
      gestationDays = gestationDaysFromLmp(lmp, asOf, cycle)
      dueMs = estimatedDueDateMs(lmp, cycle)
      method = "last menstrual period"
    } else {
      dueMs = edd as number
      gestationDays = PREGNANCY_DAYS - diffDays(dueMs, asOf)
      method = "due date"
    }
    if (gestationDays < 0) throw new CalculatorInputError("The calculation date is before the start of the pregnancy for these dates")

    const untilDue = diffDays(dueMs, asOf)
    const warnings: string[] = []
    if (gestationDays > 42 * 7) warnings.push("This is beyond 42 weeks. Check the dates, or whether the pregnancy has already ended.")

    return {
      value: weeksAndDays(gestationDays),
      display: weeksAndDays(gestationDays),
      secondary: [
        { label: "Trimester", value: trimesterLabel(gestationDays) },
        { label: "Total days", value: String(gestationDays) },
        { label: "Estimated due date", value: formatDate(dueMs) },
        { label: untilDue >= 0 ? "Days until due date" : "Days past due date", value: String(Math.abs(untilDue)) },
        { label: "Calculated for", value: formatDate(asOf) },
      ],
      calculationSteps: [`Counted from the ${method}: ${gestationDays} days = ${weeksAndDays(gestationDays)}`],
      interpretation: "Gestational age by menstrual or due-date dating. Trimester boundaries follow ACOG: first trimester to 13 weeks 6 days, second 14 weeks 0 days to 27 weeks 6 days, third from 28 weeks 0 days.",
      warnings: warnings.length ? warnings : undefined,
    }
  },
  notes: [
    "Gestational age is counted from the first day of the last menstrual period, so it runs about two weeks ahead of the time since conception.",
    "When you enter a due date, the pregnancy is taken to start 280 days before it.",
  ],
  limitations: PREGNANCY_LIMITATIONS,
}

/* ------------------------------------------------------------------ 4. lean body mass (Boer) */

export const leanBodyMassCalculator: CalculatorDefinition = {
  id: "lean-body-mass",
  name: "Lean Body Mass (Boer)",
  shortName: "Lean Body Mass",
  category: "general",
  isEstimator: true,
  description: "Estimates lean body mass from sex, weight and height with the Boer equations.",
  formula: "Men: LBM = 0.407 × weight (kg) + 0.267 × height (cm) − 19.2.  Women: LBM = 0.252 × weight (kg) + 0.473 × height (cm) − 48.3",
  keywords: ["lean body mass", "lbm", "boer", "fat free mass", "body composition", "fat mass"],
  relatedTools: ["bmi", "bsa", "ideal-body-weight", "adjusted-body-weight"],
  inputs: [
    { id: "sex", label: "Sex", kind: "select", options: SEX_OPTIONS },
    { id: "weight", label: "Weight", kind: "number", unit: "kg", min: 0, placeholder: "e.g. 70" },
    {
      id: "weightUnit",
      label: "Weight unit",
      kind: "select",
      options: [
        { value: "kg", label: "kg" },
        { value: "lb", label: "lb" },
      ],
      defaultValue: "kg",
    },
    { id: "height", label: "Height", kind: "number", unit: "cm", min: 0, placeholder: "e.g. 170" },
    {
      id: "heightUnit",
      label: "Height unit",
      kind: "select",
      options: [
        { value: "cm", label: "cm" },
        { value: "m", label: "m" },
        { value: "ft", label: "ft" },
        { value: "in", label: "in" },
      ],
      defaultValue: "cm",
    },
  ],
  calculate: (inputs) => {
    const sex = requireSex(inputs)
    const weight = num(inputs, "weight")
    const height = num(inputs, "height")
    assertPositive(weight, "Weight")
    assertPositive(height, "Height")
    const weightKg = weightToKg(weight, str(inputs, "weightUnit"))
    const heightCm = heightToCm(height, str(inputs, "heightUnit"))

    const lbm = sex === "male" ? 0.407 * weightKg + 0.267 * heightCm - 19.2 : 0.252 * weightKg + 0.473 * heightCm - 48.3
    if (!(lbm > 0)) throw new CalculatorInputError("The equation gives no valid result for these values. Check weight and height.")

    const fat = weightKg - lbm
    const warnings: string[] = []
    if (lbm > weightKg) warnings.push("The estimated lean mass is higher than body weight, so the equation is outside its useful range for these values.")

    return {
      value: round(lbm, 1),
      unit: "kg",
      display: fmt(lbm, 1, "kg"),
      secondary: [
        { label: "Lean mass as % of weight", value: `${round((lbm / weightKg) * 100, 0)}%` },
        { label: "Estimated non-lean (fat) mass", value: fat > 0 ? fmt(fat, 1, "kg") : "0 kg" },
      ],
      calculationSteps: [
        sex === "male"
          ? `0.407 × ${round(weightKg, 1)} + 0.267 × ${round(heightCm, 1)} − 19.2`
          : `0.252 × ${round(weightKg, 1)} + 0.473 × ${round(heightCm, 1)} − 48.3`,
      ],
      interpretation: "Estimated lean body mass (everything except fat: muscle, bone, organs and water). It is calculated from size and sex, so it does not measure muscle.",
      warnings: warnings.length ? warnings : undefined,
    }
  },
  notes: [
    "Used to size some drug doses and to normalise body fluid volumes, because fat contributes little to them.",
    "James and Hume equations also exist and can differ from Boer by a few kilograms.",
  ],
  limitations: [
    "A prediction equation from adults; not for children.",
    "Two people of the same height, weight and sex get the same answer whatever their muscle or fat, and prediction equations are less reliable at the extremes of body size.",
    "Does not replace body composition measurement (for example DXA or bioimpedance) where that matters.",
  ],
}

/* ------------------------------------------------------------------ 5. target heart rate (Karvonen) */

const INTENSITIES = [0.5, 0.6, 0.7, 0.8, 0.9]

export const targetHeartRateCalculator: CalculatorDefinition = {
  id: "target-heart-rate",
  name: "Target Heart Rate (Karvonen)",
  shortName: "Target Heart Rate",
  category: "general",
  isEstimator: true,
  description: "Estimated maximum heart rate (Tanaka) and exercise target heart rates from heart rate reserve (Karvonen).",
  formula: "HRmax = 208 − 0.7 × age.  Target HR = resting HR + % × (HRmax − resting HR)",
  keywords: ["heart rate", "target heart rate", "max heart rate", "hrmax", "karvonen", "tanaka", "heart rate reserve", "exercise", "training zone"],
  relatedTools: ["mean-arterial-pressure", "pulse-pressure"],
  inputs: [
    { id: "age", label: "Age", kind: "number", unit: "years", min: 18, max: 100, placeholder: "e.g. 35" },
    { id: "restingHr", label: "Resting heart rate", kind: "number", unit: "bpm", min: 30, max: 120, placeholder: "e.g. 65", helpText: "Count the pulse for a full minute after resting, ideally first thing in the morning." },
  ],
  calculate: (inputs) => {
    const age = num(inputs, "age")
    const rest = num(inputs, "restingHr")
    if (age < 18 || age > 100) throw new CalculatorInputError("Age must be between 18 and 100 years")
    if (rest < 30 || rest > 120) throw new CalculatorInputError("Resting heart rate must be between 30 and 120 bpm")

    const hrMax = Math.round(208 - 0.7 * age)
    if (rest >= hrMax) throw new CalculatorInputError("Resting heart rate must be lower than the estimated maximum heart rate")
    const reserve = hrMax - rest

    return {
      value: hrMax,
      unit: "bpm",
      display: fmt(hrMax, 0, "bpm"),
      secondary: [
        { label: "Heart rate reserve", value: `${reserve} bpm` },
        ...INTENSITIES.map((p) => ({ label: `Target at ${Math.round(p * 100)}% of reserve`, value: `${Math.round(rest + p * reserve)} bpm` })),
      ],
      calculationSteps: [`HRmax = 208 − 0.7 × ${age} = ${hrMax} bpm`, `Reserve = ${hrMax} − ${rest} = ${reserve} bpm`],
      interpretation: "Estimated maximum heart rate with target rates at several intensities. Pick the intensity that suits your fitness and your clinician's advice.",
      warnings: ["Individual maximum heart rate can differ from the estimate by about 10 beats per minute or more."],
    }
  },
  notes: [
    "The Tanaka equation comes from a meta-analysis of 18,712 healthy adults (351 studies) and was independent of sex and habitual activity. It is used in place of the older 220 − age rule.",
    "The Karvonen method adds a percentage of the heart rate reserve to the resting rate, so a fitter person with a lower resting rate gets lower targets.",
  ],
  limitations: [
    "For healthy adults. Not for people with heart disease, arrhythmias or other conditions where an exercise heart rate limit has been set; follow your clinician.",
    "Beta-blockers and some other medicines lower heart rate, so the estimated targets are not valid on them.",
    "Based on age alone; it does not replace a maximal exercise test.",
  ],
}

/* ------------------------------------------------------------------ 6. pack-years */

export const packYearsCalculator: CalculatorDefinition = {
  id: "pack-years",
  name: "Pack-Years (Smoking)",
  shortName: "Pack-Years",
  category: "general",
  description: "Cumulative cigarette smoking exposure in pack-years.",
  formula: "Pack-years = (cigarettes per day ÷ cigarettes per pack) × years smoked",
  keywords: ["pack years", "pack-years", "smoking", "cigarettes", "tobacco", "smoking history", "lung cancer screening"],
  relatedTools: ["alcohol-units"],
  inputs: [
    { id: "cigarettesPerDay", label: "Cigarettes per day", kind: "number", min: 0, placeholder: "e.g. 10" },
    { id: "yearsSmoked", label: "Years smoked", kind: "number", unit: "years", min: 0, max: 90, placeholder: "e.g. 15" },
    { id: "cigarettesPerPack", label: "Cigarettes per pack", kind: "number", min: 1, placeholder: "20", optional: true, helpText: "Leave blank for a standard 20-cigarette pack." },
  ],
  calculate: (inputs) => {
    const perDay = num(inputs, "cigarettesPerDay")
    const years = num(inputs, "yearsSmoked")
    const perPack = optionalNum(inputs, "cigarettesPerPack") ?? 20
    assertPositive(perDay, "Cigarettes per day")
    assertPositive(years, "Years smoked")
    assertPositive(perPack, "Cigarettes per pack")
    if (years > 90) throw new CalculatorInputError("Years smoked must be 90 or less")

    const packYears = (perDay / perPack) * years
    return {
      value: round(packYears, 1),
      unit: "pack-years",
      display: fmt(packYears, 1, "pack-years"),
      secondary: [{ label: "20 pack-years or more", value: packYears >= 20 ? "Yes" : "No" }],
      calculationSteps: [`(${perDay} ÷ ${perPack}) × ${years} years = ${round(packYears, 1)}`],
      interpretation: "One pack-year equals smoking 20 cigarettes (one pack) a day for a year. A history of 20 or more pack-years is one of the criteria in the 2021 USPSTF lung cancer screening recommendation, which also requires age 50 to 80 and current smoking or quitting within the past 15 years.",
    }
  },
  notes: [
    "If the amount smoked changed over time, calculate each period separately and add the results.",
    "Screening eligibility rules differ between countries and change over time; check current local guidance.",
  ],
  limitations: [
    "Based on cigarettes only; pipes, cigars, shisha and other tobacco use are not converted.",
    "Relies on the person's recall of past smoking.",
    "Pack-years measure exposure, not risk by themselves; age, years since quitting and other factors matter.",
  ],
}

/* ------------------------------------------------------------------ 7. alcohol units */

const UK_UNIT_ML = 10
const UK_UNIT_GRAMS = 8
const UK_WEEKLY_GUIDELINE_UNITS = 14

export const alcoholUnitsCalculator: CalculatorDefinition = {
  id: "alcohol-units",
  name: "Alcohol Units (UK)",
  shortName: "Alcohol Units",
  category: "general",
  description: "UK alcohol units in a drink from its volume and strength, with the pure alcohol it contains.",
  formula: "Units = volume (mL) × ABV (%) ÷ 1000.  One UK unit = 10 mL (8 g) of pure alcohol",
  keywords: ["alcohol", "units", "abv", "drink", "drinking", "alcohol units", "beer", "wine", "spirits", "low risk drinking"],
  relatedTools: ["pack-years"],
  inputs: [
    { id: "volume", label: "Volume of one drink", kind: "number", unit: "mL", min: 0, placeholder: "e.g. 175" },
    { id: "abv", label: "Alcohol strength (ABV)", kind: "number", unit: "%", min: 0, max: 100, placeholder: "e.g. 13" },
    { id: "drinks", label: "Number of drinks", kind: "number", min: 0, placeholder: "1", optional: true, helpText: "Leave blank for one drink." },
  ],
  calculate: (inputs) => {
    const volume = num(inputs, "volume")
    const abv = num(inputs, "abv")
    const drinks = optionalNum(inputs, "drinks") ?? 1
    assertPositive(volume, "Volume")
    assertNonNegative(abv, "Alcohol strength")
    assertPositive(drinks, "Number of drinks")
    if (abv > 100) throw new CalculatorInputError("Alcohol strength (ABV) cannot be more than 100%")

    const units = ((volume * abv) / 1000) * drinks
    return {
      value: round(units, 1),
      unit: "UK units",
      display: fmt(units, 1, "UK units"),
      secondary: [
        { label: "Pure alcohol", value: `${fmt(units * UK_UNIT_ML, 0, "mL")} (about ${fmt(units * UK_UNIT_GRAMS, 0, "g")})` },
        { label: "Share of the UK weekly guideline (14 units)", value: `${round((units / UK_WEEKLY_GUIDELINE_UNITS) * 100, 0)}%` },
      ],
      calculationSteps: [`${volume} mL × ${abv}% ÷ 1000${drinks !== 1 ? ` × ${drinks} drinks` : ""} = ${round(units, 2)} units`],
      interpretation: "The UK Chief Medical Officers advise not regularly drinking more than 14 units a week, spread over three or more days. That is low-risk drinking, not safe drinking. If pregnant or planning a pregnancy, the safest approach is not to drink alcohol.",
    }
  },
  notes: [
    "A pint of 4% beer is about 2.3 units; a 175 mL glass of 13% wine is about 2.3 units; a 25 mL spirit measure at 40% is 1 unit.",
    "Home pours are often larger than bar measures, so units are easy to underestimate.",
  ],
  limitations: [
    "Uses the UK unit (10 mL or 8 g of pure alcohol). Other countries define units and standard drinks differently.",
    "Does not estimate blood alcohol concentration or fitness to drive.",
    "Not advice for anyone who is pregnant, on interacting medicines or with a health condition affected by alcohol.",
  ],
}

export const everydayCalculators: CalculatorDefinition[] = [
  dailyWaterIntakeCalculator,
  estimatedDueDateCalculator,
  gestationalAgeCalculator,
  leanBodyMassCalculator,
  targetHeartRateCalculator,
  packYearsCalculator,
  alcoholUnitsCalculator,
]
__CLINEXIA_EOF__

write_file lib/calculators/definitions/everyday.test.ts <<'__CLINEXIA_EOF__'
import { describe, expect, it } from "vitest"
import {
  alcoholUnitsCalculator,
  dailyWaterIntakeCalculator,
  estimatedDueDateCalculator,
  estimatedDueDateMs,
  gestationalAgeCalculator,
  gestationDaysFromLmp,
  leanBodyMassCalculator,
  packYearsCalculator,
  targetHeartRateCalculator,
  trimesterLabel,
} from "./everyday"
import { addDays, formatDate, formatIsoDate, parseIsoDate, todayUtcMs, weeksAndDays } from "../date-helpers"

const secondary = (r: { secondary?: { label: string; value: string }[] }, label: string) => r.secondary?.find((s) => s.label === label)?.value
const iso = (ms: number) => formatIsoDate(ms)

describe("date helpers", () => {
  it("parses valid dates and rejects impossible or malformed ones", () => {
    expect(formatIsoDate(parseIsoDate("2025-02-28", "Date"))).toBe("2025-02-28")
    expect(formatIsoDate(parseIsoDate("2024-02-29", "Date"))).toBe("2024-02-29")
    expect(() => parseIsoDate("2025-02-30", "Date")).toThrow()
    expect(() => parseIsoDate("13/01/2025", "Date")).toThrow()
    expect(() => parseIsoDate("", "Date")).toThrow()
    expect(() => parseIsoDate(undefined, "Date")).toThrow()
    expect(() => parseIsoDate("1800-01-01", "Date")).toThrow()
  })
  it("formats a date with fixed wording", () => {
    expect(formatDate(Date.UTC(2026, 9, 12))).toBe("Mon 12 Oct 2026")
  })
  it("formats weeks and days with correct plurals", () => {
    expect(weeksAndDays(0)).toBe("0 weeks 0 days")
    expect(weeksAndDays(8)).toBe("1 week 1 day")
    expect(weeksAndDays(100)).toBe("14 weeks 2 days")
  })
})

describe("dailyWaterIntakeCalculator", () => {
  const run = (age: number, sex: string, status = "none") => dailyWaterIntakeCalculator.calculate({ age, sex, status })
  it("returns the EFSA adequate intake for adults", () => {
    expect(run(30, "male").value).toBe(2500)
    expect(run(30, "female").value).toBe(2000)
    expect(run(30, "male").display).toBe("2.5 L per day")
  })
  it("returns the EFSA values for children", () => {
    expect(run(2, "female").value).toBe(1300)
    expect(run(3, "male").value).toBe(1300)
    expect(run(5, "female").value).toBe(1600)
    expect(run(10, "male").value).toBe(2100)
    expect(run(10, "female").value).toBe(1900)
    expect(run(14, "male").value).toBe(2500)
  })
  it("adds 300 mL in pregnancy and 700 mL when breastfeeding", () => {
    expect(run(28, "female", "pregnant").value).toBe(2300)
    expect(run(28, "female", "lactating").value).toBe(2700)
    expect(secondary(run(28, "female", "pregnant"), "Added for pregnancy")).toBe("+300 mL")
  })
  it("rejects invalid combinations", () => {
    expect(() => run(1, "female")).toThrow()
    expect(() => run(130, "male")).toThrow()
    expect(() => run(30, "male", "pregnant")).toThrow()
    expect(() => run(12, "female", "pregnant")).toThrow()
    expect(() => run(30, "other")).toThrow()
    expect(() => dailyWaterIntakeCalculator.calculate({ sex: "male", status: "none" })).toThrow()
  })
})

describe("pregnancy dating helpers", () => {
  it("applies Naegele's rule: LMP + 280 days", () => {
    expect(iso(estimatedDueDateMs(parseIsoDate("2025-01-01", "d"), 28))).toBe("2025-10-08")
  })
  it("shifts the due date with cycle length", () => {
    expect(iso(estimatedDueDateMs(parseIsoDate("2025-01-01", "d"), 35))).toBe("2025-10-15")
    expect(iso(estimatedDueDateMs(parseIsoDate("2025-01-01", "d"), 24))).toBe("2025-10-04")
  })
  it("counts gestational days from the LMP, adjusting for cycle length", () => {
    const lmp = parseIsoDate("2025-01-01", "d")
    const asOf = parseIsoDate("2025-04-11", "d")
    expect(gestationDaysFromLmp(lmp, asOf, 28)).toBe(100)
    expect(gestationDaysFromLmp(lmp, asOf, 35)).toBe(93)
  })
  it("uses the ACOG trimester boundaries", () => {
    expect(trimesterLabel(13 * 7 + 6)).toBe("First trimester")
    expect(trimesterLabel(14 * 7)).toBe("Second trimester")
    expect(trimesterLabel(27 * 7 + 6)).toBe("Second trimester")
    expect(trimesterLabel(28 * 7)).toBe("Third trimester")
  })
})

describe("estimatedDueDateCalculator", () => {
  it("returns the due date for a known LMP", () => {
    const r = estimatedDueDateCalculator.calculate({ lmp: "2025-01-01" })
    expect(r.value).toBe("2025-10-08")
    expect(r.display).toBe("Wed 8 Oct 2025")
  })
  it("treats a blank or missing cycle length as 28 days", () => {
    expect(estimatedDueDateCalculator.calculate({ lmp: "2025-01-01", cycleLength: "" }).value).toBe("2025-10-08")
    expect(estimatedDueDateCalculator.calculate({ lmp: "2025-01-01", cycleLength: 35 }).value).toBe("2025-10-15")
  })
  it("reports gestational age today for a recent LMP", () => {
    const lmp = iso(addDays(todayUtcMs(), -100))
    const r = estimatedDueDateCalculator.calculate({ lmp })
    expect(secondary(r, "Gestational age today")).toBe("14 weeks 2 days")
    expect(secondary(r, "Trimester today")).toBe("Second trimester")
    expect(secondary(r, "Days until due date")).toBe("180")
  })
  it("rejects a future LMP, a bad date and an out-of-range cycle", () => {
    expect(() => estimatedDueDateCalculator.calculate({ lmp: iso(addDays(todayUtcMs(), 1)) })).toThrow()
    expect(() => estimatedDueDateCalculator.calculate({ lmp: "2025-02-30" })).toThrow()
    expect(() => estimatedDueDateCalculator.calculate({})).toThrow()
    expect(() => estimatedDueDateCalculator.calculate({ lmp: "2025-01-01", cycleLength: 10 })).toThrow()
  })
  it("warns when the LMP is more than 42 weeks ago", () => {
    const r = estimatedDueDateCalculator.calculate({ lmp: iso(addDays(todayUtcMs(), -320)) })
    expect(r.warnings?.length).toBe(1)
  })
})

describe("gestationalAgeCalculator", () => {
  it("calculates from the LMP on a chosen date", () => {
    const r = gestationalAgeCalculator.calculate({ lmp: "2025-01-01", asOf: "2025-04-11" })
    expect(r.display).toBe("14 weeks 2 days")
    expect(secondary(r, "Trimester")).toBe("Second trimester")
    expect(secondary(r, "Total days")).toBe("100")
    expect(secondary(r, "Estimated due date")).toBe("Wed 8 Oct 2025")
  })
  it("gives the same answer from the matching due date", () => {
    const r = gestationalAgeCalculator.calculate({ edd: "2025-10-08", asOf: "2025-04-11" })
    expect(r.display).toBe("14 weeks 2 days")
  })
  it("adjusts for cycle length on the LMP method", () => {
    const r = gestationalAgeCalculator.calculate({ lmp: "2025-01-01", asOf: "2025-04-11", cycleLength: 35 })
    expect(r.display).toBe("13 weeks 2 days")
    expect(secondary(r, "Trimester")).toBe("First trimester")
  })
  it("accepts blank optional inputs (web sends empty strings, mobile omits them)", () => {
    const r = gestationalAgeCalculator.calculate({ lmp: "2025-01-01", edd: "", asOf: "2025-04-11", cycleLength: "" })
    expect(r.display).toBe("14 weeks 2 days")
  })
  it("defaults to today", () => {
    const r = gestationalAgeCalculator.calculate({ lmp: iso(addDays(todayUtcMs(), -100)) })
    expect(r.display).toBe("14 weeks 2 days")
  })
  it("requires exactly one of LMP or due date, and a sensible date", () => {
    expect(() => gestationalAgeCalculator.calculate({ asOf: "2025-04-11" })).toThrow()
    expect(() => gestationalAgeCalculator.calculate({ lmp: "2025-01-01", edd: "2025-10-08" })).toThrow()
    expect(() => gestationalAgeCalculator.calculate({ lmp: "2025-04-11", asOf: "2025-01-01" })).toThrow()
  })
})

describe("leanBodyMassCalculator", () => {
  it("applies the Boer equation for men", () => {
    const r = leanBodyMassCalculator.calculate({ sex: "male", weight: 75, weightUnit: "kg", height: 180, heightUnit: "cm" })
    expect(r.value).toBe(59.4)
  })
  it("applies the Boer equation for women", () => {
    const r = leanBodyMassCalculator.calculate({ sex: "female", weight: 62, weightUnit: "kg", height: 168, heightUnit: "cm" })
    expect(r.value).toBe(46.8)
    expect(secondary(r, "Estimated non-lean (fat) mass")).toBe("15.2 kg")
  })
  it("converts pounds and inches", () => {
    const r = leanBodyMassCalculator.calculate({ sex: "male", weight: 165.347, weightUnit: "lb", height: 70.866, heightUnit: "in" })
    expect(r.value as number).toBeCloseTo(59.4, 0)
  })
  it("rejects missing, zero or invalid values", () => {
    expect(() => leanBodyMassCalculator.calculate({ weight: 75, weightUnit: "kg", height: 180, heightUnit: "cm" })).toThrow()
    expect(() => leanBodyMassCalculator.calculate({ sex: "male", weight: 0, weightUnit: "kg", height: 180, heightUnit: "cm" })).toThrow()
    expect(() => leanBodyMassCalculator.calculate({ sex: "female", weight: 20, weightUnit: "kg", height: 30, heightUnit: "cm" })).toThrow()
  })
})

describe("targetHeartRateCalculator", () => {
  it("estimates maximum heart rate with Tanaka and targets with Karvonen", () => {
    const r = targetHeartRateCalculator.calculate({ age: 40, restingHr: 60 })
    expect(r.value).toBe(180)
    expect(secondary(r, "Heart rate reserve")).toBe("120 bpm")
    expect(secondary(r, "Target at 50% of reserve")).toBe("120 bpm")
    expect(secondary(r, "Target at 70% of reserve")).toBe("144 bpm")
    expect(secondary(r, "Target at 90% of reserve")).toBe("168 bpm")
  })
  it("rejects out-of-range ages and resting rates", () => {
    expect(() => targetHeartRateCalculator.calculate({ age: 17, restingHr: 60 })).toThrow()
    expect(() => targetHeartRateCalculator.calculate({ age: 101, restingHr: 60 })).toThrow()
    expect(() => targetHeartRateCalculator.calculate({ age: 40, restingHr: 20 })).toThrow()
    expect(() => targetHeartRateCalculator.calculate({ age: 40 })).toThrow()
  })
})

describe("packYearsCalculator", () => {
  it("multiplies packs per day by years", () => {
    expect(packYearsCalculator.calculate({ cigarettesPerDay: 20, yearsSmoked: 10 }).value).toBe(10)
    expect(packYearsCalculator.calculate({ cigarettesPerDay: 10, yearsSmoked: 20 }).display).toBe("10 pack-years")
  })
  it("honours a custom pack size and flags 20 or more", () => {
    expect(packYearsCalculator.calculate({ cigarettesPerDay: 25, yearsSmoked: 10, cigarettesPerPack: 25 }).value).toBe(10)
    expect(secondary(packYearsCalculator.calculate({ cigarettesPerDay: 20, yearsSmoked: 25 }), "20 pack-years or more")).toBe("Yes")
    expect(secondary(packYearsCalculator.calculate({ cigarettesPerDay: 20, yearsSmoked: 19 }), "20 pack-years or more")).toBe("No")
  })
  it("treats a blank pack size as 20 and rejects zero or missing values", () => {
    expect(packYearsCalculator.calculate({ cigarettesPerDay: 20, yearsSmoked: 10, cigarettesPerPack: "" }).value).toBe(10)
    expect(() => packYearsCalculator.calculate({ cigarettesPerDay: 0, yearsSmoked: 10 })).toThrow()
    expect(() => packYearsCalculator.calculate({ cigarettesPerDay: 10 })).toThrow()
    expect(() => packYearsCalculator.calculate({ cigarettesPerDay: 10, yearsSmoked: 95 })).toThrow()
  })
})

describe("alcoholUnitsCalculator", () => {
  it("converts volume and strength to UK units", () => {
    expect(alcoholUnitsCalculator.calculate({ volume: 440, abv: 5 }).value).toBe(2.2)
    expect(alcoholUnitsCalculator.calculate({ volume: 175, abv: 13 }).display).toBe("2.3 UK units")
    expect(alcoholUnitsCalculator.calculate({ volume: 25, abv: 40 }).value).toBe(1)
  })
  it("multiplies by the number of drinks and reports pure alcohol", () => {
    const r = alcoholUnitsCalculator.calculate({ volume: 440, abv: 5, drinks: 2 })
    expect(r.value).toBe(4.4)
    expect(secondary(r, "Pure alcohol")).toBe("44 mL (about 35 g)")
    expect(secondary(r, "Share of the UK weekly guideline (14 units)")).toBe("31%")
  })
  it("treats a blank drink count as one and accepts alcohol-free drinks", () => {
    expect(alcoholUnitsCalculator.calculate({ volume: 440, abv: 5, drinks: "" }).value).toBe(2.2)
    expect(alcoholUnitsCalculator.calculate({ volume: 330, abv: 0 }).value).toBe(0)
  })
  it("rejects impossible values", () => {
    expect(() => alcoholUnitsCalculator.calculate({ volume: 0, abv: 5 })).toThrow()
    expect(() => alcoholUnitsCalculator.calculate({ volume: 330, abv: 101 })).toThrow()
    expect(() => alcoholUnitsCalculator.calculate({ volume: 330, abv: -1 })).toThrow()
    expect(() => alcoholUnitsCalculator.calculate({ volume: 330, abv: 5, drinks: 0 })).toThrow()
  })
})
__CLINEXIA_EOF__

say "Patching existing files..."
node "$TMP_DIR/patch.mjs" "$TMP_DIR/edits.json"

APPLIED=1

if [ -f .gitignore ] && ! grep -qx '.clinexia-fix-backup/' .gitignore; then
  printf '\n# Clinexia fix backups\n.clinexia-fix-backup/\n' >> .gitignore
fi

if [ "$SKIP_VERIFY" -eq 0 ] && command -v pnpm >/dev/null 2>&1 && [ -d node_modules ]; then
  say "Running typecheck and tests..."
  if pnpm typecheck && pnpm test; then
    say "Typecheck and tests passed."
  else
    warn "Typecheck/tests reported problems. Your originals are in $BACKUP_DIR (copy them back to undo)."
  fi
else
  warn "Skipped typecheck/tests (pnpm or node_modules not found, or --skip-verify). Please run: pnpm typecheck && pnpm test"
fi

say "Done."
echo
echo "Next steps"
echo "  1. pnpm dev, open /calculators/general and try each new calculator. The two pregnancy ones show a date picker."
echo "  2. Deploy. The service worker picks up the new routes, so they also work offline after the next online visit."
echo "  3. Landing page: not touched. If it shows a calculator count, check it still reads the way you want."
echo
echo "Undo: copy the files in $BACKUP_DIR back over the repo, and delete lib/calculators/date-helpers.ts, lib/calculators/everyday-references.ts and lib/calculators/definitions/everyday*.ts."
