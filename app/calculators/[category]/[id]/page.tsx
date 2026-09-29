import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageContainer } from "@/components/page-container"
import { calculators, getCalculatorById } from "@/lib/calculators/registry"
import { CalculatorRunner } from "@/components/calculators/calculator-runner"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; id: string }>
}): Promise<Metadata> {
  const { category, id } = await params
  const definition = getCalculatorById(id)
  if (!definition || definition.category !== category) return {}

  const title = `${definition.name} Calculator`
  const description = `${definition.description} Use the free ConvertLAB ${definition.name.toLowerCase()} calculator.`
  const path = `/calculators/${category}/${id}`

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title: `${title} | ConvertLAB`,
      description,
      url: path,
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ConvertLAB" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ConvertLAB`,
      description,
      images: ["/og-image.png"],
    },
  }
}

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
