import { PageContainer } from "@/components/page-container"
import { PremiumGate } from "@/components/account/premium-gate"
import { BeerLambertCalculator } from "@/components/spectrophotometry/beer-lambert-calculator"
import { TransmittanceConverter } from "@/components/spectrophotometry/transmittance-converter"
import { CalibrationCurveLazy } from "@/components/spectrophotometry/calibration-curve-lazy"
import { Separator } from "@/components/ui/separator"

export const metadata = {
  title: "Spectrophotometry - Clinexia",
}

export default function SpectrophotometryPage() {
  return (
    <PageContainer
      title="Spectrophotometry"
      description="Beer-Lambert law, transmittance, and calibration curves."
    >
      <PremiumGate category="spectrophotometry">
      <div className="space-y-8">
        <BeerLambertCalculator />

        <Separator />

        <TransmittanceConverter />

        <Separator />

        <CalibrationCurveLazy />
      </div>
      </PremiumGate>
    </PageContainer>
  )
}
