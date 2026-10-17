import { NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { listFeedback } from "@/lib/feedback/server"
import { toCsv } from "@/lib/traction/csv.mjs"

export const dynamic = "force-dynamic"

const COLUMNS = ["created_at", "survey_version", "rating", "background", "role", "devices", "use_context", "office_type", "pay_interest", "pay_who", "price_individual", "price_team", "platform", "app_version", "improve", "missing", "other"]

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) return new NextResponse("Unauthorized", { status: 401 })
  const raw = new URL(request.url).searchParams.get("version")
  const version = raw && raw !== "all" && Number.isInteger(Number(raw)) ? Number(raw) : null
  const rows = (await listFeedback(version)).map((r) => ({ ...r, devices: (r.devices ?? []).join("; ") }))
  // The anonymous id is deliberately not exported.
  return new NextResponse(toCsv(COLUMNS, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clinexia-feedback-${version ?? "all"}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
