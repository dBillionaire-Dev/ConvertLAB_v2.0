"use client"

const STORAGE_KEY = "convertlab:favorites"

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
  window.dispatchEvent(new CustomEvent("convertlab:favorites-changed"))
}

export function getFavorites(): string[] {
  return read()
}

export function isFavorite(toolId: string): boolean {
  return read().includes(toolId)
}

export function toggleFavorite(toolId: string): boolean {
  const current = read()
  const exists = current.includes(toolId)
  const next = exists ? current.filter((id) => id !== toolId) : [...current, toolId]
  write(next)
  return !exists
}

export function removeFavorite(toolId: string) {
  write(read().filter((id) => id !== toolId))
}

/** Subscribes to favorite changes made anywhere in the app (same tab). */
export function subscribeFavorites(callback: () => void): () => void {
  if (!isBrowser()) return () => {}
  window.addEventListener("convertlab:favorites-changed", callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener("convertlab:favorites-changed", callback)
    window.removeEventListener("storage", callback)
  }
}
