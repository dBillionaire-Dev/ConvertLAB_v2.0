import { PageContainer } from "@/components/page-container"

export default function CalculatorsLoading() {
  return (
    <PageContainer title="Calculators" description="Loading the clinical calculation directory…">
      <div className="grid gap-4 sm:grid-cols-2" aria-label="Loading calculators">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-lg border bg-muted/30" />
        ))}
      </div>
    </PageContainer>
  )
}
