import type { ReactNode } from "react"
import { BackButton } from "@/components/back-button"

export function PageContainer({
  title,
  description,
  children,
}: {
  title?: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <BackButton />
      {title ? (
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description ? <p className="text-muted-foreground mt-1 text-sm">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </div>
  )
}
