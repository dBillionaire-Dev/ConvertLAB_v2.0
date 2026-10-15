"use client"

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone
}

/** iPhone/iPod, plus iPad (iPadOS 13+ reports as a Mac unless we check touch support). */
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent
  const isClassicIOS = /iPad|iPhone|iPod/.test(ua)
  const isIPadOS13Plus = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1
  return isClassicIOS || isIPadOS13Plus
}

export function isMac(): boolean {
  if (typeof navigator === "undefined") return false
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints <= 1
}

/** True Safari only  -  Chrome/Firefox/Edge on iOS all include "Safari" in their UA too. */
export function isSafari(): boolean {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent
  return /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua)
}

/**
 * Where the app is running, for anonymous usage statistics.
 * "android" is set by the Capacitor app itself (it reports its own source); this covers the web build.
 * "windows" = installed/standalone window on a Windows user agent (installed PWA or Microsoft Store package);
 * the two cannot be told apart reliably, so treat it as best-effort.
 */
export function getPlatform(): "web" | "pwa" | "windows" {
  if (!isStandaloneDisplayMode()) return "web"
  return typeof navigator !== "undefined" && /Windows/i.test(navigator.userAgent) ? "windows" : "pwa"
}

/** Neither iOS nor macOS Safari support the beforeinstallprompt flow  -  they need manual instructions. */
export function needsManualInstallInstructions(): boolean {
  return isIOS() || (isMac() && isSafari())
}
