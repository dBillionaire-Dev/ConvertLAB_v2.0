"use client"

import { useMemo, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { linearRegression, concentrationFromCalibration, SpectroError, type CalibrationPoint } from "@/lib/spectrophotometry"

const DEFAULT_POINTS = [
  { concentration: "0", absorbance: "0.001" },
  { concentration: "10", absorbance: "0.120" },
  { concentration: "20", absorbance: "0.240" },
  { concentration: "30", absorbance: "0.359" },
  { concentration: "40", absorbance: "0.480" },
]

export function CalibrationCurveTool() {
  const [rows, setRows] = useState(DEFAULT_POINTS)
  const [unknownAbsorbance, setUnknownAbsorbance] = useState("0.300")

  const points: CalibrationPoint[] = useMemo(
    () =>
      rows
        .map((r) => ({ concentration: Number.parseFloat(r.concentration), absorbance: Number.parseFloat(r.absorbance) }))
        .filter((p) => Number.isFinite(p.concentration) && Number.isFinite(p.absorbance)),
    [rows],
  )

  const regression = useMemo(() => {
    try {
      return { data: linearRegression(points), error: null as string | null }
    } catch (err) {
      return { data: null, error: err instanceof SpectroError ? err.message : "Unable to fit a line" }
    }
  }, [points])

  const unknownConcentration = useMemo(() => {
    const a = Number.parseFloat(unknownAbsorbance)
    if (!regression.data || !Number.isFinite(a)) return null
    try {
      return concentrationFromCalibration(a, regression.data)
    } catch {
      return null
    }
  }, [unknownAbsorbance, regression.data])

  const updateRow = (index: number, field: "concentration" | "absorbance", value: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  const addRow = () => setRows((prev) => [...prev, { concentration: "", absorbance: "" }])
  const removeRow = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calibration Curve</CardTitle>
        <CardDescription>Enter standards to fit a calibration line and estimate an unknown's concentration.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground px-1">
            <span>Concentration</span>
            <span>Absorbance</span>
            <span className="sr-only">Remove</span>
          </div>
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
              <Input
                type="number"
                inputMode="decimal"
                value={row.concentration}
                onChange={(e) => updateRow(i, "concentration", e.target.value)}
                aria-label={`Standard ${i + 1} concentration`}
              />
              <Input
                type="number"
                inputMode="decimal"
                step="0.001"
                value={row.absorbance}
                onChange={(e) => updateRow(i, "absorbance", e.target.value)}
                aria-label={`Standard ${i + 1} absorbance`}
              />
              <Button variant="ghost" size="icon" aria-label="Remove standard" onClick={() => removeRow(i)} disabled={rows.length <= 2}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4 mr-1.5" /> Add standard
          </Button>
        </div>

        {regression.error ? (
          <p className="text-sm text-destructive">{regression.error}</p>
        ) : regression.data ? (
          <>
            <div className="h-56 w-full" role="img" aria-label="Scatter plot of standards with fitted calibration line">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" dataKey="concentration" name="Concentration" className="text-xs" />
                  <YAxis type="number" dataKey="absorbance" name="Absorbance" className="text-xs" />
                  <ZAxis range={[60, 60]} />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={points} fill="hsl(var(--primary))" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <dl className="grid gap-3 grid-cols-3">
              <div className="rounded-md border bg-muted p-3">
                <dt className="text-xs text-muted-foreground">Slope</dt>
                <dd className="text-lg font-bold">{Number(regression.data.slope.toPrecision(5))}</dd>
              </div>
              <div className="rounded-md border bg-muted p-3">
                <dt className="text-xs text-muted-foreground">Intercept</dt>
                <dd className="text-lg font-bold">{Number(regression.data.intercept.toPrecision(5))}</dd>
              </div>
              <div className="rounded-md border bg-muted p-3">
                <dt className="text-xs text-muted-foreground">R²</dt>
                <dd className="text-lg font-bold">{Number(regression.data.rSquared.toPrecision(5))}</dd>
              </div>
            </dl>

            <div className="grid gap-4 sm:grid-cols-2 items-end pt-2 border-t">
              <div className="space-y-1.5">
                <Label htmlFor="unknown">Unknown's absorbance</Label>
                <Input id="unknown" type="number" inputMode="decimal" step="0.001" value={unknownAbsorbance} onChange={(e) => setUnknownAbsorbance(e.target.value)} />
              </div>
              <div className="rounded-md border bg-muted p-3">
                <p className="text-xs text-muted-foreground">Estimated concentration</p>
                <p className="text-lg font-bold">{unknownConcentration !== null ? Number(unknownConcentration.toPrecision(6)) : "—"}</p>
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
