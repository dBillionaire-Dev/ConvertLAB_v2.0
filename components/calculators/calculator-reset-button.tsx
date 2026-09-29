"use client"

import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

type CalculatorResetButtonProps = {
  onReset: () => void
}

export function CalculatorResetButton({ onReset }: CalculatorResetButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Reset calculator"
      title="Reset calculator"
      onClick={onReset}
    >
      <RotateCcw className="h-5 w-5" aria-hidden="true" />
    </Button>
  )
}
