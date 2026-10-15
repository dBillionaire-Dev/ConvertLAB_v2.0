import { NextResponse } from "next/server"
import { z } from "zod"

// Records that an app install happened (the browser `appinstalled` event).
// Stores only: anonymous random id, platform, app version, timestamp. Safari/iOS never fires this event,
// so the resulting count is a lower bound.
const installSchema = z.object({
  anonymousId: z.string().min(1).max(100),
  source: z.enum(["web", "pwa", "android", "windows"]).default("pwa"),
  environment: z.string().min(1).max(40).default("production"),
  appVersion: z.string().min(1).max(40).default("unknown"),
})

export async function POST(request: Request) {
  try {
    const body = installSchema.parse(await request.json())
    if (body.environment !== "production") return new NextResponse(null, { status: 204 })

    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error("Analytics storage is not configured.")

    const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/traction_record_install`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_anonymous_id: body.anonymousId, p_platform: body.source, p_app_version: body.appVersion }),
    })
    if (!response.ok) {
      console.error("Clinexia install record failed:", await response.text())
      return NextResponse.json({ error: "Unable to record install." }, { status: 502 })
    }
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid install payload." }, { status: 400 })
    console.error("Clinexia install error:", error)
    return NextResponse.json({ error: "Unable to record install." }, { status: 500 })
  }
}
