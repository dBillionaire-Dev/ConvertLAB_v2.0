import { PageContainer } from "@/components/page-container"
import { PercentageSolutionCalculator } from "@/components/lab-tools/percentage-solution-calculator"

export const metadata = { title: "Percentage Solution - ConvertLAB" }

export default function PercentageSolutionPage() {
  return (
    <PageContainer>
      <h1 className="sr-only">Percentage Solution Calculator</h1>
      <PercentageSolutionCalculator />
    </PageContainer>
  )
}
