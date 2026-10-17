import { PageContainer } from "@/components/page-container"
import { PremiumGate } from "@/components/account/premium-gate"
import { RedCellIndicesCalculator } from "@/components/hematology/red-cell-indices-calculator"

export const metadata = { title: "Red Cell Indices - Clinexia" }

export default function RedCellIndicesPage() {
  return (
    <PageContainer>
      <h1 className="sr-only">Red Cell Indices (MCV, MCH, MCHC)</h1>
      <PremiumGate category="hematology"><RedCellIndicesCalculator /></PremiumGate>
    </PageContainer>
  )
}
