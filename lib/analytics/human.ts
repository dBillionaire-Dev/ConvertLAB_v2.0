"use client"

import { isLikelyBot } from "./bots"

/**
 * Presence ("online now", and the device directory) should only count a person who is actually using the page.
 * Crawlers and scanners load pages and leave without touching anything, so a heartbeat is held back until the first
 * real tap, click, key press or scroll. Calculations are unaffected: they need an interaction anyway.
 */

const INTERACTION_EVENTS = ["pointerdown", "keydown", "touchstart", "wheel", "scroll"] as const
let interacted = false

export function hasInteracted(): boolean {
  return interacted
}

/** True for scripted browsers (WebDriver, headless Chrome, known crawler user agents). */
export function looksAutomated(): boolean {
  if (typeof navigator === "undefined") return true
  if (navigator.webdriver) return true
  return isLikelyBot(navigator.userAgent)
}

/** Calls `callback` once, on the first real interaction (immediately if one already happened). Returns an unsubscribe. */
export function onFirstInteraction(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  if (interacted) {
    callback()
    return () => {}
  }

  let done = false
  const stop = () => INTERACTION_EVENTS.forEach((name) => window.removeEventListener(name, fire))
  function fire() {
    if (done) return
    done = true
    interacted = true
    stop()
    callback()
  }
  INTERACTION_EVENTS.forEach((name) => window.addEventListener(name, fire, { passive: true }))
  return () => {
    done = true
    stop()
  }
}
