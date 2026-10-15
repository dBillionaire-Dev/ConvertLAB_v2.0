"use client"

// Browser side of "pick up new versions". The service worker serves cached pages first, so after a deploy a plain
// reload would show the OLD page again. We therefore refresh the cached copy of this page first, then reload.

const WARMED_KEY = "clinexia:update:warmed-build"
export const TRIED_KEY = "clinexia:update:tried-build" // sessionStorage: stops reload loops

export async function fetchServerBuild(timeoutMs = 8000): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const response = await fetch("/api/version", { cache: "no-store", signal: controller.signal })
    clearTimeout(timer)
    if (!response.ok) return null
    const body = (await response.json()) as { build?: unknown }
    return typeof body.build === "string" ? body.build : null
  } catch {
    return null
  }
}

async function appCacheNames(): Promise<string[]> {
  if (typeof caches === "undefined") return []
  return (await caches.keys()).filter((name) => name.startsWith("clinexia-"))
}

async function fetchFresh(url: string): Promise<Response | null> {
  try {
    const response = await fetch(new Request(url, { cache: "reload", credentials: "same-origin" }))
    // Same rules the service worker uses before it caches a page.
    if (!response.ok || response.type !== "basic" || response.redirected) return null
    return response
  } catch {
    return null
  }
}

/** Replaces the cached copy of each page (in whichever app cache holds it) with a fresh one from the network. */
export async function refreshCachedPages(urls: string[]): Promise<void> {
  const names = await appCacheNames()
  if (!names.length) return
  for (const url of urls) {
    const response = await fetchFresh(url)
    if (!response) continue
    let stored = false
    for (const name of names) {
      const cache = await caches.open(name)
      if (await cache.match(url)) {
        await cache.put(url, response.clone())
        stored = true
      }
    }
    if (!stored) {
      const runtime = names.find((n) => n.includes("runtime")) ?? names[0]
      await (await caches.open(runtime)).put(url, response.clone())
    }
  }
}

/** Refreshes this page's cached copy, asks the browser to look for a newer service worker, then reloads. */
export async function applyUpdate(serverBuild: string): Promise<void> {
  try {
    sessionStorage.setItem(TRIED_KEY, serverBuild)
  } catch {}
  try {
    await refreshCachedPages([location.href, new URL("/", location.origin).href])
  } catch {}
  try {
    const registration = await navigator.serviceWorker?.getRegistration()
    void registration?.update()
  } catch {}
  location.reload()
}

export function alreadyTried(serverBuild: string): boolean {
  try {
    return sessionStorage.getItem(TRIED_KEY) === serverBuild
  } catch {
    return false
  }
}

/**
 * After an update, re-fetches every page the offline cache holds so offline use matches the new version.
 * Runs once per build, in the background, a few requests at a time.
 */
export async function warmShellCache(buildId: string): Promise<void> {
  if (!buildId || navigator.onLine === false) return
  try {
    if (localStorage.getItem(WARMED_KEY) === buildId) return
  } catch {}
  const shell = (await appCacheNames()).filter((n) => n.includes("shell"))
  const urls: string[] = []
  for (const name of shell) {
    for (const request of await (await caches.open(name)).keys()) urls.push(request.url)
  }
  let index = 0
  const worker = async () => {
    while (index < urls.length) {
      const url = urls[index++]
      try {
        await refreshCachedPages([url])
      } catch {}
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()])
  try {
    localStorage.setItem(WARMED_KEY, buildId)
  } catch {}
}
