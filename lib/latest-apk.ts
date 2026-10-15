// Finds the newest Android release for the landing page, so the download link follows the app instead of
// staying on whatever version was set in the hosting environment at build time.
//
// The mobile release process publishes version.json to the main branch of the mobile repo. The landing page
// reads it on the server (never in the visitor's browser, so visitors do not contact GitHub) and refreshes
// it at most every 10 minutes. Any failure returns null and the page falls back to NEXT_PUBLIC_APK_URL.

export interface LatestApk {
  version: string
  url: string
}

const DEFAULT_REPO = "dBillionaire-Dev/Clinexia_V3.0-Mobile"

/** Accepts only a plain version and a GitHub release asset of the expected repo, so a bad file cannot inject another link. */
export function parseLatestApk(raw: unknown, repo: string): LatestApk | null {
  if (!raw || typeof raw !== "object") return null
  const manifest = raw as Record<string, unknown>
  const version = typeof manifest.versionName === "string" ? manifest.versionName.trim() : ""
  const url = typeof manifest.apkUrl === "string" ? manifest.apkUrl.trim() : ""
  if (!/^\d+\.\d+\.\d+$/.test(version)) return null
  const prefix = `https://github.com/${repo}/releases/download/`
  if (!url.toLowerCase().startsWith(prefix.toLowerCase())) return null
  if (!url.toLowerCase().endsWith(".apk") || /[\s"'<>\\]/.test(url) || url.includes("..")) return null
  return { version, url }
}

export async function getLatestApk(): Promise<LatestApk | null> {
  const repo = (process.env.APK_REPO || DEFAULT_REPO).trim()
  try {
    const response = await fetch(`https://raw.githubusercontent.com/${repo}/main/version.json`, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return null
    return parseLatestApk(await response.json(), repo)
  } catch {
    return null
  }
}
