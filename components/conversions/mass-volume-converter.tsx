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
import { convert } from "@/lib/conversions/engine"
import { massConversion } from "@/lib/conversions/data/mass"
import { volumeConversion } from "@/lib/conversions/data/volume"
import { LAB_PREP_DISCLAIMER } from "@/lib/calculators/types"

type Direction = "mass-to-volume" | "volume-to-mass"

export function MassVolumeConverter() {
  const [direction, setDirection] = useState<Direction>("mass-to-volume")
  const [substanceId, setSubstanceId] = useState("water")
  const [inputValue, setInputValue] = useState("")
  const [massUnit, setMassUnit] = useState("g")
  const [volumeUnit, setVolumeUnit] = useState("mL")
  const [useCustomDensity, setUseCustomDensity] = useState(false)
  const [customDensity, setCustomDensity] = useState("")

  const substance = substances.find((s) => s.id === substanceId)
  const density = useCustomDensity ? Number.parseFloat(customDensity) : substance?.density.value

  const result = useMemo(() => {
    const value = Number.parseFloat(inputValue)
    if (!Number.isFinite(value) || !density || density <= 0) return null

    try {
      if (direction === "mass-to-volume") {
        const grams = convert(massConversion, value, massUnit, "g")
        const mL = massToVolume(grams, density)
        return convert(volumeConversion, mL, "mL", volumeUnit)
      }
      const mL = convert(volumeConversion, value, volumeUnit, "mL")
      const grams = volumeToMass(mL, density)
      return convert(massConversion, grams, "g", massUnit)
    } catch {
      return null
    }
  }, [inputValue, density, direction, massUnit, volumeUnit])

  const inputLabel = direction === "mass-to-volume" ? `Mass (${massUnit})` : `Volume (${volumeUnit})`
  const outputUnit = direction === "mass-to-volume" ? volumeUnit : massUnit

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
                <SelectItem value="mass-to-volume">Mass → Volume</SelectItem>
                <SelectItem value="volume-to-mass">Volume → Mass</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Mass unit</Label>
            <Select value={massUnit} onValueChange={setMassUnit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {massConversion.units.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Volume unit</Label>
            <Select value={volumeUnit} onValueChange={setVolumeUnit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {volumeConversion.units.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{inputLabel}</Label>
          <Input type="number" inputMode="decimal" placeholder="100" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
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
            <Input type="number" inputMode="decimal" step="0.001" placeholder="1.000" value={customDensity} onChange={(e) => setCustomDensity(e.target.value)} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Density source: standard reference ({density ?? "—"} g/mL)
          </p>
        )}

        <div className="rounded-md border bg-muted p-4">
          <p className="text-xs text-muted-foreground mb-1">Result</p>
          <p className="text-2xl font-bold">
            {result !== null ? `${Number(result.toFixed(6))} ${outputUnit}` : density ? "—" : "Mass ↔ Volume requires density."}
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-md border border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
          <span>
            Approximate conversion. Density varies with temperature and concentration.
            {substance?.density.approximate && substance.density.notes ? ` ${substance.density.notes}` : ""}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{LAB_PREP_DISCLAIMER}</p>
      </CardContent>
    </Card>
  )
}
