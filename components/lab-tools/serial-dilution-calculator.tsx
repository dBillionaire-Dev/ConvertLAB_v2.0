"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LAB_PREP_DISCLAIMER } from "@/lib/calculators/types"

export function SerialDilutionCalculator() {
  const [initial, setInitial] = useState("")
  const [factor, setFactor] = useState("")
  const [steps, setSteps] = useState("")

  const result = useMemo(() => {
    const initialValue = Number.parseFloat(initial)
    const dilutionFactor = Number.parseFloat(factor)
    const stepCount = Math.round(Number.parseFloat(steps))

    if (!Number.isFinite(initialValue) || !Number.isFinite(dilutionFactor) || dilutionFactor <= 0) return null
    if (!Number.isFinite(stepCount) || stepCount < 1 || stepCount > 20) return null

    const rows: { step: number; ratio: string; concentration: number }[] = []
    let current = initialValue
    let cumulativeFactor = 1
    for (let i = 1; i <= stepCount; i++) {
      current = current / dilutionFactor
      cumulativeFactor *= dilutionFactor
      rows.push({ step: i, ratio: `1:${Math.round(cumulativeFactor)}`, concentration: current })
    }

    return { rows, finalDilution: `1:${Math.round(cumulativeFactor)}`, finalConcentration: current }
  }, [initial, factor, steps])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Serial Dilution</CardTitle>
        <CardDescription>Calculates concentration at every step of a serial dilution series.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="initial">Initial concentration</Label>
            <Input id="initial" type="number" inputMode="decimal" placeholder="10" value={initial} onChange={(e) => setInitial(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="factor">Dilution factor (per step)</Label>
            <Input id="factor" type="number" inputMode="decimal" value={factor} onChange={(e) => setFactor(e.target.value)} placeholder="e.g. 10 for 1:10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="steps">Number of steps</Label>
            <Input id="steps" type="number" inputMode="numeric" min={1} max={20} placeholder="3" value={steps} onChange={(e) => setSteps(e.target.value)} />
          </div>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Step</TableHead>
                    <TableHead>Cumulative Dilution</TableHead>
                    <TableHead className="text-right">Concentration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.map((row) => (
                    <TableRow key={row.step}>
                      <TableCell>{row.step}</TableCell>
                      <TableCell>{row.ratio}</TableCell>
                      <TableCell className="text-right font-mono">{Number(row.concentration.toPrecision(6))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-md border bg-muted p-4 grid gap-1 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Final dilution</p>
                <p className="text-lg font-bold">{result.finalDilution}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Final concentration</p>
                <p className="text-lg font-bold">{Number(result.finalConcentration.toPrecision(6))}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Enter a positive dilution factor and 1-20 steps.</p>
        )}
        <p className="text-xs text-muted-foreground">{LAB_PREP_DISCLAIMER}</p>
      </CardContent>
    </Card>
  )
}
