import { NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { loadDashboard, rest, resolveRange } from "@/lib/traction/admin-data"
import { toCsv } from "@/lib/traction/csv.mjs"

export const dynamic = "force-dynamic"

// Raw tables: [date column, columns]
const RAW: Record<string, [string, string[]]> = {
  daily_rollups: ["date", ["date", "platform", "active_users", "new_users", "returning_users", "sessions", "tool_uses"]],
  tool_usage_daily: ["date", ["date", "tool_id", "tool_name", "uses"]],
  search_console_daily: ["date", ["date", "query", "page", "country", "device", "clicks", "impressions", "ctr", "position"]],
  apk_downloads_snapshots: ["snapshot_date", ["snapshot_date", "captured_at", "release_tag", "asset_name", "download_count", "is_baseline", "published_at"]],
  pwa_installs_daily: ["date", ["date", "installs"]],
  revenue_entries: ["date", ["date", "source", "amount_usd", "notes", "entered_manually"]],
}

// Dashboard tables
const DERIVED: Record<string, string[]> = {
  monthly: ["month", "mau", "newUsers", "toolUses", "sessions", "apkDownloads", "pwaInstalls", "gscClicks", "gscImpressions"],
  top_tools: ["toolId", "name", "uses"],
  platform_split: ["platform", "activeUserDays", "toolUses"],
  top_queries: ["label", "clicks", "impressions", "position"],
  top_pages: ["label", "clicks", "impressions", "position"],
  coverage: ["metric", "source", "from", "to", "syncedAt", "note"],
}

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) return new NextResponse("Unauthorized", { status: 401 })
  const params = new URL(request.url).searchParams
  const table = params.get("table") ?? ""
  const range = resolveRange({ from: params.get("from") ?? undefined, to: params.get("to") ?? undefined })

  let csv: string
  if (RAW[table]) {
    const [dateColumn, columns] = RAW[table]
    const rows = await rest().selectAll(table, `select=${columns.join(",")}&${dateColumn}=gte.${range.from}&${dateColumn}=lte.${range.to}&order=${dateColumn}`)
    csv = toCsv(columns, rows)
  } else if (DERIVED[table]) {
    const data = await loadDashboard(range)
    const source: Record<string, any[]> = {
      monthly: data.monthly,
      top_tools: data.topTools,
      platform_split: data.platformSplit,
      top_queries: data.topQueries,
      top_pages: data.topPages,
      coverage: data.coverage.map((c) => ({ ...c, from: c.range?.from ?? "", to: c.range?.to ?? "" })),
    }
    csv = toCsv(DERIVED[table], source[table])
  } else {
    return new NextResponse("Unknown table", { status: 400 })
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clinexia-${table}-${range.from}_${range.to}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
