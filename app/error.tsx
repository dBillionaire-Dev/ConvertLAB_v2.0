"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageContainer } from "@/components/page-container"

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep production error UI quiet; Next.js handles server-side logging/observability.
  }, [])

  return (
    <PageContainer title="Something went wrong" description="ConvertLAB could not complete this page. Your previous calculations are not changed.">
      <div className="mx-auto max-w-lg rounded-lg border p-6 text-center">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-destructive" aria-hidden />
        <p className="text-sm text-muted-foreground mb-4">Try the page again. If the problem persists, use the navigation to return to the calculator directory.</p>
        <Button onClick={() => reset()}>
          <RotateCcw className="mr-2 h-4 w-4" /> Try again
        </Button>
      </div>
    </PageContainer>
  )
}
