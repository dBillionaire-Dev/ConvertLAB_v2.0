import { NextResponse } from "next/server"
import { APP_VERSION, BUILD_ID } from "@/lib/build-info"

// Tells an open copy of the app which deployment is currently live. Contains no user data and no input.
export const dynamic = "force-dynamic"

export function GET() {
  return NextResponse.json({ build: BUILD_ID, appVersion: APP_VERSION }, { headers: { "Cache-Control": "no-store" } })
}
