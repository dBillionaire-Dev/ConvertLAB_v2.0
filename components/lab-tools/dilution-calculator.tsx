"use client"

import { useMemo, useState, type ChangeEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LAB_PREP_DISCLAIMER } from "@/lib/calculators/types"

type FieldId = "c1" | "v1" | "c2" | "v2"

export function DilutionCalculator() {
  const [values, setValues] = useState<Record<FieldId, string>>({
    c1: "",
    v1: "",
    c2: "",
    v2: "",
  })

  const parsed = useMemo(() => {
    const entries = Object.entries(values) as [FieldId, string][]
    const blank = entries.filter(([, v]) => v.trim() === "")
    const filled = entries.filter(([, v]) => v.trim() !== "")

    if (blank.length !== 1) {
      return { error: blank.length === 0 ? "Leave exactly one field blank to solve for it." : "Enter three of the four values, leaving one blank.", result: null as null | { field: FieldId; value: number } }
    }

    const numeric: Partial<Record<FieldId, number>> = {}
    for (const [id, v] of filled) {
      const n = Number.parseFloat(v)
      if (!Number.isFinite(n)) return { error: `Invalid number for ${id.toUpperCase()}`, result: null }
      numeric[id] = n
    }

    const missing = blank[0][0]
    let solved: number
    try {
      if (missing === "c1") solved = (numeric.c2! * numeric.v2!) / numeric.v1!
      else if (missing === "v1") solved = (numeric.c2! * numeric.v2!) / numeric.c1!
      else if (missing === "c2") solved = (numeric.c1! * numeric.v1!) / numeric.v2!
      else solved = (numeric.c1! * numeric.v1!) / numeric.c2!
    } catch {
      return { error: "Unable to solve, check for a zero value.", result: null }
    }

    if (!Number.isFinite(solved)) return { error: "Unable to solve, check for a zero value.", result: null }

    return { error: null as string | null, result: { field: missing, value: solved } }
  }, [values])

  const diluentRequired =
    parsed.result && (parsed.result.field === "v1" || values.v1) && (parsed.result.field === "v2" || values.v2)
      ? (parsed.result.field === "v2" ? parsed.result.value : Number.parseFloat(values.v2)) -
        (parsed.result.field === "v1" ? parsed.result.value : Number.parseFloat(values.v1))
      : null

  const set = (id: FieldId) => (e: ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [id]: e.target.value }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>C1V1 = C2V2 Dilution</CardTitle>
        <CardDescription>Leave exactly one field blank, ConvertLAB will solve for it.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="c1">Stock concentration (C1)</Label>
            <Input id="c1" type="number" inputMode="decimal" value={values.c1} onChange={set("c1")} placeholder="e.g. 10 M" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v1">Stock volume (V1)</Label>
            <Input id="v1" type="number" inputMode="decimal" value={values.v1} onChange={set("v1")} placeholder="Leave blank to solve" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c2">Desired concentration (C2)</Label>
            <Input id="c2" type="number" inputMode="decimal" value={values.c2} onChange={set("c2")} placeholder="e.g. 1 M" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v2">Final volume (V2)</Label>
            <Input id="v2" type="number" inputMode="decimal" value={values.v2} onChange={set("v2")} placeholder="e.g. 500 mL" />
          </div>
        </div>

        {parsed.error ? (
          <p className="text-sm text-muted-foreground">{parsed.error}</p>
        ) : parsed.result ? (
          <div className="rounded-md border bg-muted p-4 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{parsed.result.field.toUpperCase()}</p>
            <p className="text-2xl font-bold">{Number(parsed.result.value.toFixed(4))}</p>
            {diluentRequired !== null && Number.isFinite(diluentRequired) ? (
              <p className="text-sm text-muted-foreground">
                Diluent required: {Number(diluentRequired.toFixed(4))} (V2 - V1, in your volume units)
              </p>
            ) : null}
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground">
          Units are up to you (e.g. M for concentration, mL for volume), just keep concentration units consistent
          with each other and volume units consistent with each other.
        </p>
        <p className="text-xs text-muted-foreground">{LAB_PREP_DISCLAIMER}</p>
      </CardContent>
    </Card>
  )
}
