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

const RED_CELL_INDEX_IDS = new Set(["mcv", "mch", "mchc"])

export default async function CalculatorCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category: categoryParam } = await params

  const category = calculatorCategories.find(
    (c) => c.id === categoryParam
  )

  if (!category) {
    notFound()
  }


  const allTools = getCalculatorsByCategory(categoryParam as CalculatorGroup)
  const isHematology = categoryParam === "hematology"
  const tools = isHematology ? allTools.filter((t) => !RED_CELL_INDEX_IDS.has(t.id)) : allTools
  const toolCount = isHematology ? tools.length : tools.length

  return (
    <PageContainer title={category.label} description={`${toolCount} calculator${toolCount === 1 ? "" : "s"}`}>
      <div className="grid gap-3">

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
