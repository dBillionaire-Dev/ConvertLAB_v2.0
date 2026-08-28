import Link from "next/link"
import { notFound } from "next/navigation"
import { PageContainer } from "@/components/page-container"
import { getCalculatorsByCategory, calculatorCategories } from "@/lib/calculators/registry"
import type { CalculatorGroup } from "@/lib/calculators/types"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function generateStaticParams() {
  return calculatorCategories.map((c) => ({ category: c.id }))
}

// MCV/MCH/MCHC are consolidated into one combined tool (enter Hgb/Hct/RBC
// once, get all three) — hide their separate tiles here in favor of that,
// while leaving the individual calculator pages themselves reachable
// (search, formula reference, direct links) for anyone who wants just one.
const RED_CELL_INDEX_IDS = new Set(["mcv", "mch", "mchc"])

export default function CalculatorCategoryPage({ params }: { params: { category: string } }) {
  const category = calculatorCategories.find((c) => c.id === params.category)
  if (!category) notFound()

  const allTools = getCalculatorsByCategory(params.category as CalculatorGroup)
  const isHematology = params.category === "hematology"
  const tools = isHematology ? allTools.filter((t) => !RED_CELL_INDEX_IDS.has(t.id)) : allTools
  const toolCount = isHematology ? tools.length + 1 : tools.length

  return (
    <PageContainer title={category.label} description={`${toolCount} calculator${toolCount === 1 ? "" : "s"}`}>
      <div className="grid gap-3">
        {isHematology ? (
          <Link href="/calculators/hematology/red-cell-indices">
            <Card className="hover:border-primary/50 transition-colors border-primary/30">
              <CardHeader className="py-4">
                <CardTitle className="text-base">Red Cell Indices</CardTitle>
                <CardDescription className="mt-1">
                  MCV, MCH, and MCHC together, enter Hemoglobin, Hematocrit, and RBC count once.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ) : null}

        {tools.map((tool) => (
          <Link key={tool.id} href={`/calculators/${category.id}/${tool.id}`}>
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between gap-4 py-4">
                <div>
                  <CardTitle className="text-base">{tool.name}</CardTitle>
                  <CardDescription className="mt-1">{tool.description}</CardDescription>
                </div>
                {tool.isEstimator ? <Badge variant="secondary" className="shrink-0">Estimator</Badge> : null}
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  )
}
