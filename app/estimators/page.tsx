import Link from "next/link"
import { PageContainer } from "@/components/page-container"
import { calculators } from "@/lib/calculators/registry"
import { CALCULATOR_CATEGORY_LABELS } from "@/lib/calculators/types"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata = { title: "Estimators - ConvertLAB" }

export default function EstimatorsPage() {
  const estimators = calculators.filter((c) => c.isEstimator)

  return (
    <PageContainer
      title="Estimators"
      description="Formula-based estimates (e.g. BSA, eGFR, BMR) & approximations, not measured values."
    >
      <div className="grid gap-3">
        {estimators.map((tool) => (
          <Link key={tool.id} href={`/calculators/${tool.category}/${tool.id}`}>
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between gap-4 py-4">
                <div>
                  <CardTitle className="text-base">{tool.name}</CardTitle>
                  <CardDescription className="mt-1">{tool.description}</CardDescription>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {CALCULATOR_CATEGORY_LABELS[tool.category]}
                </Badge>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  )
}
