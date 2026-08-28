// ConvertLAB service worker — enables full offline use.
// All calculation/conversion/substance data ships inside the app's JS
// bundles, so caching the app shell + static assets is enough for every
// calculator, conversion, estimator, and lab tool to keep working offline.
const CACHE_VERSION = "v2"
const SHELL_CACHE = `convertlab-shell-${CACHE_VERSION}`
const RUNTIME_CACHE = `convertlab-runtime-${CACHE_VERSION}`

const SHELL_URLS = ["/", "/manifest.webmanifest", "/favicon.ico", "/icon-192x192.png", "/icon-512x512.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.all(
        SHELL_URLS.map((url) =>
          cache.add(url).catch(() => {
            // Ignore individual missing assets so one 404 doesn't block install.
          }),
        ),
      ),
    ),
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== SHELL_CACHE && name !== RUNTIME_CACHE)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

function isSameOrigin(url) {
  return new URL(url).origin === self.location.origin
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET" || !isSameOrigin(request.url)) return

  // Navigations: network-first so users get fresh content when online,
  // falling back to the cached shell when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/"))),
    )
    return
  }

  // Everything else (JS/CSS chunks, icons, fonts): cache-first, populate
  // the runtime cache on first fetch so subsequent offline loads work.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone()
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => cached)
    }),
  )
})
