import { PageContainer } from "@/components/page-container"
import { getCalculatorsByCategory } from "@/lib/calculators/registry"
import { CalculatorRunner } from "@/components/calculators/calculator-runner"
import { McFarlandReference } from "@/components/lab-tools/mcfarland-reference"
import { Separator } from "@/components/ui/separator"

export const metadata = { title: "Microbiology - ConvertLAB" }

export default function MicrobiologyPage() {
  const tools = getCalculatorsByCategory("microbiology")

  return (
    <PageContainer title="Microbiology" description="CFU estimation, dilution factor, and turbidity reference.">
      <div className="space-y-8">
        {tools.map((tool, i) => (
          <div key={tool.id}>
            <CalculatorRunner calculatorId={tool.id} />
            {i < tools.length - 1 ? <Separator className="mt-8" /> : null}
          </div>
        ))}
        <Separator />
        <McFarlandReference />
      </div>
    </PageContainer>
  )
}
