"use client"

import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

type CalculationResetButtonProps = {
  onReset: () => void
}

export function CalculationResetButton({
  onReset,
}: CalculationResetButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Reset calculation"
      title="Reset calculation"
      onClick={onReset}
    >
      <RotateCcw className="h-5 w-5" aria-hidden="true" />
    </Button>
  )
}
