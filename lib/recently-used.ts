"use client"

const STORAGE_KEY = "convertlab:recently-used"
const MAX_ITEMS = 8

function isBrowser() {
  return typeof window !== "undefined"
}

function read(): string[] {
  if (!isBrowser()) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function write(ids: string[]) {
  if (!isBrowser()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  window.dispatchEvent(new CustomEvent("convertlab:recently-used-changed"))
}

export function getRecentlyUsed(): string[] {
  return read()
}

export function recordUsage(toolId: string) {
  const current = read().filter((id) => id !== toolId)
  const next = [toolId, ...current].slice(0, MAX_ITEMS)
  write(next)
}

export function subscribeRecentlyUsed(callback: () => void): () => void {
  if (!isBrowser()) return () => {}
  window.addEventListener("convertlab:recently-used-changed", callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener("convertlab:recently-used-changed", callback)
    window.removeEventListener("storage", callback)
  }
}
