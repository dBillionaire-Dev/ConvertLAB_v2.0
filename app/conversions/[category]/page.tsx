import { notFound } from "next/navigation"
import { PageContainer } from "@/components/page-container"
import { conversionCategories, getConversionCategory } from "@/lib/conversions/registry"
import { ConversionRunner } from "@/components/conversions/conversion-runner"

export function generateStaticParams() {
  return conversionCategories.map((c) => ({ category: c.id }))
}

export default function ConversionCategoryPage({ params }: { params: { category: string } }) {
  const category = getConversionCategory(params.category)
  if (!category) notFound()

  return (
    <PageContainer>
      <h1 className="sr-only">{category.name} Conversion</h1>
      <ConversionRunner category={category} />
    </PageContainer>
  )
}
