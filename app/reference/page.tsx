import { PageContainer } from "@/components/page-container"
import { calculatorCategories, getCalculatorsByCategory } from "@/lib/calculators/registry"
import { conversionCategories } from "@/lib/conversions/registry"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export const metadata = { title: "Reference - ConvertLAB" }

export default function ReferencePage() {
  return (
    <PageContainer title="Reference" description="Formulas and unit definitions used throughout ConvertLAB.">
      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-3">Formulas</h2>
          <div className="space-y-4">
            {calculatorCategories.map((cat) => (
              <Card key={cat.id}>
                <CardHeader>
                  <CardTitle className="text-base">{cat.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {getCalculatorsByCategory(cat.id).map((tool) => (
                    <div key={tool.id}>
                      <p className="text-sm font-medium">{tool.name}</p>
                      {tool.formula ? (
                        <pre className="whitespace-pre-wrap text-xs font-mono bg-muted rounded-md p-2 mt-1">
                          {tool.formula}
                        </pre>
                      ) : null}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        <section>
          <h2 className="text-lg font-semibold mb-3">Lab Tools & Spectrophotometry</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">C1V1 = C2V2 Dilution</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-xs font-mono bg-muted rounded-md p-2">
                  C1 x V1 = C2 x V2
                </pre>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Percentage Solutions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <pre className="whitespace-pre-wrap text-xs font-mono bg-muted rounded-md p-2">
                  {"% w/v = g solute / 100 mL solution\n% v/v = mL solute / 100 mL solution\n% w/w = g solute / 100 g solution"}
                </pre>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Beer-Lambert Law</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-xs font-mono bg-muted rounded-md p-2">A = ε b c</pre>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Absorbance ↔ %Transmittance</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-xs font-mono bg-muted rounded-md p-2">A = -log₁₀(T)</pre>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        <section>
          <h2 className="text-lg font-semibold mb-3">Unit Reference</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {conversionCategories.map((cat) => (
              <Card key={cat.id}>
                <CardHeader>
                  <CardTitle className="text-base">{cat.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {cat.units.map((u) => (
                      <li key={u.id} className="flex justify-between">
                        <span>{u.name}</span>
                        <span className="font-mono">{u.symbol}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </PageContainer>
  )
}
