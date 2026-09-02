"use client"

const STORAGE_KEY = "convertlab:reduce-motion"

function isBrowser() {
  return typeof window !== "undefined"
}

export function getReduceMotion(): boolean {
  if (!isBrowser()) return false
  return window.localStorage.getItem(STORAGE_KEY) === "true"
}

export function setReduceMotion(value: boolean) {
  if (!isBrowser()) return
  window.localStorage.setItem(STORAGE_KEY, String(value))
  document.documentElement.classList.toggle("reduce-motion", value)
  window.dispatchEvent(new CustomEvent("convertlab:reduce-motion-changed"))
}

/** Applies the stored preference to <html> — call once on mount at the app root. */
export function applyStoredReduceMotion() {
  if (!isBrowser()) return
  document.documentElement.classList.toggle("reduce-motion", getReduceMotion())
}

export function subscribeReduceMotion(callback: () => void): () => void {
  if (!isBrowser()) return () => {}
  window.addEventListener("convertlab:reduce-motion-changed", callback)
  return () => window.removeEventListener("convertlab:reduce-motion-changed", callback)
}
