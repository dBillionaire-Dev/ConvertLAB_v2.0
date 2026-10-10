/**
 * Two-domain setup (all optional; with none set, everything works on one domain as before).
 *
 *   NEXT_PUBLIC_LANDING_URL   https://example.com        marketing landing page
 *   NEXT_PUBLIC_APP_URL       https://app.example.com    the web app / PWA
 *   NEXT_PUBLIC_SITE_URL      https://app.example.com    (already used for metadata, robots and the sitemap)
 *
 * They are inlined at build time, so set them in Vercel and redeploy.
 */
const trim = (v: string | undefined) => (v ?? "").trim().replace(/\/+$/, "")
const hostOf = (url: string) => {
  try { return new URL(url).hostname.toLowerCase() } catch { return "" }
}

export const LANDING_URL = trim(process.env.NEXT_PUBLIC_LANDING_URL)
export const APP_URL = trim(process.env.NEXT_PUBLIC_APP_URL)
export const LANDING_HOST = hostOf(LANDING_URL)
export const APP_HOST = hostOf(APP_URL)

/** True only when both URLs are valid and on different hosts. */
export const splitEnabled = Boolean(LANDING_HOST && APP_HOST && LANDING_HOST !== APP_HOST)

/** Link to a page of the app: absolute when the app lives on its own domain, otherwise a normal relative link. */
export const appHref = (path = "/") => (splitEnabled ? `${APP_URL}${path}` : path)

/** Where the landing page's own logo links to. */
export const landingHome = splitEnabled ? "/" : "/welcome"

/**
 * Runs before React loads: when served from the landing domain it sets a window flag (read by isLandingSite()).
 * It changes nothing in the DOM, so it cannot affect hydration.
 */
export const SITE_BOOTSTRAP = splitEnabled
  ? `(function(){try{var h=location.hostname,l=${JSON.stringify(LANDING_HOST)};if(h===l||h==="www."+l)window.__CL_LANDING=true}catch(e){}})()`
  : ""

declare global {
  interface Window { __CL_LANDING?: boolean }
}

/** Client-side: are we on the landing domain? (false on the app domain, localhost and the old vercel.app address) */
export function isLandingSite(): boolean {
  return typeof window !== "undefined" && window.__CL_LANDING === true
}

/**
 * Optional: retire the old address (for example convertlab-nex.vercel.app) by redirecting it to the app domain.
 *   NEXT_PUBLIC_LEGACY_HOSTS=convertlab-nex.vercel.app    comma-separated host names, without https://
 *   NEXT_PUBLIC_LEGACY_REDIRECT=on                        the switch: nothing happens unless this is exactly "on"
 * Only active together with the two-domain setup above.
 */
export const LEGACY_HOSTS = (process.env.NEXT_PUBLIC_LEGACY_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean)
export const LEGACY_REDIRECT_ON = process.env.NEXT_PUBLIC_LEGACY_REDIRECT === "on" && splitEnabled
