import { NextResponse } from "next/server"
import { z } from "zod"

const presenceSchema = z.object({
  anonymousId: z.string().min(1).max(100),
  source: z.enum(["web", "pwa"]).default("web"),
  environment: z.string().min(1).max(40).default("production"),
  appVersion: z.string().min(1).max(40).default("unknown"),
})

function config() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Analytics storage is not configured.")
  return { url: url.replace(/\/$/, ""), key }
}

function displayNameFor(anonymousId: string) {
  // Stable pseudonym: it is not a real name and does not expose the anonymous ID.
  const hash = anonymousId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase().padEnd(8, "0")
  return `User-${hash.slice(0, 6)}`
}

export async function POST(request: Request) {
  try {
    const body = presenceSchema.parse(await request.json())
    const { url, key } = config()
    const displayName = displayNameFor(body.anonymousId)

    const response = await fetch(`${url}/rest/v1/convertlab_devices?on_conflict=anonymous_id`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        anonymous_id: body.anonymousId,
        display_name: displayName,
        last_seen_at: new Date().toISOString(),
        source: body.source,
        environment: body.environment,
        app_version: body.appVersion,
      }),
    })

    if (!response.ok) {
      console.error("ConvertLAB presence update failed:", await response.text())
      return NextResponse.json({ error: "Unable to record presence." }, { status: 502 })
    }

    return NextResponse.json({ displayName })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid presence payload." }, { status: 400 })
    }
    console.error("ConvertLAB presence error:", error)
    return NextResponse.json({ error: "Unable to record presence." }, { status: 500 })
  }
}
