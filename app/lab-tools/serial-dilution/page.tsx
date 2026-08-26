import { PageContainer } from "@/components/page-container"
import { SerialDilutionCalculator } from "@/components/lab-tools/serial-dilution-calculator"

export const metadata = { title: "Serial Dilution - ConvertLAB" }

export default function SerialDilutionPage() {
  return (
    <PageContainer>
      <h1 className="sr-only">Serial Dilution Calculator</h1>
      <SerialDilutionCalculator />
    </PageContainer>
  )
}
