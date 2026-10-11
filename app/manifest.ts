import type { MetadataRoute } from "next"

/**
 * Web app manifest. Written to pass PWABuilder (pwabuilder.com) and to package cleanly for the Microsoft Store:
 * identity (id, scope), install UI (screenshots, shortcuts, categories), Windows/Edge extras, and store hooks.
 *
 * Optional environment variables (set in Vercel, then redeploy):
 *   NEXT_PUBLIC_IARC_RATING_ID   the IARC age-rating id from the Microsoft Store / Play age-rating questionnaire
 *   NEXT_PUBLIC_PLAY_STORE_URL   adds the Android app as a related application
 */
const IARC = (process.env.NEXT_PUBLIC_IARC_RATING_ID ?? "").trim()
const PLAY = (process.env.NEXT_PUBLIC_PLAY_STORE_URL ?? "").trim()

export default function manifest(): MetadataRoute.Manifest {
  const manifest = {
    id: "/",
    name: "Clinexia",
    short_name: "Clinexia",
    description:
      "A complete clinical toolkit: medical calculators, drug dosing with mg and mL per dose, unit conversions, laboratory tools and reference ranges. Works offline.",
    lang: "en",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    categories: ["medical", "health", "education", "productivity", "utilities"],
    launch_handler: { client_mode: ["navigate-existing", "auto"] },
    handle_links: "preferred",
    edge_side_panel: { preferred_width: 480 },
    icons: [
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      { src: "/screenshots/wide-dashboard.png", sizes: "1280x800", type: "image/png", form_factor: "wide", label: "Dashboard on a large screen" },
      { src: "/screenshots/wide-calculator.png", sizes: "1280x800", type: "image/png", form_factor: "wide", label: "A calculator with its working shown" },
      { src: "/screenshots/wide-dosing.png", sizes: "1280x800", type: "image/png", form_factor: "wide", label: "Drug dosing with mg and mL per dose" },
      { src: "/screenshots/narrow-dashboard.png", sizes: "780x1688", type: "image/png", form_factor: "narrow", label: "Dashboard on a phone" },
      { src: "/screenshots/narrow-calculator.png", sizes: "780x1688", type: "image/png", form_factor: "narrow", label: "A calculator on a phone" },
      { src: "/screenshots/narrow-dosing.png", sizes: "780x1688", type: "image/png", form_factor: "narrow", label: "Drug dosing on a phone" },
    ],
    shortcuts: [
      { name: "Calculators", short_name: "Calculators", description: "Browse all clinical calculators", url: "/calculators", icons: [{ src: "/icon-192x192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Drug dosing", short_name: "Dosing", description: "Dose calculators with mg and mL per dose", url: "/calculators/dosing", icons: [{ src: "/icon-192x192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Conversions", short_name: "Convert", description: "Unit conversions", url: "/conversions", icons: [{ src: "/icon-192x192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Lab tools", short_name: "Lab tools", description: "Dilutions, solutions and spectrophotometry", url: "/lab-tools", icons: [{ src: "/icon-192x192.png", sizes: "192x192", type: "image/png" }] },
    ],
    ...(PLAY ? { related_applications: [{ platform: "play", url: PLAY, id: "com.clinexia.app" }], prefer_related_applications: false } : {}),
    ...(IARC ? { iarc_rating_id: IARC } : {}),
  }
  return manifest as MetadataRoute.Manifest
}
