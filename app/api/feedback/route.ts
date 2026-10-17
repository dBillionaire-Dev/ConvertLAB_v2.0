import { NextResponse } from "next/server"
import { allowSubmission } from "@/lib/feedback/rate-limit"
import { saveFeedback } from "@/lib/feedback/server"
import { validateSubmission } from "@/lib/feedback/submission"

export const dynamic = "force-dynamic"

// Stores one anonymous feedback response (a second one from the same device in the same round replaces the first).
export async function POST(request: Request) {
  try {
    const length = Number(request.headers.get("content-length") ?? 0)
    if (length > 20_000) return NextResponse.json({ error: "Too large." }, { status: 413 })

    const clientKey = (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim()
    if (!allowSubmission(clientKey)) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 })

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 })
    }
    const result = validateSubmission(body)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })

    await saveFeedback(result.value)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Clinexia feedback error:", error)
    return NextResponse.json({ error: "Could not save your feedback. Please try again." }, { status: 500 })
  }
}
