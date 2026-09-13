import { NextResponse } from "next/server"
import { z } from "zod"

const eventSchema = z.object({
  id: z.string().uuid(),
  anonymousId: z.string().min(1).max(100),
  calculatorId: z.string().min(1).max(120),
  calculatorName: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  occurredAt: z.string().datetime(),
  appVersion: z.string().min(1).max(40),
  wasOffline: z.boolean(),
  source: z.enum(["web", "pwa"]).default("web"),
  environment: z.string().min(1).max(40).default("production"),
})

const payloadSchema = z.object({
  events: z.array(eventSchema).min(1).max(100),
})

function config() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Analytics storage is not configured.")
  return { url: url.replace(/\/$/, ""), key }
}

export async function POST(request: Request) {
  try {
    const body = payloadSchema.parse(await request.json())
    const { url, key } = config()

    const response = await fetch(`${url}/rest/v1/calculation_events`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates,return=minimal",
      },
      body: JSON.stringify(
        body.events.map((event) => ({
          id: event.id,
          anonymous_id: event.anonymousId,
          calculator_id: event.calculatorId,
          calculator_name: event.calculatorName,
          category: event.category,
          occurred_at: event.occurredAt,
          app_version: event.appVersion,
          was_offline: event.wasOffline,
          source: event.source,
          environment: event.environment,
        })),
      ),
    })

    if (!response.ok) {
      console.error("ConvertLAB analytics insert failed:", await response.text())
      return NextResponse.json({ error: "Unable to record analytics." }, { status: 502 })
    }

    // Keep the anonymous device directory current and attach the latest
    // calculation time to each device. The ID is never exposed as a real name.
    const latestByDevice = new Map<string, (typeof body.events)[number]>()
    for (const event of body.events) {
      const previous = latestByDevice.get(event.anonymousId)
      if (!previous || new Date(event.occurredAt).getTime() > new Date(previous.occurredAt).getTime()) {
        latestByDevice.set(event.anonymousId, event)
      }
    }

    const deviceRows = Array.from(latestByDevice.values()).map((event) => ({
      anonymous_id: event.anonymousId,
      display_name: `User-${event.anonymousId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase().padEnd(8, "0").slice(0, 6)}`,
      last_seen_at: new Date().toISOString(),
      last_calculation_at: event.occurredAt,
      source: event.source,
      environment: event.environment,
      app_version: event.appVersion,
    }))

    if (deviceRows.length) {
      const deviceResponse = await fetch(`${url}/rest/v1/convertlab_devices?on_conflict=anonymous_id`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(deviceRows),
      })

      if (!deviceResponse.ok) {
        console.error("ConvertLAB device update failed:", await deviceResponse.text())
      }
    }

    return NextResponse.json({ accepted: body.events.map((event) => event.id) })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid analytics payload." }, { status: 400 })
    }
    console.error("ConvertLAB analytics error:", error)
    return NextResponse.json({ error: "Unable to record analytics." }, { status: 500 })
  }
}
