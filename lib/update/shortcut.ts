// The hidden shortcut that opens /diagnostics: Win+Shift+D (Cmd+Shift+D on a Mac), plus Ctrl+Alt+Shift+D
// as a fallback for machines where the operating system keeps the Windows key for itself.
export interface KeyLike {
  code?: string
  key?: string
  metaKey: boolean
  shiftKey: boolean
  ctrlKey: boolean
  altKey: boolean
  repeat?: boolean
}

export function isDiagnosticsShortcut(e: KeyLike): boolean {
  if (e.repeat) return false
  const isD = e.code ? e.code === "KeyD" : (e.key ?? "").toLowerCase() === "d"
  if (!isD || !e.shiftKey) return false
  const windowsKey = e.metaKey && !e.ctrlKey && !e.altKey
  const fallback = e.ctrlKey && e.altKey && !e.metaKey
  return windowsKey || fallback
}

/**
 * Counts quick repeated taps (the logo easter egg). Pass the previous tap times and the current time; it returns the
 * new list and whether this tap completed the pattern. Taps older than `windowMs` are forgotten, and the list is
 * cleared once the pattern fires, so four fast taps open the page once, not twice.
 */
export function registerTap(previous: number[], now: number, taps = 3, windowMs = 1000): { taps: number[]; fired: boolean } {
  const recent = [...previous.filter((t) => now - t <= windowMs && t <= now), now]
  if (recent.length >= taps) return { taps: [], fired: true }
  return { taps: recent, fired: false }
}
