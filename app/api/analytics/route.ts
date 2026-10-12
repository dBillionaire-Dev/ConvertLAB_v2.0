import { NextResponse } from "next/server"
import { parseEvents } from "@/lib/analytics/validate-events"

function config() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Analytics storage is not configured.")
  return { url: url.replace(/\/$/, ""), key }
}

/**
 * Response contract (the browser and the service worker both rely on it):
 *   accepted  - stored (or already stored). Safe to delete from the outbox.
 *   rejected  - permanently invalid. Also safe to delete; retrying can never work.
 * Anything in neither list stays queued and is retried. 5xx means "try again later".
 */
export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid analytics payload." }, { status: 400 })
  }

  const parsed = parseEvents(payload)
  if (!parsed) {
    return NextResponse.json({ error: "Invalid analytics payload." }, { status: 400 })
  }

  const { valid, rejected } = parsed
  if (!valid.length) return NextResponse.json({ accepted: [], rejected })

  try {
    const { url, key } = config()

    // `on_conflict=id` + ignore-duplicates makes every retry idempotent: the same
    // event ID can be re-sent any number of times and is only ever stored once.
    const response = await fetch(`${url}/rest/v1/calculation_events?on_conflict=id`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates,return=minimal",
      },
      body: JSON.stringify(
        valid.map((event) => ({
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
      console.error("Clinexia analytics insert failed:", await response.text())
      return NextResponse.json({ error: "Unable to record analytics." }, { status: 502 })
    }

    // Keep the anonymous device directory current and attach the latest
    // calculation time to each device. The ID is never exposed as a real name.
    const latestByDevice = new Map<string, (typeof valid)[number]>()
    for (const event of valid) {
      const previous = latestByDevice.get(event.anonymousId)
      if (!previous || new Date(event.occurredAt).getTime() > new Date(previous.occurredAt).getTime()) {
        latestByDevice.set(event.anonymousId, event)
      }
    }

    // Best effort: the events are already stored, so a failed device touch must
    // never turn into a failed upload (which would make the browser re-send).
    await Promise.allSettled(
      Array.from(latestByDevice.values()).map(async (event) => {
        const deviceResponse = await fetch(`${url}/rest/v1/rpc/convertlab_touch_device`, {
          method: "POST",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            p_anonymous_id: event.anonymousId,
            p_last_seen_at: new Date().toISOString(),
            p_last_calculation_at: event.occurredAt,
            p_source: event.source,
            p_environment: event.environment,
            p_app_version: event.appVersion,
          }),
        })

        if (!deviceResponse.ok) {
          console.error("Clinexia device update failed:", await deviceResponse.text())
        }
      }),
    )

    return NextResponse.json({ accepted: valid.map((event) => event.id), rejected })
  } catch (error) {
    console.error("Clinexia analytics error:", error)
    return NextResponse.json({ error: "Unable to record analytics." }, { status: 500 })
  }
}
