import { notFound } from "next/navigation"
import { PageContainer } from "@/components/page-container"
import { calculators, getCalculatorById } from "@/lib/calculators/registry"
import { CalculatorRunner } from "@/components/calculators/calculator-runner"

export function generateStaticParams() {
  return calculators.map((c) => ({ category: c.category, id: c.id }))
}

export default async function CalculatorPage({
    params,
  }: {
    params: Promise<{ category: string; id: string }>
  }) {
    const { category, id } = await params

    const definition = getCalculatorById(id)

    if (!definition || definition.category !== category) {
      notFound()
    }

  return (
    <PageContainer>
      <h1 className="sr-only">{definition.name}</h1>
      <CalculatorRunner calculatorId={definition.id} />
    </PageContainer>
  )
}
