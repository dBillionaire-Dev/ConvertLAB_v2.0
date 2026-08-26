import { notFound } from "next/navigation"
import { PageContainer } from "@/components/page-container"
import { calculators, getCalculatorById } from "@/lib/calculators/registry"
import { CalculatorRunner } from "@/components/calculators/calculator-runner"

export function generateStaticParams() {
  return calculators.map((c) => ({ category: c.category, id: c.id }))
}

export default function CalculatorPage({ params }: { params: { category: string; id: string } }) {
  const definition = getCalculatorById(params.id)
  if (!definition || definition.category !== params.category) notFound()

  return (
    <PageContainer>
      <h1 className="sr-only">{definition.name}</h1>
      <CalculatorRunner calculatorId={definition.id} />
    </PageContainer>
  )
}
