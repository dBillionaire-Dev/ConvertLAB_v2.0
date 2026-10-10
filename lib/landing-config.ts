/**
 * Landing page settings. Set these in the hosting environment (for example Vercel → Settings → Environment Variables),
 * no code change needed. They are inlined at build time, so redeploy after changing them.
 *
 *   NEXT_PUBLIC_PLAY_STORE_URL     Google Play listing, e.g. https://play.google.com/store/apps/details?id=com.clinexia.app
 *   NEXT_PUBLIC_FIREBASE_DIST_URL  Firebase App Distribution public invite link (tester beta)
 *   NEXT_PUBLIC_APK_URL            direct link to the signed APK (a GitHub Release asset works well)
 *   NEXT_PUBLIC_APK_SHA256         SHA-256 of that APK, shown so people can verify the download
 *   NEXT_PUBLIC_APK_VERSION        version label shown next to the APK, e.g. 3.0.0
 *   NEXT_PUBLIC_MS_STORE_URL       Microsoft Store listing (the Windows app packaged with PWABuilder)
 *
 * A channel with no URL shows "coming soon" instead of a button. Nothing is invented.
 */
const clean = (v: string | undefined) => (v ?? "").trim()

export const LANDING = {
  playStoreUrl: clean(process.env.NEXT_PUBLIC_PLAY_STORE_URL),
  firebaseUrl: clean(process.env.NEXT_PUBLIC_FIREBASE_DIST_URL),
  apkUrl: clean(process.env.NEXT_PUBLIC_APK_URL),
  apkSha256: clean(process.env.NEXT_PUBLIC_APK_SHA256),
  apkVersion: clean(process.env.NEXT_PUBLIC_APK_VERSION),
  microsoftStoreUrl: clean(process.env.NEXT_PUBLIC_MS_STORE_URL),
  developerUrl: "https://nex.is-a.dev/",
}

export const androidAvailable = Boolean(LANDING.playStoreUrl || LANDING.firebaseUrl || LANDING.apkUrl)
