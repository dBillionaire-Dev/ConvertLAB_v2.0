import Link from "next/link"
import { PageContainer } from "@/components/page-container"
import { calculatorCatalog, getCalculatorsByCategory } from "@/lib/calculators/registry"
import { CALCULATOR_SUBCATEGORY_LABELS } from "@/lib/calculators/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export const metadata = { title: "Calculators - ConvertLAB" }

export default function CalculatorsPage() {
  return (
    <PageContainer title="Calculators" description="General laboratory, drug dosing, oncology, hematology, cardiovascular, and transplant calculators.">
      <div className="grid gap-4 sm:grid-cols-2">
        {[...calculatorCatalog]
          .sort((a, b) => a.label.localeCompare(b.label))
          .map((cat) => {
          const tools = getCalculatorsByCategory(cat.id)
          return (
            <Link key={cat.id} href={`/calculators/${cat.id}`}>
              <Card className="h-full hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">{cat.label}</CardTitle>
                  <CardDescription>{cat.count > 0 ? `${cat.count} tool${cat.count === 1 ? "" : "s"}` : "Planned"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {Object.keys(CALCULATOR_SUBCATEGORY_LABELS[cat.id]).length
                      ? Object.values(CALCULATOR_SUBCATEGORY_LABELS[cat.id]).join(" · ")
                      : cat.count > 0
                        ? tools.map((t) => t.shortName ?? t.name).join(", ")
                        : "Planned clinical domain"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </PageContainer>
  )
}
