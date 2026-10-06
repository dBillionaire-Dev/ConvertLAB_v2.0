export type Device = "desktop" | "phone" | "app"

export interface Shot {
  id: string
  device: Device
  title: string
  caption: string
  light: string
  dark?: string
}

const img = (name: string) => `/landing/${name}.webp`

/** Real screenshots of the web app (desktop, phone/PWA) and the Android app. */
export const SHOTS: Shot[] = [
  { id: "web-home", device: "desktop", title: "Dashboard", caption: "Web app on a large screen", light: img("web-desktop-home-light"), dark: img("web-desktop-home-dark") },
  { id: "web-result", device: "desktop", title: "Red cell indices", caption: "Results with the formulas shown", light: img("web-desktop-result-light"), dark: img("web-desktop-result-dark") },
  { id: "web-lab", device: "desktop", title: "Lab tools", caption: "Dilutions, solutions and spectrophotometry", light: img("web-desktop-labtools-light"), dark: img("web-desktop-labtools-dark") },
  { id: "pwa-home", device: "phone", title: "Dashboard", caption: "Installable web app (PWA) on a phone", light: img("web-phone-home-light"), dark: img("web-phone-home-dark") },
  { id: "pwa-result", device: "phone", title: "Red cell indices", caption: "A calculator on a phone screen", light: img("web-phone-result-light"), dark: img("web-phone-result-dark") },
  { id: "pwa-conv", device: "phone", title: "Conversions", caption: "Unit conversions by category", light: img("web-phone-conversions-light"), dark: img("web-phone-conversions-dark") },
  { id: "app-home", device: "app", title: "Home", caption: "Android app", light: img("app-home-light"), dark: img("app-home-dark") },
  { id: "app-calcs", device: "app", title: "Calculators", caption: "Browse every category", light: img("app-calculators-light"), dark: img("app-calculators-dark") },
  { id: "app-dosing", device: "app", title: "Drug dosing", caption: "Grouped by sub-category", light: img("app-dosing-light"), dark: img("app-dosing-dark") },
  { id: "app-result", device: "app", title: "Result", caption: "Clear results with units", light: img("app-result-light") },
  { id: "app-convert", device: "app", title: "Unit converter", caption: "Convert between units", light: img("app-convert-light"), dark: img("app-convert-dark") },
  { id: "app-history", device: "app", title: "History", caption: "Stored on your device", light: img("app-history-light"), dark: img("app-history-dark") },
  { id: "app-lab", device: "app", title: "Lab tools", caption: "Bench utilities", light: img("app-labtools-light"), dark: img("app-labtools-dark") },
  { id: "app-settings", device: "app", title: "Settings", caption: "Light, dark or system theme", light: img("app-settings-dark"), dark: img("app-settings-dark") },
]

export const shotById = (id: string): Shot => {
  const s = SHOTS.find((x) => x.id === id)
  if (!s) throw new Error(`Unknown landing shot: ${id}`)
  return s
}

export const DEVICE_LABELS: Record<Device, string> = {
  desktop: "Web (large screen)",
  phone: "Phone (web app / PWA)",
  app: "Android app",
}

export interface DemoScenario { id: string; label: string; path: string; poster: string }

/** Live-demo pages. They are real pages of this site, shown inside a device frame. */
export const DEMO: Record<"desktop" | "phone", DemoScenario[]> = {
  desktop: [
    { id: "home", label: "Dashboard", path: "/", poster: "web-home" },
    { id: "rbc", label: "Red cell indices", path: "/calculators/hematology/red-cell-indices", poster: "web-result" },
    { id: "lab", label: "Lab tools", path: "/lab-tools", poster: "web-lab" },
  ],
  phone: [
    { id: "home", label: "Dashboard", path: "/", poster: "pwa-home" },
    { id: "rbc", label: "Red cell indices", path: "/calculators/hematology/red-cell-indices", poster: "pwa-result" },
    { id: "conv", label: "Conversions", path: "/conversions", poster: "pwa-conv" },
  ],
}

export const IMG = {
  desktop: { width: 1280, height: 800 },
  phone: { width: 560, height: 1212 },
} as const
