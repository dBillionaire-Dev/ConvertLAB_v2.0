import Link from "next/link"
import { PageContainer } from "@/components/page-container"
import { calculatorCategories, getCalculatorsByCategory } from "@/lib/calculators/registry"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export const metadata = { title: "Calculators - ConvertLAB" }

export default function CalculatorsPage() {
  return (
    <PageContainer title="Calculators" description="Clinical, renal, chemistry, and hematology calculators.">
      <div className="grid gap-4 sm:grid-cols-2">
        {calculatorCategories.map((cat) => {
          const tools = getCalculatorsByCategory(cat.id)
          return (
            <Link key={cat.id} href={`/calculators/${cat.id}`}>
              <Card className="h-full hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">{cat.label}</CardTitle>
                  <CardDescription>{cat.count} tool{cat.count === 1 ? "" : "s"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {tools.map((t) => t.shortName ?? t.name).join(", ")}
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
