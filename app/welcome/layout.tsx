import type { ReactNode } from "react"
import { LatestApkProvider } from "@/components/landing/latest-apk"
import { getLatestApk } from "@/lib/latest-apk"

// The landing page follows the newest Android release: this looks it up on the server and the page is rebuilt in the
// background at most every 10 minutes, so a new release appears here by itself.
export const revalidate = 600

export default async function WelcomeLayout({ children }: { children: ReactNode }) {
  const latest = await getLatestApk()
  return <LatestApkProvider latest={latest}>{children}</LatestApkProvider>
}
