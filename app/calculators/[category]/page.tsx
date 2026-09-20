import Link from "next/link"
import { notFound } from "next/navigation"
import { PageContainer } from "@/components/page-container"
import { CALCULATOR_SUBCATEGORY_LABELS, type CalculatorGroup } from "@/lib/calculators/types"
import { calculatorCatalog, getCalculatorsByCategory } from "@/lib/calculators/registry"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function generateStaticParams() {
  return calculatorCatalog.map((c) => ({ category: c.id }))
}

export default async function CalculatorCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: categoryParam } = await params
  const category = calculatorCatalog.find((c) => c.id === categoryParam)
  if (!category) notFound()

  const group = categoryParam as CalculatorGroup
  const tools = getCalculatorsByCategory(group)
  const subcategories = CALCULATOR_SUBCATEGORY_LABELS[group] ?? {}

  if (!Object.keys(subcategories).length) {
    return (
      <PageContainer title={category.label} description={`${tools.length} calculator${tools.length === 1 ? "" : "s"}`}>
        {tools.length ? (
          <div className="grid gap-3">
            {tools.map((tool) => (
              <Link key={tool.id} href={`/calculators/${category.id}/${tool.id}`}>
                <Card className="hover:border-primary/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between gap-4 py-4">
                    <div>
                      <CardTitle className="text-base">{tool.name}</CardTitle>
                      <CardDescription className="mt-1">{tool.description}</CardDescription>
                    </div>
                    {tool.isEstimator ? <Badge variant="secondary">Estimator</Badge> : null}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No calculators have been added to this domain yet.</p>
        )}
      </PageContainer>
    )
  }

  const buckets = Object.entries(subcategories).map(([id, label]) => ({
    id,
    label,
    tools: tools.filter((tool) => tool.subcategory === id),
  }))

  return (
    <PageContainer title={category.label} description="Choose a clinical calculator area.">
      <nav
        aria-label={`${category.label} sections`}
        className="sticky top-16 z-30 mb-6 -mx-4 border-border/80 bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-0 sm:rounded-lg sm:px-2"
      >
        <div className="">
          {buckets.map((bucket) => (
            <a
              key={bucket.id}
              href={`#${bucket.id}`}
              className="shrink-0 whitespace-nowrap rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {bucket.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="space-y-8">
        {buckets.map((bucket) => (
          <section key={bucket.id} id={bucket.id} className="scroll-mt-36 sm:scroll-mt-32">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">{bucket.label}</h2>
                <p className="text-sm text-muted-foreground">
                  {bucket.tools.length
                    ? `${bucket.tools.length} calculator${bucket.tools.length === 1 ? "" : "s"}`
                    : "Planned clinical toolkit"}
                </p>
              </div>
              <Badge variant={bucket.tools.length ? "secondary" : "outline"}>
                {bucket.tools.length ? "Available" : "Planned"}
              </Badge>
            </div>

            {bucket.tools.length ? (
              <div className="grid gap-3">
                {bucket.tools.map((tool) => (
                  <Link key={tool.id} href={`/calculators/${category.id}/${tool.id}`}>
                    <Card className="hover:border-primary/50 transition-colors">
                      <CardHeader className="flex flex-row items-center justify-between gap-4 py-4">
                        <div>
                          <CardTitle className="text-base">{tool.name}</CardTitle>
                          <CardDescription className="mt-1">{tool.description}</CardDescription>
                        </div>
                        {tool.isEstimator ? <Badge variant="secondary">Estimator</Badge> : null}
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Coming in a future phase</CardTitle>
                  <CardDescription>
                    This subsection is part of the ConvertLAB architecture and will be populated with verified calculators and protocol-backed tools.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </section>
        ))}
      </div>
    </PageContainer>
  )
}
