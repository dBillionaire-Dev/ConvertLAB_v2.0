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
