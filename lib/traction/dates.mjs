// Day boundaries use Africa/Lagos (UTC+1, no daylight saving), matching the existing admin dashboard.
const LAGOS_OFFSET_MS = 60 * 60 * 1000

/** @param {string|number|Date} ts @returns {string} YYYY-MM-DD in Africa/Lagos */
export function lagosDay(ts) {
  const d = new Date(ts)
  return new Date(d.getTime() + LAGOS_OFFSET_MS).toISOString().slice(0, 10)
}

/** @param {string} day YYYY-MM-DD @param {number} n @returns {string} */
export function addDays(day, n) {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Whole days from a to b (b - a). */
export function daysBetween(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000)
}

/** @param {string} day @returns {string} YYYY-MM */
export function monthKey(day) {
  return day.slice(0, 7)
}

/** Subtract calendar months from a day, clamping the day of month. */
export function addMonths(day, n) {
  const [y, m, d] = day.split("-").map(Number)
  const total = y * 12 + (m - 1) + n
  const ny = Math.floor(total / 12)
  const nm = (total % 12 + 12) % 12
  const last = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate()
  return `${ny}-${String(nm + 1).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`
}

export function isDay(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
}
