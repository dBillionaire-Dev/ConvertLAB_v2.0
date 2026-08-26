"use client"

import { useMemo, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { substances } from "@/lib/conversions/substances"
import { massToVolume, volumeToMass } from "@/lib/conversions/density"

type Direction = "mass-to-volume" | "volume-to-mass"

export function MassVolumeConverter() {
  const [direction, setDirection] = useState<Direction>("mass-to-volume")
  const [substanceId, setSubstanceId] = useState("water")
  const [inputValue, setInputValue] = useState("100")
  const [useCustomDensity, setUseCustomDensity] = useState(false)
  const [customDensity, setCustomDensity] = useState("1.000")

  const substance = substances.find((s) => s.id === substanceId)
  const density = useCustomDensity ? Number.parseFloat(customDensity) : substance?.density.value

  const result = useMemo(() => {
    const value = Number.parseFloat(inputValue)
    if (!Number.isFinite(value) || !density || density <= 0) return null
    return direction === "mass-to-volume" ? massToVolume(value, density) : volumeToMass(value, density)
  }, [inputValue, density, direction])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mass ↔ Volume</CardTitle>
        <CardDescription>
          Mass and volume are only interchangeable through density. ConvertLAB never assumes 1 g = 1 mL.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Substance</Label>
            <Select value={substanceId} onValueChange={setSubstanceId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {substances.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Conversion</Label>
            <Select value={direction} onValueChange={(v) => setDirection(v as Direction)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mass-to-volume">Mass (g) → Volume (mL)</SelectItem>
                <SelectItem value="volume-to-mass">Volume (mL) → Mass (g)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{direction === "mass-to-volume" ? "Mass (g)" : "Volume (mL)"}</Label>
          <Input type="number" inputMode="decimal" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="custom-density"
            checked={useCustomDensity}
            onCheckedChange={(checked) => setUseCustomDensity(checked === true)}
          />
          <Label htmlFor="custom-density" className="font-normal">
            Use custom density
          </Label>
        </div>

        {useCustomDensity ? (
          <div className="space-y-1.5 max-w-[200px]">
            <Label>Density (g/mL)</Label>
            <Input type="number" inputMode="decimal" step="0.001" value={customDensity} onChange={(e) => setCustomDensity(e.target.value)} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Density source: standard reference ({density ?? "-"} g/mL)
          </p>
        )}

        <div className="rounded-md border bg-muted p-4">
          <p className="text-xs text-muted-foreground mb-1">Result</p>
          <p className="text-2xl font-bold">
            {result !== null ? `${Number(result.toFixed(4))} ${direction === "mass-to-volume" ? "mL" : "g"}` : "—"}
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-md border border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
          <span>
            Approximate conversion. Density varies with temperature and concentration.
            {substance?.density.approximate && substance.density.notes ? ` ${substance.density.notes}` : ""}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
