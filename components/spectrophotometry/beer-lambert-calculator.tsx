"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { beerLambert, SpectroError } from "@/lib/spectrophotometry"
import { CALCULATION_DISCLAIMER } from "@/lib/calculators/types"

type SolveFor = "absorbance" | "epsilon" | "pathLength" | "concentration"

const FIELD_LABELS: Record<SolveFor, string> = {
  absorbance: "Absorbance (A)",
  epsilon: "Molar absorptivity (ε, L·mol⁻¹·cm⁻¹)",
  pathLength: "Path length (b, cm)",
  concentration: "Concentration (c, mol/L)",
}

export function BeerLambertCalculator() {
  const [solveFor, setSolveFor] = useState<SolveFor>("concentration")
  const [values, setValues] = useState<Record<SolveFor, string>>({
    absorbance: "0.5",
    epsilon: "5000",
    pathLength: "1",
    concentration: "",
  })

  const otherFields = (Object.keys(FIELD_LABELS) as SolveFor[]).filter((f) => f !== solveFor)

  const result = useMemo(() => {
    const parsed: Record<string, number | undefined> = {}
    for (const field of otherFields) {
      const raw = values[field]
      const n = Number.parseFloat(raw)
      parsed[field] = Number.isFinite(n) ? n : undefined
    }
    if (otherFields.some((f) => parsed[f] === undefined)) return { error: null, value: null }

    try {
      const { value } = beerLambert(parsed as { absorbance?: number; epsilon?: number; pathLength?: number; concentration?: number })
      return { error: null as string | null, value }
    } catch (err) {
      return { error: err instanceof SpectroError ? err.message : "Unable to solve", value: null }
    }
  }, [values, otherFields])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Beer-Lambert Law</CardTitle>
        <CardDescription>A = εbc, choose the quantity to solve for.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5 max-w-sm">
          <Label>Solve for</Label>
          <Select value={solveFor} onValueChange={(v) => setSolveFor(v as SolveFor)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(FIELD_LABELS) as SolveFor[]).map((f) => (
                <SelectItem key={f} value={f}>
                  {FIELD_LABELS[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {otherFields.map((field) => (
            <div key={field} className="space-y-1.5">
              <Label htmlFor={field}>{FIELD_LABELS[field]}</Label>
              <Input
                id={field}
                type="number"
                inputMode="decimal"
                value={values[field]}
                onChange={(e) => setValues((prev) => ({ ...prev, [field]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <div className="rounded-md border bg-muted p-4">
          <p className="text-xs text-muted-foreground mb-1">{FIELD_LABELS[solveFor]}</p>
          <p className="text-2xl font-bold">
            {result.error ? <span className="text-sm font-normal text-destructive">{result.error}</span> : result.value !== null ? Number(result.value.toPrecision(6)) : "—"}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">{CALCULATION_DISCLAIMER}</p>
      </CardContent>
    </Card>
  )
}
