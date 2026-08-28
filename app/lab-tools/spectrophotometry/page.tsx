// import dynamic from "next/dynamic"
// import { PageContainer } from "@/components/page-container"
// import { BeerLambertCalculator } from "@/components/spectrophotometry/beer-lambert-calculator"
// import { TransmittanceConverter } from "@/components/spectrophotometry/transmittance-converter"
// import { Separator } from "@/components/ui/separator"
// import { Skeleton } from "@/components/ui/skeleton"

// // Lazy-loaded: recharts (used only by the calibration curve chart) is a
// // sizeable client dependency. Deferring it keeps it out of this route's
// // initial JS payload — it loads only once the user scrolls to/renders it.
// const CalibrationCurveTool = dynamic(
//   () => import("@/components/spectrophotometry/calibration-curve-tool").then((m) => m.CalibrationCurveTool),
//   { loading: () => <Skeleton className="h-[420px] w-full rounded-lg" />, ssr: false },
// )

// export const metadata = { title: "Spectrophotometry - ConvertLAB" }

// export default function SpectrophotometryPage() {
//   return (
//     <PageContainer title="Spectrophotometry" description="Beer-Lambert law, transmittance, and calibration curves.">
//       <div className="space-y-8">
//         <BeerLambertCalculator />
//         <Separator />
//         <TransmittanceConverter />
//         <Separator />
//         <CalibrationCurveTool />
//       </div>
//     </PageContainer>
//   )
// }

import { PageContainer } from "@/components/page-container"
import { BeerLambertCalculator } from "@/components/spectrophotometry/beer-lambert-calculator"
import { TransmittanceConverter } from "@/components/spectrophotometry/transmittance-converter"
import { CalibrationCurveLazy } from "@/components/spectrophotometry/calibration-curve-lazy"
import { Separator } from "@/components/ui/separator"

export const metadata = {
  title: "Spectrophotometry - ConvertLAB",
}

export default function SpectrophotometryPage() {
  return (
    <PageContainer
      title="Spectrophotometry"
      description="Beer-Lambert law, transmittance, and calibration curves."
    >
      <div className="space-y-8">
        <BeerLambertCalculator />

        <Separator />

        <TransmittanceConverter />

        <Separator />

        <CalibrationCurveLazy />
      </div>
    </PageContainer>
  )
}
