import { notFound } from "next/navigation"
import { PageContainer } from "@/components/page-container"
import { conversionCategories, getConversionCategory } from "@/lib/conversions/registry"
import { ConversionRunner } from "@/components/conversions/conversion-runner"

export function generateStaticParams() {
  return conversionCategories.map((c) => ({ category: c.id }))
}

export default async function ConversionCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category: categoryParam } = await params

  const category = getConversionCategory(categoryParam)

  if (!category) {
    notFound()
  }

  return (
    <PageContainer>
      <h1 className="sr-only">{category.name} Conversion</h1>
      <ConversionRunner category={category} />
    </PageContainer>
  )
}
