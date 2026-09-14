import Link from "next/link"
import { notFound } from "next/navigation"
import { PageContainer } from "@/components/page-container"
import { getCalculatorsByCategory, calculatorCategories } from "@/lib/calculators/registry"
import type { CalculatorGroup } from "@/lib/calculators/types"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const toolCount = tools.length

  const antimalariaIds = new Set([
    "artemether-lumefantrine-uncomplicated-malaria",
    "artesunate-amodiaquine-uncomplicated-malaria",
    "artesunate-mefloquine-uncomplicated-malaria",
    "dihydroartemisinin-piperaquine-uncomplicated-malaria",
    "artesunate-sulfadoxine-pyrimethamine-uncomplicated-malaria",
    "artesunate-pyronaridine-uncomplicated-malaria",
    "artesunate-severe-malaria",
  ])

  const renalAdjustmentIds = new Set([
    "amoxicillin-clavulanate-renal-adjustment",
    "ciprofloxacin-renal-adjustment",
    "cefotaxime-renal-adjustment",
    "cefuroxime-axetil-renal-adjustment",
    "meropenem-renal-adjustment",
  ])

  const antibioticIds = new Set([
    "amoxicillin-pediatric-dose",
    "amoxicillin-clavulanate-pediatric-dose",
    "azithromycin-pediatric-dose",
    "ceftriaxone-pediatric-dose",
    "cephalexin-pediatric-dose",
    "metronidazole-pediatric-dose",
    "cefuroxime-surgical-prophylaxis",
    "ampicillin-pediatric-dose",
    "cefotaxime-pediatric-dose",
    "cloxacillin-pediatric-dose",
    "ciprofloxacin-pediatric-dose",
    "gentamicin-pediatric-dose",
    "meropenem-pediatric-dose",
    "vancomycin-pediatric-dose",
    "vancomycin-auc24-target-check",
    "gentamicin-peak-trough-check",
    "who-young-infant-sepsis-pneumonia",
    "who-young-infant-meningitis",
  "piperacillin-tazobactam-pediatric-dose",
  "clindamycin-pediatric-dose",
  "cefazolin-pediatric-dose",
  ])

  const antimalariaTools = tools.filter((tool) => antimalariaIds.has(tool.id))
  const antibioticTools = tools.filter((tool) => antibioticIds.has(tool.id) && !renalAdjustmentIds.has(tool.id))
  const renalAdjustmentTools = tools.filter((tool) => renalAdjustmentIds.has(tool.id))
  const generalDosingTools = tools.filter((tool) => !antimalariaIds.has(tool.id) && !antibioticIds.has(tool.id) && !renalAdjustmentIds.has(tool.id))

  const renderTools = (items: typeof tools) => (
    <div className="grid gap-3">
      {items.map((tool) => (
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
  )

  return (
    <PageContainer title={category.label} description={`${toolCount} calculator${toolCount === 1 ? "" : "s"}`}>
      {categoryParam === "dosing" ? (
        <Tabs defaultValue="general" className="w-full">
          <TabsList
            className="grid h-auto w-full grid-cols-2 gap-1 md:grid-cols-4"
            aria-label="Drug dosing categories"
          >
            <TabsTrigger
              value="general"
              className="min-w-0 whitespace-normal px-2 py-1.5 text-center text-[11px] leading-tight md:px-2 md:py-1 md:text-xs"
            >
              General Drug Dosing
            </TabsTrigger>
            <TabsTrigger
              value="antimalaria"
              className="min-w-0 whitespace-normal px-2 py-1.5 text-center text-[11px] leading-tight md:px-2 md:py-1 md:text-xs"
            >
              AntiMalaria Dosing
            </TabsTrigger>
            <TabsTrigger
              value="antibiotic"
              className="min-w-0 whitespace-normal px-2 py-1.5 text-center text-[11px] leading-tight md:px-2 md:py-1 md:text-xs"
            >
              Antibiotic Dosing
            </TabsTrigger>
            <TabsTrigger
              value="renal"
              className="min-w-0 whitespace-normal px-2 py-1.5 text-center text-[11px] leading-tight md:px-2 md:py-1 md:text-xs"
            >
              Renal Dose Adjustment
            </TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            {renderTools(generalDosingTools)}
          </TabsContent>
          <TabsContent value="antimalaria">
            {renderTools(antimalariaTools)}
          </TabsContent>
          <TabsContent value="antibiotic">
            {renderTools(antibioticTools)}
          </TabsContent>
          <TabsContent value="renal">
            {renderTools(renalAdjustmentTools)}
          </TabsContent>
        </Tabs>
      ) : (
        renderTools(tools)
      )}
    </PageContainer>
  )
}
