import { NextResponse } from "next/server"
import { getFeedbackConfig } from "@/lib/feedback/server"

// Tells the app whether to ask for feedback, and which round we are in. No user data in or out.
export const dynamic = "force-dynamic"

export async function GET() {
  const config = await getFeedbackConfig()
  return NextResponse.json(config, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } })
}
