import { PageContainer } from "@/components/page-container"
import { MassVolumeConverter } from "@/components/conversions/mass-volume-converter"

export const metadata = { title: "Mass ↔ Volume - Clinexia" }

export default function MassVolumePage() {
  return (
    <PageContainer>
      <h1 className="sr-only">Mass ↔ Volume Conversion</h1>
      <MassVolumeConverter />
    </PageContainer>
  )
}
