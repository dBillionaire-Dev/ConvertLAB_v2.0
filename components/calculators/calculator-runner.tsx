"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Calculator, Copy, Save, Share2, Star, AlertTriangle, FileDown } from "lucide-react"
import type { CalculatorDefinition, CalculationResult } from "@/lib/calculators/types"
import { CALCULATION_DISCLAIMER } from "@/lib/calculators/types"
import { getCalculatorById, getRelatedCalculators } from "@/lib/calculators/registry"
import { CalculatorField } from "./calculator-field"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { isFavorite, toggleFavorite } from "@/lib/favorites"
import { recordUsage } from "@/lib/recently-used"
import { useHistory } from "@/lib/history/use-history"
import { cn } from "@/lib/utils"

function defaultValues(def: CalculatorDefinition | undefined): Record<string, string> {
  if (!def) return {}
  const values: Record<string, string> = {}
  for (const input of def.inputs) {
    // Select inputs need a real pre-selected value (there's no equivalent of a
    // placeholder for a dropdown). Number inputs start empty — their
    // defaultValue is shown as a placeholder hint instead (see CalculatorField).
    values[input.id] = input.kind === "select" && input.defaultValue !== undefined ? String(input.defaultValue) : ""
  }
  return values
}

export function CalculatorRunner({ calculatorId }: { calculatorId: string }) {
  const definition = getCalculatorById(calculatorId)
  const [values, setValues] = useState<Record<string, string>>(() => defaultValues(definition))
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [favorite, setFavorite] = useState(() => (definition ? isFavorite(definition.id) : false))
  const { toast } = useToast()
  const { record } = useHistory()
  const related = useMemo(() => (definition ? getRelatedCalculators(definition) : []), [definition])

  if (!definition) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-2">
          <p className="font-medium">Calculator not found</p>
          <p className="text-sm text-muted-foreground">
            This tool may have moved or the link may be out of date.
          </p>
        </CardContent>
      </Card>
    )
  }

  const handleChange = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }))
  }

  const resolvedInputs = definition.inputs.map((input) => {
    const raw = values[input.id] ?? ""
    let display = raw
    if (input.kind === "select") {
      display = input.options?.find((opt) => opt.value === raw)?.label ?? raw
    } else if (input.unit && raw !== "") {
      display = `${raw} ${input.unit}`
    }
    return { label: input.label, display: display || "" }
  })

  const handleCalculate = () => {
    setError(null)
    try {
      const parsed: Record<string, number | string> = {}
      for (const input of definition.inputs) {
        const raw = values[input.id]
        if (input.kind === "number") {
          parsed[input.id] = raw === "" ? "" : raw
        } else {
          parsed[input.id] = raw
        }
      }
      const calcResult = definition.calculate(parsed)
      setResult(calcResult)
      recordUsage(definition.id)
      record({
        calculatorId: definition.id,
        calculatorName: definition.name,
        category: definition.category,
        inputs: values,
        result: calcResult.value,
        unit: calcResult.unit,
      })
    } catch (err) {
      setResult(null)
      setError(err instanceof Error ? err.message : "Unable to calculate result")
    }
  }

  const resultText = () => {
    if (!result) return ""
    const lines = [
      `ConvertLAB, ${definition.name}`,
      "",
      `Result: ${result.display}`,
      "",
      "Inputs",
      ...resolvedInputs.map((input) => `${input.label}: ${input.display}`),
    ]
    if (definition.formula) lines.push("", `Formula: ${definition.formula}`)
    return lines.join("\n")
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resultText())
      toast({ description: "Result copied to clipboard." })
    } catch {
      toast({ description: "Couldn't copy, try selecting the text manually." })
    }
  }

  const handleShare = async () => {
    const text = resultText()
    if (navigator.share) {
      try {
        await navigator.share({ title: definition.name, text })
      } catch {
        // user cancelled — no-op
      }
    } else {
      handleCopy()
    }
  }

  const handleExportPdf = () => {
    // Uses the browser's native print-to-PDF rather than a client-side PDF
    // library — no extra dependency, works fully offline, and every browser
    // supports "Save as PDF" from the print dialog. A dedicated print
    // stylesheet hides site chrome and shows only the result.
    window.print()
  }

  const handleFavorite = () => {
    const nowFavorite = toggleFavorite(definition.id)
    setFavorite(nowFavorite)
  }

  return (
    <div className="space-y-6">
      <Card className="print:hidden">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" aria-hidden />
              <CardTitle>{definition.name}</CardTitle>
              {definition.isEstimator ? <Badge variant="secondary">Estimator</Badge> : null}
            </div>
            <CardDescription className="mt-1.5">{definition.description}</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
            onClick={handleFavorite}
          >
            <Star className={cn("h-5 w-5", favorite && "fill-yellow-400 text-yellow-400")} />
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {definition.inputs.map((input) => (
              <CalculatorField
                key={input.id}
                input={input}
                value={values[input.id] ?? ""}
                onChange={(v) => handleChange(input.id, v)}
                onEnter={handleCalculate}
              />
            ))}
          </div>

          {error ? (
            <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
              <span>{error}</span>
            </div>
          ) : null}

          <Button onClick={handleCalculate} className="w-full sm:w-auto">
            Calculate
          </Button>
        </CardContent>
      </Card>

      {result ? (
        <Card aria-live="polite">
          <CardHeader>
            {/* Print-only masthead — site header/nav is hidden when printing */}
            <div className="hidden print:block mb-2">
              <p className="font-bold">ConvertLAB</p>
              <p className="text-xs text-muted-foreground">{definition.name} — {new Date().toLocaleDateString()}</p>
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="text-3xl font-bold tracking-tight">{result.display}</div>

            {result.secondary?.length ? (
              <dl className="grid gap-1.5 text-sm">
                {result.secondary.map((field) => (
                  <div key={field.label} className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{field.label}</dt>
                    <dd className="font-medium">{field.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {result.warnings?.length ? (
              <div className="space-y-1.5">
                {result.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-md border border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 p-2.5 text-sm text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <div>
              <Separator className="mb-3" />
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Inputs</h4>
              <dl className="grid gap-1.5 text-sm">
                {resolvedInputs.map((input) => (
                  <div key={input.label} className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{input.label}</dt>
                    <dd className="font-medium">{input.display}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {definition.formula ? (
              <div>
                <Separator className="mb-3" />
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Formula</h4>
                <pre className="whitespace-pre-wrap text-sm font-mono bg-muted rounded-md p-3">{definition.formula}</pre>
              </div>
            ) : null}

            {result.calculationSteps?.length ? (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Calculation</h4>
                <div className="text-sm font-mono bg-muted rounded-md p-3 space-y-1">
                  {result.calculationSteps.map((step, i) => (
                    <div key={i}>{step}</div>
                  ))}
                </div>
              </div>
            ) : null}

            {result.interpretation ? (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Interpretation</h4>
                <p className="text-sm">{result.interpretation}</p>
              </div>
            ) : null}

            {(definition.notes?.length || definition.limitations?.length) ? (
              <div>
                <Separator className="mb-3" />
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes</h4>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  {definition.notes?.map((n, i) => (
                    <li key={`n-${i}`}>{n}</li>
                  ))}
                  {definition.limitations?.map((n, i) => (
                    <li key={`l-${i}`}>{n}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Separator />
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-1.5" /> Copy
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast({ description: "Saved to history." })}>
                <Save className="h-4 w-4 mr-1.5" /> Save
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1.5" /> Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPdf}>
                <FileDown className="h-4 w-4 mr-1.5" /> Export PDF
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">{CALCULATION_DISCLAIMER}</p>
          </CardContent>
        </Card>
      ) : null}

      {related.length ? (
        <div className="print:hidden">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Related Tools</h3>
          <div className="flex flex-wrap gap-2">
            {related.map((tool) => (
              <Link key={tool.id} href={`/calculators/${tool.category}/${tool.id}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                  {tool.shortName ?? tool.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
