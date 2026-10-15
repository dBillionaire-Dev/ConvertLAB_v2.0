// CSV export helpers. Cells that start with = + - @ are prefixed with ' so spreadsheet apps never run
// them as formulas (search queries are user-generated text).
export function csvCell(value) {
  if (value === null || value === undefined) return ""
  let s = typeof value === "string" ? value : String(value)
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** @param {string[]} columns @param {Record<string, unknown>[]} rows */
export function toCsv(columns, rows) {
  const lines = [columns.map(csvCell).join(",")]
  for (const row of rows) lines.push(columns.map((c) => csvCell(row[c])).join(","))
  return lines.join("\r\n") + "\r\n"
}
