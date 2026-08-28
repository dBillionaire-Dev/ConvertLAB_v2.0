import Link from "next/link"
import { PageContainer } from "@/components/page-container"
import { conversionCategories } from "@/lib/conversions/registry"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Droplet } from "lucide-react"

export const metadata = { title: "Conversions — ConvertLAB" }

export default function ConversionsPage() {
  return (
    <PageContainer title="Conversions" description="Standard unit conversions for laboratory and clinical work.">
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/conversions/mass-volume">
          <Card className="hover:border-primary/50 transition-colors border-primary/30">
            <CardHeader className="flex flex-row items-center gap-3 py-4">
              <Droplet className="h-5 w-5 text-primary shrink-0" />
              <div>
                <CardTitle className="text-base">Mass ↔ Volume</CardTitle>
                <CardDescription>Density-based conversion by substance</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/conversions/molar-mass">
          <Card className="hover:border-primary/50 transition-colors border-primary/30">
            <CardHeader className="flex flex-row items-center gap-3 py-4">
              <Droplet className="h-5 w-5 text-primary shrink-0" />
              <div>
                <CardTitle className="text-base">Molar ↔ Mass Concentration</CardTitle>
                <CardDescription>mg/dL ↔ mmol/L by analyte</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        {conversionCategories.map((cat) => (
          <Link key={cat.id} href={`/conversions/${cat.id}`}>
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="py-4">
                <CardTitle className="text-base">{cat.name}</CardTitle>
                <CardDescription>{cat.units.map((u) => u.symbol).join(", ")}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  )
}
