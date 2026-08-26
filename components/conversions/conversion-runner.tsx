"use client"

import { useMemo, useState } from "react"
import { ArrowLeftRight, Copy } from "lucide-react"
import type { ConversionCategory } from "@/lib/conversions/types"
import { convert, ConversionError } from "@/lib/conversions/engine"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { recordUsage } from "@/lib/recently-used"

export function ConversionRunner({ category }: { category: ConversionCategory }) {
  const [value, setValue] = useState("1")
  const [fromId, setFromId] = useState(category.units[0]?.id ?? "")
  const [toId, setToId] = useState(category.units[1]?.id ?? category.units[0]?.id ?? "")
  const { toast } = useToast()

  const result = useMemo(() => {
    const numeric = Number.parseFloat(value)
    if (!Number.isFinite(numeric)) return { display: "-", error: null as string | null }
    try {
      const converted = convert(category, numeric, fromId, toId)
      return { display: formatNumber(converted), error: null as string | null }
    } catch (err) {
      return { display: "-", error: err instanceof ConversionError ? err.message : "Conversion error" }
    }
  }, [value, fromId, toId, category])

  const toUnit = category.units.find((u) => u.id === toId)
  const fromUnit = category.units.find((u) => u.id === fromId)

  const swap = () => {
    setFromId(toId)
    setToId(fromId)
  }

  const handleCopy = async () => {
    recordUsage(`conversion:${category.id}`)
    try {
      await navigator.clipboard.writeText(`${value} ${fromUnit?.symbol} = ${result.display} ${toUnit?.symbol}`)
      toast({ description: "Result copied to clipboard." })
    } catch {
      toast({ description: "Couldn't copy. Select the text manually." })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{category.name} Conversion</CardTitle>
        <CardDescription>Convert between {category.name.toLowerCase()} units.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <div className="space-y-1.5">
            <Label>From</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="flex-1"
              />
              <Select value={fromId} onValueChange={setFromId}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {category.units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button variant="outline" size="icon" onClick={swap} aria-label="Swap units" className="mx-auto">
            <ArrowLeftRight className="h-4 w-4" />
          </Button>

          <div className="space-y-1.5">
            <Label>To</Label>
            <div className="flex gap-2">
              <Input readOnly value={result.display} className="flex-1 bg-muted" />
              <Select value={toId} onValueChange={setToId}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {category.units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {result.error ? <p className="text-sm text-destructive">{result.error}</p> : null}

        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-1.5" /> Copy Result
        </Button>
      </CardContent>
    </Card>
  )
}

function formatNumber(n: number): string {
  if (Math.abs(n) >= 1e6 || (Math.abs(n) < 1e-4 && n !== 0)) return n.toExponential(4)
  return Number(n.toFixed(6)).toString()
}
