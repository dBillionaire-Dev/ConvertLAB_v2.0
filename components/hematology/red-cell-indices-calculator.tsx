"use client"

import { useState } from "react"
import { AlertTriangle, Copy, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { mcvCalculator, mchCalculator, mchcCalculator } from "@/lib/calculators/definitions/hematology"
import { CALCULATION_DISCLAIMER } from "@/lib/calculators/types"
import { recordUsage } from "@/lib/recently-used"
import { useHistory } from "@/lib/history/use-history"
import type { CalculationResult, CalculatorDefinition } from "@/lib/calculators/types"

interface IndexResult {
  label: string
  result: CalculationResult | null
  error: string | null
}

export function RedCellIndicesCalculator() {
  const [hgb, setHgb] = useState("14")
  const [hct, setHct] = useState("42")
  const [rbc, setRbc] = useState("4.8")
  const [results, setResults] = useState<IndexResult[] | null>(null)
  const { toast } = useToast()
  const { record } = useHistory()

  const handleCalculate = () => {
    const inputs = { hgb, hct, rbc }

    const run = (label: string, def: CalculatorDefinition): IndexResult => {
      try {
        return { label, result: def.calculate(inputs), error: null }
      } catch (err) {
        return { label, result: null, error: err instanceof Error ? err.message : "Unable to calculate" }
      }
    }

    const computed = [run("MCV", mcvCalculator), run("MCH", mchCalculator), run("MCHC", mchcCalculator)]
    setResults(computed)

    recordUsage("red-cell-indices")
    for (const item of computed) {
      if (item.result) {
        record({
          calculatorId: "red-cell-indices",
          calculatorName: `Red Cell Indices, ${item.label}`,
          category: "hematology",
          inputs,
          result: item.result.value,
          unit: item.result.unit,
        })
      }
    }
  }

  const resultText = () => {
    if (!results) return ""
    const lines = [
      "ConvertLAB, Red Cell Indices",
      "",
      `Hemoglobin: ${hgb} g/dL`,
      `Hematocrit: ${hct} %`,
      `RBC count: ${rbc} million/µL`,
      "",
      ...results.filter((r) => r.result).map((r) => `${r.label}: ${r.result!.display}`),
    ]
    return lines.join("\n")
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resultText())
      toast({ description: "Results copied to clipboard." })
    } catch {
      toast({ description: "Couldn't copy, try selecting the text manually." })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Red Cell Indices</CardTitle>
          <CardDescription>Enter Hemoglobin, Hematocrit, and RBC count once to get MCV, MCH, and MCHC together.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="hgb">Hemoglobin</Label>
              <div className="relative">
                <Input id="hgb" type="number" inputMode="decimal" step="0.1" value={hgb} onChange={(e) => setHgb(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCalculate()} className="pr-12" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">g/dL</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hct">Hematocrit</Label>
              <div className="relative">
                <Input id="hct" type="number" inputMode="decimal" step="0.1" value={hct} onChange={(e) => setHct(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCalculate()} className="pr-8" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rbc">RBC count</Label>
              <div className="relative">
                <Input id="rbc" type="number" inputMode="decimal" step="0.01" value={rbc} onChange={(e) => setRbc(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCalculate()} className="pr-24" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">million/µL</span>
              </div>
            </div>
          </div>

          <Button onClick={handleCalculate} className="w-full sm:w-auto">
            Calculate
          </Button>
        </CardContent>
      </Card>

      {results ? (
        <Card aria-live="polite">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              {results.map((item) => (
                <div key={item.label} className="rounded-md border p-4">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  {item.error ? (
                    <div className="flex items-start gap-1.5 text-sm text-destructive">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
                      <span>{item.error}</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-xl font-bold">{item.result!.display}</p>
                      {item.result!.warnings?.length ? (
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 flex items-start gap-1">
                          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden />
                          {item.result!.warnings[0]}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              ))}
            </div>

            <Separator />
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Formulas</h4>
              <div className="text-sm font-mono bg-muted rounded-md p-3 space-y-1">
                <div>MCV = (Hct x 10) / RBC</div>
                <div>MCH = (Hgb x 10) / RBC</div>
                <div>MCHC = (Hgb / Hct) x 100</div>
              </div>
            </div>

            <Separator />
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-1.5" /> Copy
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast({ description: "Saved to history." })}>
                <Save className="h-4 w-4 mr-1.5" /> Save
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">{CALCULATION_DISCLAIMER}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
