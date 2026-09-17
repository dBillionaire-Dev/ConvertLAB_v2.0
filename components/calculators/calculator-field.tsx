"use client"

import type { InputDefinition } from "@/lib/calculators/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CalculatorFieldProps {
  input: InputDefinition
  value: string
  onChange: (value: string) => void
  onEnter?: () => void
}

export function CalculatorField({ input, value, onChange, onEnter }: CalculatorFieldProps) {
  if (input.kind === "select") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={input.id}>
          {input.label}
          {input.optional ? <span className="text-muted-foreground font-normal"> (optional)</span> : <span className="text-muted-foreground font-normal"> (required)</span>}
        </Label>
        <Select
          value={value}
          onValueChange={onChange}
          required={!input.optional}
        >
          <SelectTrigger
            id={input.id}
            aria-required={!input.optional}
            aria-describedby={input.helpText ? `${input.id}-help` : undefined}
          >
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {input.options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {input.helpText ? (
          <p id={`${input.id}-help`} className="text-xs text-muted-foreground">{input.helpText}</p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={input.id}>
        {input.label}
        {input.optional ? <span className="text-muted-foreground font-normal"> (optional)</span> : null}
      </Label>
      <div className="relative">
        <Input
          id={input.id}
          type="number"
          inputMode="decimal"
          value={value}
          placeholder={input.placeholder ?? (input.defaultValue !== undefined ? String(input.defaultValue) : undefined)}
          min={input.min}
          max={input.max}
          step={input.step ?? "any"}
          aria-required={!input.optional}
          aria-invalid={value !== "" && ((input.min !== undefined && Number(value) < input.min) || (input.max !== undefined && Number(value) > input.max))}
          aria-describedby={input.helpText ? `${input.id}-help` : undefined}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onEnter?.()
          }}
          className={input.unit ? "pr-14" : undefined}
        />
        {input.unit ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {input.unit}
          </span>
        ) : null}
      </div>
      {input.helpText ? <p id={`${input.id}-help`} className="text-xs text-muted-foreground">{input.helpText}</p> : null}
    </div>
  )
}
