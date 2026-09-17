import { NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { z } from "zod"

const idSchema = z.string().min(1).max(100)
const updateSchema = z.object({
  anonymousId: idSchema,
  displayName: z.string().trim().min(1).max(80),
})

function config() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Analytics storage is not configured.")
  return { url: url.replace(/\/$/, ""), key }
}

function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin")
  if (!origin) return
  if (origin !== new URL(request.url).origin) throw new Error("Cross-origin admin request rejected.")
}

function headers(key: string, extra: Record<string, string> = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra,
  }
}

function deviceUrl(url: string, anonymousId: string) {
  return `${url}/rest/v1/convertlab_devices?anonymous_id=eq.${encodeURIComponent(anonymousId)}`
}

function eventUrl(url: string, anonymousId: string) {
  return `${url}/rest/v1/calculation_events?anonymous_id=eq.${encodeURIComponent(anonymousId)}`
}

export async function PATCH(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    assertSameOrigin(request)
    const body = updateSchema.parse(await request.json())
    const { url, key } = config()

    const response = await fetch(deviceUrl(url, body.anonymousId), {
      method: "PATCH",
      headers: headers(key, { Prefer: "return=minimal" }),
      body: JSON.stringify({ display_name: body.displayName }),
    })

    if (!response.ok) {
      console.error("ConvertLAB admin user update failed:", await response.text())
      return NextResponse.json({ error: "Unable to update user." }, { status: 502 })
    }

    return NextResponse.json({ updated: true, anonymousId: body.anonymousId, displayName: body.displayName })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid user name." }, { status: 400 })
    console.error("ConvertLAB admin user update error:", error)
    return NextResponse.json({ error: "Unable to update user." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    assertSameOrigin(request)
    const anonymousId = idSchema.parse(new URL(request.url).searchParams.get("anonymousId"))
    const { url, key } = config()

    // Remove historical events and the directory row so the deleted user is
    // removed from the dashboard's user population and aggregate analytics.
    const eventsResponse = await fetch(eventUrl(url, anonymousId), {
      method: "DELETE",
      headers: headers(key, { Prefer: "return=minimal" }),
    })
    if (!eventsResponse.ok) {
      console.error("ConvertLAB admin event deletion failed:", await eventsResponse.text())
      return NextResponse.json({ error: "Unable to delete user activity." }, { status: 502 })
    }

    const deviceResponse = await fetch(deviceUrl(url, anonymousId), {
      method: "DELETE",
      headers: headers(key, { Prefer: "return=minimal" }),
    })
    if (!deviceResponse.ok) {
      console.error("ConvertLAB admin device deletion failed:", await deviceResponse.text())
      return NextResponse.json({ error: "User activity was removed, but the user directory could not be updated." }, { status: 502 })
    }

    return NextResponse.json({ deleted: true, anonymousId })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid user identifier." }, { status: 400 })
    console.error("ConvertLAB admin user deletion error:", error)
    return NextResponse.json({ error: "Unable to delete user." }, { status: 500 })
  }
}
