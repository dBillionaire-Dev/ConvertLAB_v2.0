"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function BloodCalculator() {
  // Blood indices calculator
  const [hgb, setHgb] = useState("")
  const [hct, setHct] = useState("")
  const [rbc, setRbc] = useState("")
  const [indices, setIndices] = useState<{ mcv: number; mch: number; mchc: number } | null>(null)

  // Indirect bilirubin calculator
  const [totalBilirubin, setTotalBilirubin] = useState("")
  const [directBilirubin, setDirectBilirubin] = useState("")
  const [indirectBilirubin, setIndirectBilirubin] = useState("")

  // PCV converter
  const [pcvDecimal, setPcvDecimal] = useState("")
  const [pcvPercentage, setPcvPercentage] = useState("")

  // RBC estimation
  const [rbcHgb, setRbcHgb] = useState("")
  const [rbcHct, setRbcHct] = useState("")
  const [estimatedRBC, setEstimatedRBC] = useState("")

  const [showError, setShowError] = useState("")

  const handleKeyDownIndices = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (!hgb || !hct || !rbc) {
        setShowError("Please enter all three values (Hemoglobin, Hematocrit, and RBC count)")
        setTimeout(() => setShowError(""), 3000)
        return
      }
      calculateIndices()
    }
  }

  const handleKeyDownBilirubin = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (!totalBilirubin || !directBilirubin) {
        setShowError("Please enter both total and direct bilirubin values")
        setTimeout(() => setShowError(""), 3000)
        return
      }
      calculateIndirectBilirubin()
    }
  }

  const calculateIndices = () => {
    if (!hgb || !hct || !rbc) {
      setShowError("Please enter all three values (Hemoglobin, Hematocrit, and RBC count)")
      setTimeout(() => setShowError(""), 3000)
      return
    }

    const hemoglobin = Number.parseFloat(hgb)
    const hematocrit = Number.parseFloat(hct)
    const rbcCount = Number.parseFloat(rbc)

    // MCV = (Hematocrit × 10) / RBC count
    const mcv = (hematocrit * 10) / rbcCount

    // MCH = (Hemoglobin × 10) / RBC count
    const mch = (hemoglobin * 10) / rbcCount

    // MCHC = (Hemoglobin × 100) / Hematocrit
    const mchc = (hemoglobin * 100) / hematocrit

    setIndices({
      mcv: Number.parseFloat(mcv.toFixed(1)),
      mch: Number.parseFloat(mch.toFixed(1)),
      mchc: Number.parseFloat(mchc.toFixed(1)),
    })
  }

  const calculateIndirectBilirubin = () => {
    if (!totalBilirubin || !directBilirubin) {
      setShowError("Please enter both total and direct bilirubin values")
      setTimeout(() => setShowError(""), 3000)
      return
    }

    const total = Number.parseFloat(totalBilirubin)
    const direct = Number.parseFloat(directBilirubin)
    const indirect = total - direct

    setIndirectBilirubin(indirect.toFixed(2))
  }

  const convertPCVToPercentage = (decimal: string) => {
    if (!decimal) {
      setPcvPercentage("")
      return
    }
    const val = Number.parseFloat(decimal)
    if (!isNaN(val)) {
      setPcvPercentage((val * 100).toFixed(1))
    }
  }

  const convertPCVToDecimal = (percentage: string) => {
    if (!percentage) {
      setPcvDecimal("")
      return
    }
    const val = Number.parseFloat(percentage)
    if (!isNaN(val)) {
      setPcvDecimal((val / 100).toFixed(3))
    }
  }

  const estimateRBC = () => {
    if (!rbcHgb || !rbcHct) {
      setShowError("Please enter both hemoglobin and hematocrit values")
      setTimeout(() => setShowError(""), 3000)
      return
    }

    const hgbVal = Number.parseFloat(rbcHgb)
    const hctVal = Number.parseFloat(rbcHct)

    // RBC estimation using the relationship: RBC = (Hgb × 3) or (Hct / 3)
    const rbcFromHgb = (hgbVal * 3) / 10 // Convert to ×10¹²/L
    const rbcFromHct = hctVal / 3 / 10 // Convert to ×10¹²/L
    const averageRBC = (rbcFromHgb + rbcFromHct) / 2

    setEstimatedRBC(averageRBC.toFixed(2))
  }

  const handleKeyDownRBC = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (!rbcHgb || !rbcHct) {
        setShowError("Please enter both hemoglobin and hematocrit values")
        setTimeout(() => setShowError(""), 3000)
        return
      }
      estimateRBC()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blood Parameters Calculator</CardTitle>
        <CardDescription>Calculate red cell indices, bilirubin, RBC and convert PCV units</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="indices" className="w-full">
          <TabsList className="grid w-full h-18 md:grid-cols-4 grid-cols-2">
            <TabsTrigger value="indices">Blood Indices</TabsTrigger>
            <TabsTrigger value="bilirubin">Bilirubin</TabsTrigger>
            <TabsTrigger value="pcv">PCV Converter</TabsTrigger>
            <TabsTrigger value="rbc">RBC Estimate</TabsTrigger>
          </TabsList>

          <TabsContent value="indices" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hgb">Hemoglobin (g/dL)</Label>
                <Input
                  id="hgb"
                  type="number"
                  placeholder="Enter Hgb"
                  value={hgb}
                  onChange={(e) => setHgb(e.target.value)}
                  onKeyDown={handleKeyDownIndices}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hct">Hematocrit (%)</Label>
                <Input
                  id="hct"
                  type="number"
                  placeholder="Enter Hct"
                  value={hct}
                  onChange={(e) => setHct(e.target.value)}
                  onKeyDown={handleKeyDownIndices}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rbc">RBC Count (×10¹²/L)</Label>
                <Input
                  id="rbc"
                  type="number"
                  placeholder="Enter RBC"
                  value={rbc}
                  onChange={(e) => setRbc(e.target.value)}
                  onKeyDown={handleKeyDownIndices}
                />
              </div>
            </div>

            <Button onClick={calculateIndices} className="w-full">
              Calculate Blood Indices
            </Button>

            {indices && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{indices.mcv}</div>
                  <div className="text-sm text-gray-600">MCV (fL)</div>
                  <div className="text-xs text-gray-500">Normal: 80-100</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{indices.mch}</div>
                  <div className="text-sm text-gray-600">MCH (pg)</div>
                  <div className="text-xs text-gray-500">Normal: 27-32</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{indices.mchc}</div>
                  <div className="text-sm text-gray-600">MCHC (g/dL)</div>
                  <div className="text-xs text-gray-500">Normal: 32-36</div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="bilirubin" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total-bil">Total Bilirubin (mg/dL)</Label>
                <Input
                  id="total-bil"
                  type="number"
                  placeholder="Enter total bilirubin"
                  value={totalBilirubin}
                  onChange={(e) => setTotalBilirubin(e.target.value)}
                  onKeyDown={handleKeyDownBilirubin}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direct-bil">Direct Bilirubin (mg/dL)</Label>
                <Input
                  id="direct-bil"
                  type="number"
                  placeholder="Enter direct bilirubin"
                  value={directBilirubin}
                  onChange={(e) => setDirectBilirubin(e.target.value)}
                  onKeyDown={handleKeyDownBilirubin}
                />
              </div>
            </div>

            <Button onClick={calculateIndirectBilirubin} className="w-full">
              Calculate Indirect Bilirubin
            </Button>

            {indirectBilirubin && (
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{indirectBilirubin} mg/dL</div>
                <div className="text-sm text-gray-600">Indirect Bilirubin</div>
                <div className="text-xs text-gray-500">Normal: {"<"} 0.8 mg/dL</div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pcv" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pcv-decimal">PCV (L/L)</Label>
                <Input
                  id="pcv-decimal"
                  type="number"
                  placeholder="Enter PCV in L/L"
                  value={pcvDecimal}
                  onChange={(e) => {
                    setPcvDecimal(e.target.value)
                    convertPCVToPercentage(e.target.value)
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pcv-percentage">PCV (%)</Label>
                <Input
                  id="pcv-percentage"
                  type="number"
                  placeholder="Enter PCV in %"
                  value={pcvPercentage}
                  onChange={(e) => {
                    setPcvPercentage(e.target.value)
                    convertPCVToDecimal(e.target.value)
                  }}
                />
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <strong>Conversion:</strong> PCV (%) = PCV (L/L) × 100
            </div>
          </TabsContent>
          <TabsContent value="rbc" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rbc-hgb">Hemoglobin (g/dL)</Label>
                <Input
                  id="rbc-hgb"
                  type="number"
                  placeholder="Enter hemoglobin"
                  value={rbcHgb}
                  onChange={(e) => setRbcHgb(e.target.value)}
                  onKeyDown={handleKeyDownRBC}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rbc-hct">Hematocrit (%)</Label>
                <Input
                  id="rbc-hct"
                  type="number"
                  placeholder="Enter hematocrit"
                  value={rbcHct}
                  onChange={(e) => setRbcHct(e.target.value)}
                  onKeyDown={handleKeyDownRBC}
                />
              </div>
            </div>

            <Button onClick={estimateRBC} className="w-full">
              Estimate RBC Count
            </Button>

            {estimatedRBC && (
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{estimatedRBC} ×10¹²/L</div>
                <div className="text-sm text-gray-600">Estimated RBC Count</div>
                <div className="text-xs text-gray-500">Normal: 4.5-5.5 (M), 4.0-5.0 (F) ×10¹²/L</div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        {showError && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            {showError}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
