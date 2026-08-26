"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  const router = useRouter()

  const handleBack = () => {
    // If there's no history to go back to (e.g. a direct link/refresh),
    // router.back() would leave the app, so fall back to a known route.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleBack} className="-ml-2 mb-2 text-muted-foreground hover:text-foreground">
      <ChevronLeft className="h-4 w-4 mr-1" />
      Back
    </Button>
  )
}
