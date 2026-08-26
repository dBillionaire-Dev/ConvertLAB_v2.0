"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/**
 * All three percentage types reduce to "amount of solute per 100 units of
 * solution": w/v = g/100mL, v/v = mL/100mL, w/w = g/100g. That means the
 * same %  <-> g/L (or equivalent) <-> mg/mL math applies to all three —
 * only the units of "amount" and "solution" differ.
 */
type Mode = "wv" | "vv" | "ww"

const MODE_LABELS: Record<Mode, { title: string; amountUnit: string; solutionUnit: string; description: string }> = {
  wv: { title: "% w/v", amountUnit: "g", solutionUnit: "mL", description: "Grams of solute per 100 mL of solution" },
  vv: { title: "% v/v", amountUnit: "mL", solutionUnit: "mL", description: "mL of solute per 100 mL of solution" },
  ww: { title: "% w/w", amountUnit: "g", solutionUnit: "g", description: "Grams of solute per 100 g of solution" },
}

export function PercentageSolutionCalculator() {
  const [mode, setMode] = useState<Mode>("wv")
  const [percent, setPercent] = useState("0.9")

  const meta = MODE_LABELS[mode]

  const result = useMemo(() => {
    const p = Number.parseFloat(percent)
    if (!Number.isFinite(p)) return null

    const perLiterEquivalent = p * 10 // e.g. 0.9% w/v = 9 g/L
    const mgPerMl = p * 10 // 0.9% w/v = 9 mg/mL

    return {
      amountPer100: p,
      perLiterEquivalent,
      mgPerMl,
    }
  }, [percent])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Percentage Solution</CardTitle>
        <CardDescription>Convert between %, g/L (or mL/L), and mg/mL for w/v, v/v, and w/w solutions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="wv">% w/v</TabsTrigger>
            <TabsTrigger value="vv">% v/v</TabsTrigger>
            <TabsTrigger value="ww">% w/w</TabsTrigger>
          </TabsList>
          {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
            <TabsContent key={m} value={m} className="pt-2">
              <p className="text-sm text-muted-foreground">{MODE_LABELS[m].description}</p>
            </TabsContent>
          ))}
        </Tabs>

        <div className="space-y-1.5 max-w-[200px]">
          <Label htmlFor="percent">Percentage</Label>
          <div className="relative">
            <Input id="percent" type="number" inputMode="decimal" step="0.01" value={percent} onChange={(e) => setPercent(e.target.value)} className="pr-8" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
          </div>
        </div>

        {result ? (
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border bg-muted p-3">
              <dt className="text-xs text-muted-foreground">
                {meta.amountUnit} per 100 {meta.solutionUnit}
              </dt>
              <dd className="text-lg font-bold">{Number(result.amountPer100.toFixed(4))}</dd>
            </div>
            <div className="rounded-md border bg-muted p-3">
              <dt className="text-xs text-muted-foreground">
                {meta.amountUnit}/L equivalent (per 1000 {meta.solutionUnit})
              </dt>
              <dd className="text-lg font-bold">{Number(result.perLiterEquivalent.toFixed(4))}</dd>
            </div>
            <div className="rounded-md border bg-muted p-3">
              <dt className="text-xs text-muted-foreground">mg per mL (mass-based modes)</dt>
              <dd className="text-lg font-bold">{mode === "vv" ? "N/A" : Number(result.mgPerMl.toFixed(2))}</dd>
            </div>
          </dl>
        ) : null}

        <p className="text-xs text-muted-foreground">
          For % w/w, the "per 100 g" and "mg/mL" figures assume solution density ≈ 1 g/mL unless you know the actual
          density — for precise work, use the Mass ↔ Volume converter with the correct substance density.
        </p>
      </CardContent>
    </Card>
  )
}
