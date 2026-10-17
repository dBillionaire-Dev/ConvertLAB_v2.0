import { PageContainer } from "@/components/page-container"
import { PremiumGate } from "@/components/account/premium-gate"
import { SerialDilutionCalculator } from "@/components/lab-tools/serial-dilution-calculator"

export const metadata = { title: "Serial Dilution - Clinexia" }

export default function SerialDilutionPage() {
  return (
    <PageContainer>
      <h1 className="sr-only">Serial Dilution Calculator</h1>
      <PremiumGate category="lab-solutions"><SerialDilutionCalculator /></PremiumGate>
    </PageContainer>
  )
}
