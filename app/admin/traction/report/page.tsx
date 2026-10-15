import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { addMonths, lagosDay } from "@/lib/traction/dates.mjs"
import { loadDashboard } from "@/lib/traction/admin-data"
import { AdminNav, num, pct } from "@/components/admin/traction-ui"
import { PrintButton } from "@/components/admin/traction-charts"

export const dynamic = "force-dynamic"

export default async function BuyerReportPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login")
  const today = lagosDay(Date.now())
  const from = addMonths(today.slice(0, 7) + "-01", -11)
  const data = await loadDashboard({ from, to: today })
  const c = data.cards
  const currentMonth = today.slice(0, 7)

  return (
    <main className="min-h-screen bg-muted/20 print:bg-white">
      <div className="mx-auto max-w-4xl px-6 py-8 print:max-w-none print:p-0">
        <AdminNav current="report" />
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clinexia: traction summary</h1>
            <p className="mt-1 text-sm text-muted-foreground">Generated {today} · monthly series {from.slice(0, 7)} to {currentMonth} (current month is partial) · days in Africa/Lagos</p>
          </div>
          <PrintButton />
        </div>

        <h2 className="mt-6 text-lg font-semibold">Headline numbers</h2>
        <table className="mt-2 w-full text-sm">
          <tbody>
            {[
              ["Monthly active users (last 30 days)", num(c.mau)],
              ["Weekly / daily active users", `${num(c.wau)} / ${num(c.dau)}`],
              ["Returning users (30 days)", pct(c.returningPct)],
              ["Retention D1 / D7 / D30", `${pct(c.retention.d1.rate)} / ${pct(c.retention.d7.rate)} / ${pct(c.retention.d30.rate)}`],
              ["Total tool uses (all time)", num(c.totalToolUses)],
              ["APK downloads (GitHub, all time / last 30 days)", `${num(c.apk.total)} / ${num(c.apk.last30)}`],
              ["PWA installs (lower bound)", num(c.installsTotal)],
              ["Search clicks / impressions (28 days)", `${num(c.gscClicks28)} / ${num(c.gscImpressions28)}`],
            ].map(([label, value]) => (
              <tr key={label} className="border-b"><td className="py-1.5">{label}</td><td className="py-1.5 text-right font-medium tabular-nums">{value}</td></tr>
            ))}
          </tbody>
        </table>

        <h2 className="mt-8 text-lg font-semibold">Monthly series (last 12 months)</h2>
        <div className="mt-2 overflow-x-auto print:overflow-visible">
          <table className="w-full text-xs">
            <thead className="border-b text-left text-muted-foreground">
              <tr>{["Month", "MAU", "New users", "Tool uses", "Sessions", "APK dl.", "PWA inst.", "Search clicks", "Search impr."].map((h, i) => <th key={h} className={`py-1.5 ${i ? "text-right" : ""}`}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {data.monthly.map((m) => (
                <tr key={m.month} className="border-b">
                  <td className="py-1.5">{m.month}</td>
                  {[m.mau, m.newUsers, m.toolUses, m.sessions, m.apkDownloads, m.pwaInstalls, m.gscClicks, m.gscImpressions].map((v, i) => <td key={i} className="py-1.5 text-right tabular-nums">{num(v)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">“–” means not recorded for that month (not zero). APK downloads per month count only growth observed since tracking began.</p>

        <h2 className="mt-8 text-lg font-semibold">Where the numbers come from</h2>
        <ul className="mt-2 space-y-2 text-xs">
          {data.coverage.map((cv) => (
            <li key={cv.metric}>
              <span className="font-medium">{cv.metric}</span> · {cv.source} · {cv.range ? `${cv.range.from} → ${cv.range.to}` : "no data yet"}. <span className="text-muted-foreground">{cv.note}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 border-t pt-3 text-xs text-muted-foreground">
          Privacy: Clinexia stores no patient data, calculator inputs or results, and no IP addresses. Usage is counted from an anonymous random id, an event type, tool id, platform, app version and timestamp. All figures are produced from stored records; no history is estimated or generated.
        </p>
      </div>
    </main>
  )
}
