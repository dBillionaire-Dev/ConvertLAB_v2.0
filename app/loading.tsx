import { PageContainer } from "@/components/page-container"

export default function Loading() {
  return (
    <PageContainer title="Loading" description="Preparing ConvertLAB…">
      <div className="grid gap-4 sm:grid-cols-2" aria-label="Loading">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-lg border bg-muted/30" />
        ))}
      </div>
    </PageContainer>
  )
}
