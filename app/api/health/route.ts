import { NextResponse } from "next/server"
import { calculators, calculatorCategories } from "@/lib/calculators/registry"

export const dynamic = "force-dynamic"

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "ConvertLAB",
      calculatorCount: calculators.length,
      activeCalculatorCategories: calculatorCategories.length,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  )
}
