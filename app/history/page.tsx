"use client"

import Link from "next/link"
import { PageContainer } from "@/components/page-container"
import { useHistory } from "@/lib/history/use-history"
import { getCalculatorById } from "@/lib/calculators/registry"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export default function HistoryPage() {
  const { items, loading, remove, clear } = useHistory()

  return (
    <PageContainer title="History" description="Your last calculations, stored locally on this device.">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No calculations yet. Results are saved here automatically.</p>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => clear()}>
              Clear all
            </Button>
          </div>
          {items.map((item) => {
            const def = getCalculatorById(item.calculatorId)
            return (
              <Card key={item.id}>
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    {def ? (
                      <Link
                        href={`/calculators/${def.category}/${def.id}`}
                        className="font-medium hover:underline"
                      >
                        {item.calculatorName}
                      </Link>
                    ) : (
                      <span className="font-medium">{item.calculatorName}</span>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {String(item.result)} {item.unit ?? ""} · {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => remove(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </PageContainer>
  )
}
