"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

const CalibrationCurveTool = dynamic(
  () =>
    import("@/components/spectrophotometry/calibration-curve-tool").then(
      (m) => m.CalibrationCurveTool
    ),
  {
    loading: () => <Skeleton className="h-[420px] w-full rounded-lg" />,
    ssr: false,
  }
)

export function CalibrationCurveLazy() {
  return <CalibrationCurveTool />
}
