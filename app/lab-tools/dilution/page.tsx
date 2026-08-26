import { PageContainer } from "@/components/page-container"
import { DilutionCalculator } from "@/components/lab-tools/dilution-calculator"

export const metadata = { title: "Dilution Calculator - ConvertLAB" }

export default function DilutionPage() {
  return (
    <PageContainer>
      <h1 className="sr-only">C1V1 = C2V2 Dilution Calculator</h1>
      <DilutionCalculator />
    </PageContainer>
  )
}
