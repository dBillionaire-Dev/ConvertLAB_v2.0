"use client"

import { useEffect } from "react"
import { applyStoredReduceMotion } from "@/lib/preferences"

export function ApplyPreferences() {
  useEffect(() => {
    applyStoredReduceMotion()
  }, [])

  return null
}
