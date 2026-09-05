// ConvertLAB service worker — enables full offline use.
//
// All calculation/conversion/substance data ships inside the app's JS
// bundles, so once a page's HTML + JS are cached, its calculators work
// fully offline with no network calls at all.
//
// Earlier versions of this service worker only precached the home page,
// so opening any calculator that hadn't been visited online first would
// fail offline. This version precaches every route in the app up front,
// so the whole toolkit works offline immediately after install.
const CACHE_VERSION = "v3"
const SHELL_CACHE = `convertlab-shell-${CACHE_VERSION}`
const RUNTIME_CACHE = `convertlab-runtime-${CACHE_VERSION}`

const STATIC_ROUTES = [
  "/",
  "/calculators",
  "/calculators/hematology/red-cell-indices",
  "/conversions",
  "/conversions/mass-volume",
  "/conversions/molar-mass",
  "/estimators",
  "/favorites",
  "/history",
  "/lab-tools",
  "/lab-tools/dilution",
  "/lab-tools/microbiology",
  "/lab-tools/percentage-solution",
  "/lab-tools/serial-dilution",
  "/lab-tools/spectrophotometry",
  "/reference",
  "/settings",
]

const CALCULATOR_CATEGORIES = ["clinical", "renal", "chemistry", "hematology", "lab-solutions", "microbiology"]

const CALCULATOR_ROUTES = [
  "/calculators/clinical/bmi",
  "/calculators/clinical/bsa",
  "/calculators/clinical/ideal-body-weight",
  "/calculators/clinical/bmr",
  "/calculators/clinical/adjusted-body-weight",
  "/calculators/clinical/estimated-calorie-requirement",
  "/calculators/clinical/waist-to-height-ratio",
  "/calculators/clinical/waist-to-hip-ratio",
  "/calculators/renal/creatinine-clearance",
  "/calculators/renal/egfr-ckd-epi",
  "/calculators/renal/bun-creatinine-ratio",
  "/calculators/renal/egfr-mdrd",
  "/calculators/renal/fena",
  "/calculators/renal/feurea",
  "/calculators/chemistry/ldl-friedewald",
  "/calculators/chemistry/non-hdl-cholesterol",
  "/calculators/chemistry/vldl-estimate",
  "/calculators/chemistry/anion-gap",
  "/calculators/chemistry/corrected-calcium",
  "/calculators/chemistry/total-hdl-ratio",
  "/calculators/chemistry/calcium-phosphate-product",
  "/calculators/chemistry/ldl-hdl-ratio",
  "/calculators/chemistry/delta-ratio",
  "/calculators/chemistry/estimated-osmolality",
  "/calculators/chemistry/hba1c-eag",
  "/calculators/hematology/mcv",
  "/calculators/hematology/mch",
  "/calculators/hematology/mchc",
  "/calculators/hematology/absolute-cell-count",
  "/calculators/hematology/corrected-wbc",
  "/calculators/hematology/hematocrit-estimate",
  "/calculators/lab-solutions/molarity",
  "/calculators/lab-solutions/normality",
  "/calculators/microbiology/cfu-per-ml",
  "/calculators/microbiology/dilution-factor",
  "/calculators/microbiology/concentration-after-dilution",
]

const CONVERSION_CATEGORIES = [
  "mass",
  "volume",
  "length",
  "temperature",
  "pressure",
  "energy",
  "time",
  "concentration",
  "molar",
]

const ASSET_URLS = ["/manifest.webmanifest", "/favicon.ico", "/icon-192x192.png", "/icon-512x512.png"]

const PRECACHE_URLS = [
  ...STATIC_ROUTES,
  ...CALCULATOR_CATEGORIES.map((c) => `/calculators/${c}`),
  ...CALCULATOR_ROUTES,
  ...CONVERSION_CATEGORIES.map((c) => `/conversions/${c}`),
  ...ASSET_URLS,
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch(() => {
            // Ignore individual failures so one bad URL doesn't block install —
            // that route just falls back to network-then-runtime-cache instead.
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

  // Navigations (direct URL entry, reload, opening a new tab): try the
  // precached shell first so offline works instantly and reliably: only
  // fall back to network if this exact route wasn't precached, and cache
  // whatever we get for next time.
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Still refresh in the background when online, so content
          // doesn't go stale forever.
          fetch(request)
            .then((response) => caches.open(SHELL_CACHE).then((cache) => cache.put(request, response)))
            .catch(() => {})
          return cached
        }
        return fetch(request)
          .then((response) => {
            const copy = response.clone()
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy))
            return response
          })
          .catch(() => caches.match("/"))
      }),
    )
    return
  }

  // Everything else (JS/CSS chunks, RSC data fetches for client-side
  // navigation, icons, fonts): cache-first, populate the runtime cache on
  // first fetch so subsequent offline loads work.
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
