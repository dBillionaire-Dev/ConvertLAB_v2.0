"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { analytes, getAnalyte, mgdLToMmolL, mmolLToMgdL } from "@/lib/conversions/molar-mass"
import { LAB_PREP_DISCLAIMER } from "@/lib/calculators/types"

type Direction = "mass-to-molar" | "molar-to-mass"

export function MolarMassConverter() {
  const [analyteId, setAnalyteId] = useState("glucose")
  const [direction, setDirection] = useState<Direction>("mass-to-molar")
  const [value, setValue] = useState("100")
  const [useCustomMw, setUseCustomMw] = useState(false)
  const [customMw, setCustomMw] = useState("180.16")

  const analyte = getAnalyte(analyteId)
  const mw = useCustomMw ? Number.parseFloat(customMw) : analyte?.molecularWeight

  const result = useMemo(() => {
    const v = Number.parseFloat(value)
    if (!Number.isFinite(v) || !mw || mw <= 0) return null
    try {
      return direction === "mass-to-molar" ? mgdLToMmolL(v, mw) : mmolLToMgdL(v, mw)
    } catch {
      return null
    }
  }, [value, mw, direction])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Molar ↔ Mass Concentration</CardTitle>
        <CardDescription>Convert mg/dL to mmol/L (and back) using an analyte's molecular weight.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Analyte</Label>
            <Select value={analyteId} onValueChange={setAnalyteId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {analytes.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Direction</Label>
            <Select value={direction} onValueChange={(v) => setDirection(v as Direction)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mass-to-molar">mg/dL → mmol/L</SelectItem>
                <SelectItem value="molar-to-mass">mmol/L → mg/dL</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{direction === "mass-to-molar" ? "Concentration (mg/dL)" : "Concentration (mmol/L)"}</Label>
          <Input type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="custom-mw" checked={useCustomMw} onCheckedChange={(c) => setUseCustomMw(c === true)} />
          <Label htmlFor="custom-mw" className="font-normal">
            Use custom molecular weight
          </Label>
        </div>

        {useCustomMw ? (
          <div className="space-y-1.5 max-w-[200px]">
            <Label>Molecular weight (g/mol)</Label>
            <Input type="number" inputMode="decimal" step="0.01" value={customMw} onChange={(e) => setCustomMw(e.target.value)} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Molecular weight: {mw ?? "—"} g/mol</p>
        )}

        <div className="rounded-md border bg-muted p-4">
          <p className="text-xs text-muted-foreground mb-1">Result</p>
          <p className="text-2xl font-bold">
            {result !== null ? `${Number(result.toFixed(4))} ${direction === "mass-to-molar" ? "mmol/L" : "mg/dL"}` : "—"}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">{LAB_PREP_DISCLAIMER}</p>
      </CardContent>
    </Card>
  )
}
