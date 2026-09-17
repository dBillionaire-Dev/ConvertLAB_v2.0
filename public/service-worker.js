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
const CACHE_VERSION = "v5"
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

const CALCULATOR_CATEGORIES = [
  "general",
  "renal",
  "chemistry",
  "hematology",
  "lab-solutions",
  "spectrophotometry",
  "microbiology",
  "dosing",
  "cardiovascular",
  "stem-cell-transplant",
  "oncology",
]

const CALCULATOR_ROUTES = [
  "/calculators/general/bmi",
  "/calculators/general/bsa",
  "/calculators/general/ideal-body-weight",
  "/calculators/general/bmr",
  "/calculators/general/adjusted-body-weight",
  "/calculators/general/estimated-calorie-requirement",
  "/calculators/general/waist-to-height-ratio",
  "/calculators/general/waist-to-hip-ratio",
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
  "/calculators/chemistry/corrected-sodium-hyperglycemia",
  "/calculators/chemistry/bun-from-urea",
  "/calculators/chemistry/albumin-corrected-anion-gap",
  "/calculators/chemistry/creatinine-unit-conversion",
  "/calculators/hematology/red-cell-indices",
  "/calculators/hematology/absolute-cell-count",
  "/calculators/hematology/corrected-wbc",
  "/calculators/hematology/hematocrit-estimate",
  "/calculators/hematology/inr",
  "/calculators/hematology/corrected-count-increment",
  "/calculators/hematology/estimated-blood-volume",
  "/calculators/hematology/international-prognostic-index",
  "/calculators/hematology/reticulocyte-production-index",
  "/calculators/hematology/aptt-ratio",
  "/calculators/hematology/estimated-rbc-transfusion-volume",
  "/calculators/hematology/revised-international-prognostic-index",
  "/calculators/lab-solutions/molarity",
  "/calculators/lab-solutions/normality",
  "/calculators/lab-solutions/c1v1-c2v2-dilution",
  "/calculators/lab-solutions/percent-solution",
  "/calculators/lab-solutions/molarity-preparation",
  "/calculators/lab-solutions/reagent-dilution-volume",
  "/calculators/spectrophotometry/beer-lambert-law",
  "/calculators/spectrophotometry/absorbance-transmittance",
  "/calculators/spectrophotometry/spectro-standard-curve",
  "/calculators/spectrophotometry/spectro-dilution-corrected-concentration",
  "/calculators/spectrophotometry/spectro-wavelength-frequency",
  "/calculators/spectrophotometry/spectro-photon-energy",
  "/calculators/spectrophotometry/spectro-wavenumber",
  "/calculators/spectrophotometry/spectro-blank-corrected-absorbance",
  "/calculators/spectrophotometry/spectro-replicate-statistics",
  "/calculators/spectrophotometry/spectro-calibration-regression",
  "/calculators/spectrophotometry/spectro-photometric-linearity",
  "/calculators/microbiology/cfu-per-ml",
  "/calculators/microbiology/dilution-factor",
  "/calculators/microbiology/concentration-after-dilution",
  "/calculators/microbiology/serial-dilution-total-factor",
  "/calculators/microbiology/microbiology-concentration-dilution",
  "/calculators/microbiology/pooled-cfu-per-ml",
  "/calculators/dosing/mg-per-kg-dose",
  "/calculators/dosing/oral-liquid-dose-volume",
  "/calculators/dosing/tablet-capsule-count",
  "/calculators/dosing/dose-volume-rounding",
  "/calculators/dosing/mg-per-kg-per-day-dose",
  "/calculators/dosing/mg-per-m2-dose",
  "/calculators/dosing/dose-per-administration",
  "/calculators/dosing/dose-volume",
  "/calculators/dosing/drug-concentration",
  "/calculators/dosing/infusion-rate",
  "/calculators/dosing/drops-per-minute",
  "/calculators/dosing/maximum-dose-check",
  "/calculators/dosing/artesunate-severe-malaria",
  "/calculators/dosing/artemether-lumefantrine-uncomplicated-malaria",
  "/calculators/dosing/artesunate-amodiaquine-uncomplicated-malaria",
  "/calculators/dosing/artesunate-mefloquine-uncomplicated-malaria",
  "/calculators/dosing/dihydroartemisinin-piperaquine-uncomplicated-malaria",
  "/calculators/dosing/artesunate-sulfadoxine-pyrimethamine-uncomplicated-malaria",
  "/calculators/dosing/artesunate-pyronaridine-uncomplicated-malaria",
  "/calculators/dosing/amoxicillin-pediatric-dose",
  "/calculators/dosing/amoxicillin-clavulanate-pediatric-dose",
  "/calculators/dosing/azithromycin-pediatric-dose",
  "/calculators/dosing/ceftriaxone-pediatric-dose",
  "/calculators/dosing/cephalexin-pediatric-dose",
  "/calculators/dosing/metronidazole-pediatric-dose",
  "/calculators/dosing/cefuroxime-surgical-prophylaxis",
  "/calculators/dosing/ampicillin-pediatric-dose",
  "/calculators/dosing/cefotaxime-pediatric-dose",
  "/calculators/dosing/cloxacillin-pediatric-dose",
  "/calculators/dosing/ciprofloxacin-pediatric-dose",
  "/calculators/dosing/gentamicin-pediatric-dose",
  "/calculators/dosing/meropenem-pediatric-dose",
  "/calculators/dosing/vancomycin-pediatric-dose",
  "/calculators/dosing/amoxicillin-clavulanate-renal-adjustment",
  "/calculators/dosing/ciprofloxacin-renal-adjustment",
  "/calculators/dosing/cefotaxime-renal-adjustment",
  "/calculators/dosing/cefuroxime-axetil-renal-adjustment",
  "/calculators/dosing/meropenem-renal-adjustment",
  "/calculators/dosing/vancomycin-auc24-target-check",
  "/calculators/dosing/gentamicin-peak-trough-check",
  "/calculators/dosing/who-young-infant-sepsis-pneumonia",
  "/calculators/dosing/who-young-infant-meningitis",
  "/calculators/dosing/piperacillin-tazobactam-pediatric-dose",
  "/calculators/dosing/clindamycin-pediatric-dose",
  "/calculators/dosing/cefazolin-pediatric-dose",
  "/calculators/dosing/linezolid-pediatric-dose",
  "/calculators/dosing/doxycycline-pediatric-dose",
  "/calculators/dosing/loading-dose",
  "/calculators/dosing/maintenance-dose",
  "/calculators/dosing/infusion-duration",
  "/calculators/dosing/course-total-dose",
  "/calculators/dosing/who-pediatric-pneumonia-regimen",
  "/calculators/dosing/who-pediatric-diarrhoea-zinc",
  "/calculators/dosing/who-pediatric-ors-plan-b",
  "/calculators/dosing/who-pediatric-ors-ongoing-loss",
  "/calculators/dosing/who-pediatric-maintenance-fluid",
  "/calculators/dosing/pediatric-fluid-deficit",
  "/calculators/cardiovascular/mean-arterial-pressure",
  "/calculators/cardiovascular/ejection-fraction",
  "/calculators/cardiovascular/cha2ds2-vasc",
  "/calculators/cardiovascular/dapt-score",
  "/calculators/cardiovascular/qtc-correction",
  "/calculators/cardiovascular/atherogenic-index-plasma",
  "/calculators/cardiovascular/pulse-pressure",
  "/calculators/cardiovascular/cardiac-index",
  "/calculators/cardiovascular/has-bled",
  "/calculators/cardiovascular/af-ventricular-rate",
  "/calculators/stem-cell-transplant/hct-ci",
  "/calculators/stem-cell-transplant/conditioning-transplant-day",
  "/calculators/stem-cell-transplant/stem-cell-collection-yield",
  "/calculators/stem-cell-transplant/cd34-cell-dose",
  "/calculators/stem-cell-transplant/neutrophil-engraftment-day",
  "/calculators/stem-cell-transplant/donor-chimerism",
  "/calculators/stem-cell-transplant/stem-cell-collection-target",
  "/calculators/stem-cell-transplant/viable-cd34-cell-dose",
  "/calculators/stem-cell-transplant/engraftment-duration",
  "/calculators/oncology/oncology-bsa-dose",
  "/calculators/oncology/oncology-dose-intensity",
  "/calculators/oncology/oncology-relative-dose-intensity",
  "/calculators/oncology/oncology-cumulative-dose",
  "/calculators/oncology/oncology-cycle-total-dose",
  "/calculators/oncology/carboplatin-calvert-dose",
  "/calculators/oncology/oncology-dose-cap",
  "/calculators/oncology/oncology-regimen-dose",
  "/calculators/oncology/oncology-hematologic-dose-modification",
  "/calculators/oncology/oncology-organ-function-dose-modification",
  "/calculators/oncology/oncology-toxicity-safety",
  "/calculators/oncology/oncology-antiemetic-risk",
  "/calculators/oncology/oncology-febrile-neutropenia-risk",
  "/calculators/oncology/oncology-cycle-progress",
  "/calculators/oncology/oncology-course-completion",
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



self.addEventListener("sync", (event) => {
  if (event.tag !== "convertlab-analytics") return
  event.waitUntil(syncAnalyticsFromServiceWorker())
})

function openAnalyticsDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("convertlab", 2)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains("history")) {
        const history = db.createObjectStore("history", { keyPath: "id" })
        history.createIndex("timestamp", "timestamp", { unique: false })
        history.createIndex("calculatorId", "calculatorId", { unique: false })
        history.createIndex("category", "category", { unique: false })
      }
      if (!db.objectStoreNames.contains("analytics_outbox")) {
        const outbox = db.createObjectStore("analytics_outbox", { keyPath: "id" })
        outbox.createIndex("occurredAt", "occurredAt", { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getAnalyticsEvents() {
  const db = await openAnalyticsDB()
  const events = await new Promise((resolve, reject) => {
    const tx = db.transaction("analytics_outbox", "readonly")
    const request = tx.objectStore("analytics_outbox").getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  db.close()
  return events
}

async function deleteAnalyticsEvents(ids) {
  if (!ids.length) return

  const db = await openAnalyticsDB()
  await new Promise((resolve, reject) => {
    const tx = db.transaction("analytics_outbox", "readwrite")
    const store = tx.objectStore("analytics_outbox")
    ids.forEach((id) => store.delete(id))
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

async function syncAnalyticsFromServiceWorker() {
  const events = await getAnalyticsEvents()
  if (!events.length) return

  for (let i = 0; i < events.length; i += 100) {
    const batch = events.slice(i, i + 100)

    try {
      const response = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: batch }),
      })

      if (!response.ok) return

      const body = await response.json()
      await deleteAnalyticsEvents(body.accepted || [])
    } catch {
      // Throwing causes Background Sync to retry when supported.
      throw new Error("ConvertLAB analytics sync failed")
    }
  }
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
