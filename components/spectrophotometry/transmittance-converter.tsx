"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { absorbanceFromTransmittance, transmittanceFromAbsorbance, SpectroError } from "@/lib/spectrophotometry"

type Direction = "a-to-t" | "t-to-a"

export function TransmittanceConverter() {
  const [direction, setDirection] = useState<Direction>("t-to-a")
  const [value, setValue] = useState("50")

  const result = useMemo(() => {
    const v = Number.parseFloat(value)
    if (!Number.isFinite(v)) return { error: null, value: null }
    try {
      const out = direction === "t-to-a" ? absorbanceFromTransmittance(v) : transmittanceFromAbsorbance(v)
      return { error: null as string | null, value: out }
    } catch (err) {
      return { error: err instanceof SpectroError ? err.message : "Invalid input", value: null }
    }
  }, [value, direction])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Absorbance ↔ %Transmittance</CardTitle>
        <CardDescription>A = -log₁₀(T), where T is fractional transmittance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5 max-w-sm">
          <Label>Direction</Label>
          <Select value={direction} onValueChange={(v) => setDirection(v as Direction)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="t-to-a">%Transmittance → Absorbance</SelectItem>
              <SelectItem value="a-to-t">Absorbance → %Transmittance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 max-w-[200px]">
          <Label>{direction === "t-to-a" ? "%Transmittance" : "Absorbance"}</Label>
          <Input type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>

        <div className="rounded-md border bg-muted p-4">
          <p className="text-xs text-muted-foreground mb-1">{direction === "t-to-a" ? "Absorbance" : "%Transmittance"}</p>
          <p className="text-2xl font-bold">
            {result.error ? (
              <span className="text-sm font-normal text-destructive">{result.error}</span>
            ) : result.value !== null ? (
              Number(result.value.toPrecision(6))
            ) : (
              "—"
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
