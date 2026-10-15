"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { LatestApk } from "@/lib/latest-apk"

// The newest Android release, looked up on the server by app/welcome/layout.tsx and shared with the download buttons.
// Null means "unknown", and the buttons use NEXT_PUBLIC_APK_URL instead.
const LatestApkContext = createContext<LatestApk | null>(null)

export function LatestApkProvider({ latest, children }: { latest: LatestApk | null; children: ReactNode }) {
  return <LatestApkContext.Provider value={latest}>{children}</LatestApkContext.Provider>
}

export function useLatestApk(): LatestApk | null {
  return useContext(LatestApkContext)
}
