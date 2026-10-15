"use client"

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type Monthly = {
  month: string
  mau: number
  newUsers: number
  toolUses: number
  sessions: number | null
  apkDownloads: number
  pwaInstalls: number
  gscClicks: number
  gscImpressions: number
}

const TRENDS: { key: keyof Monthly; title: string }[] = [
  { key: "mau", title: "Monthly active users" },
  { key: "newUsers", title: "New users" },
  { key: "toolUses", title: "Tool uses" },
  { key: "sessions", title: "Sessions (recorded from deployment)" },
  { key: "apkDownloads", title: "APK downloads (since tracking began)" },
  { key: "pwaInstalls", title: "PWA installs (lower bound)" },
  { key: "gscClicks", title: "Search clicks" },
  { key: "gscImpressions", title: "Search impressions" },
]

const COLOR = "#2563eb"

export function MonthlyTrends({ data }: { data: Monthly[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {TRENDS.map(({ key, title }) => (
        <div key={key} className="rounded-xl border bg-background p-4 shadow-sm print:break-inside-avoid">
          <h3 className="mb-2 text-sm font-semibold">{title}</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey={key} stroke={COLOR} strokeWidth={2} dot={{ r: 2 }} connectNulls={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  )
}

export function HorizontalBars({ data, labelKey, valueKey, height = 420 }: { data: Record<string, any>[]; labelKey: string; valueKey: string; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis type="category" dataKey={labelKey} width={170} tick={{ fontSize: 11 }} interval={0} />
          <Tooltip />
          <Bar dataKey={valueKey} fill={COLOR} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted print:hidden">
      Print / save as PDF
    </button>
  )
}
