/**
 * Landing page settings. Set these in the hosting environment (for example Vercel → Settings → Environment Variables),
 * no code change needed. They are inlined at build time.
 *
 *   NEXT_PUBLIC_PLAY_STORE_URL  e.g. https://play.google.com/store/apps/details?id=com.convertlab.app
 *   NEXT_PUBLIC_APK_URL         optional direct APK download (for testers) if the app is not on Google Play yet
 *
 * With both empty, the Android button shows "coming soon" and the page points people to the web app instead.
 */
export const LANDING = {
  playStoreUrl: (process.env.NEXT_PUBLIC_PLAY_STORE_URL ?? "").trim(),
  apkUrl: (process.env.NEXT_PUBLIC_APK_URL ?? "").trim(),
  developerUrl: "https://nex.is-a.dev/",
}
