"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function LDLCalculator() {
  const [totalCholesterol, setTotalCholesterol] = useState("")
  const [hdl, setHdl] = useState("")
  const [triglycerides, setTriglycerides] = useState("")
  const [unit, setUnit] = useState("mg/dl")
  const [ldlResult, setLdlResult] = useState<{ mgdl: number; mmol: number } | null>(null)
  const [showError, setShowError] = useState(false)

  const calculateLDL = () => {
    if (!totalCholesterol || !hdl || !triglycerides) {
      setShowError(true)
      setTimeout(() => setShowError(false), 3000)
      return
    }

    let tc = Number.parseFloat(totalCholesterol)
    let hdlVal = Number.parseFloat(hdl)
    let tg = Number.parseFloat(triglycerides)

    let ldlMgDl: number

    if (unit === "mmol/l") {
      // Convert to mg/dL for calculation
      tc = tc / 0.0259
      hdlVal = hdlVal / 0.0259
      tg = tg / 0.0113
    }

    // Friedewald equation
    if (tg <= 400) {
      ldlMgDl = tc - hdlVal - tg / 5
    } else {
      // For TG > 400 mg/dL, use direct measurement warning
      ldlMgDl = tc - hdlVal - tg / 5 // Still calculate but warn
    }

    const ldlMmol = ldlMgDl * 0.0259

    setLdlResult({
      mgdl: Number.parseFloat(ldlMgDl.toFixed(1)),
      mmol: Number.parseFloat(ldlMmol.toFixed(2)),
    })
  }

  const getLDLCategory = (ldlMgDl: number) => {
    if (ldlMgDl < 100) return { category: "Optimal", color: "text-green-600" }
    if (ldlMgDl < 130) return { category: "Near Optimal", color: "text-blue-600" }
    if (ldlMgDl < 160) return { category: "Borderline High", color: "text-yellow-600" }
    if (ldlMgDl < 190) return { category: "High", color: "text-orange-600" }
    return { category: "Very High", color: "text-red-600" }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (!totalCholesterol || !hdl || !triglycerides) {
        setShowError(true)
        setTimeout(() => setShowError(false), 3000)
        return
      }
      calculateLDL()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>LDL Cholesterol Calculator</CardTitle>
        <CardDescription>Calculate LDL cholesterol using the Friedewald equation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Unit</Label>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mg/dl">mg/dL</SelectItem>
              <SelectItem value="mmol/l">mmol/L</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tc">Total Cholesterol ({unit})</Label>
            <Input
              id="tc"
              type="number"
              placeholder="Enter TC"
              value={totalCholesterol}
              onChange={(e) => setTotalCholesterol(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hdl">HDL Cholesterol ({unit})</Label>
            <Input
              id="hdl"
              type="number"
              placeholder="Enter HDL"
              value={hdl}
              onChange={(e) => setHdl(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tg">Triglycerides ({unit})</Label>
            <Input
              id="tg"
              type="number"
              placeholder="Enter TG"
              value={triglycerides}
              onChange={(e) => setTriglycerides(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        <Button onClick={calculateLDL} className="w-full">
          Calculate LDL
        </Button>

        {ldlResult && (
          <div className="space-y-3">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{ldlResult.mgdl} mg/dL</div>
              <div className="text-lg font-semibold text-blue-600">{ldlResult.mmol} mmol/L</div>
              <div className={`text-sm font-medium mt-2 ${getLDLCategory(ldlResult.mgdl).color}`}>
                {getLDLCategory(ldlResult.mgdl).category}
              </div>
            </div>

            {Number.parseFloat(triglycerides) > (unit === "mg/dl" ? 400 : 4.52) && (
              <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                <strong>Note:</strong> Triglycerides are elevated. Consider direct LDL measurement for accuracy.
              </div>
            )}
          </div>
        )}

        {showError && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            Please enter all three values (TC, HDL, and Triglycerides)
          </div>
        )}
      </CardContent>
    </Card>
  )
}
