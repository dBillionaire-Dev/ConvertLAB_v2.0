import { PageContainer } from "@/components/page-container"
import { BeerLambertCalculator } from "@/components/spectrophotometry/beer-lambert-calculator"
import { TransmittanceConverter } from "@/components/spectrophotometry/transmittance-converter"
import { CalibrationCurveTool } from "@/components/spectrophotometry/calibration-curve-tool"
import { Separator } from "@/components/ui/separator"

export const metadata = { title: "Spectrophotometry - ConvertLAB" }

export default function SpectrophotometryPage() {
  return (
    <PageContainer title="Spectrophotometry" description="Beer-Lambert law, transmittance, and calibration curves.">
      <div className="space-y-8">
        <BeerLambertCalculator />
        <Separator />
        <TransmittanceConverter />
        <Separator />
        <CalibrationCurveTool />
      </div>
    </PageContainer>
  )
}
