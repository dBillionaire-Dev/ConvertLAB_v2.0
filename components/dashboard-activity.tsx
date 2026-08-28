"use client"

import Link from "next/link"
import { Activity as ActivityIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useHistory } from "@/lib/history/use-history"
import { computeActivityStats } from "@/lib/history/stats"
import { getCalculatorById } from "@/lib/calculators/registry"

export function DashboardActivity() {
  const { items, loading } = useHistory()

  if (loading || items.length === 0) return null

  const stats = computeActivityStats(items)
  const mostUsedTool = stats.mostUsed ? getCalculatorById(stats.mostUsed.calculatorId) : null

  return (
    <Card className="mb-10">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
        <ActivityIcon className="h-4 w-4 text-primary" aria-hidden />
        <CardTitle className="text-sm font-medium text-muted-foreground">Your Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-2xl font-bold">{stats.calculationsThisWeek}</p>
            <p className="text-xs text-muted-foreground">calculation{stats.calculationsThisWeek === 1 ? "" : "s"} this week</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.calculatorsUsedCount}</p>
            <p className="text-xs text-muted-foreground">calculator{stats.calculatorsUsedCount === 1 ? "" : "s"} used</p>
          </div>
          {stats.mostUsed ? (
            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs text-muted-foreground mb-0.5">Most used</p>
              {mostUsedTool ? (
                <Link
                  href={`/calculators/${mostUsedTool.category}/${mostUsedTool.id}`}
                  className="font-medium hover:underline"
                >
                  {stats.mostUsed.calculatorName}
                </Link>
              ) : (
                <p className="font-medium">{stats.mostUsed.calculatorName}</p>
              )}
            </div>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Calculated from history stored only on this device, nothing is sent anywhere.
        </p>
      </CardContent>
    </Card>
  )
}
