"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { PageContainer } from "@/components/page-container"
import { clearRecentlyUsed, getRecentlyUsed, subscribeRecentlyUsed } from "@/lib/recently-used"
import { getCalculatorById } from "@/lib/calculators/registry"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock3 } from "lucide-react"


export default function RecentCalculatorsPage() {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    const refresh = () => setIds(getRecentlyUsed())
    refresh()
    return subscribeRecentlyUsed(refresh)
  }, [])

  const tools = ids.map((id) => getCalculatorById(id)).filter((t): t is NonNullable<typeof t> => Boolean(t))

  return (
    <PageContainer title="Recent Calculators" description="Your most recently opened calculators, stored locally on this device.">
      {tools.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent calculators yet. Calculate something to see it here.</p>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => clearRecentlyUsed()}>Clear recent</Button>
          </div>
          <div className="grid gap-3">
            {tools.map((tool) => (
              <Link key={tool.id} href={`/calculators/${tool.category}/${tool.id}`}>
                <Card className="hover:border-primary/50 transition-colors">
                  <CardHeader className="flex flex-row items-start gap-3 py-4">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0">
                      <CardTitle className="text-base">{tool.name}</CardTitle>
                      <CardDescription className="mt-1">{tool.description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  )
}
