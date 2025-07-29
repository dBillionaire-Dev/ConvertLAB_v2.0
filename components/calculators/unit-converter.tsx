"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function UnitConverter() {
  // Weight converter
  const [weightKg, setWeightKg] = useState("")
  const [weightLbs, setWeightLbs] = useState("")

  // Height converter
  const [heightM, setHeightM] = useState("")
  const [heightCm, setHeightCm] = useState("")
  const [heightFtIn, setHeightFtIn] = useState("")
  const [heightFtDecimal, setHeightFtDecimal] = useState("")

  const convertKgToLbs = (kg: string) => {
    if (!kg) {
      setWeightLbs("")
      return
    }
    const val = Number.parseFloat(kg)
    if (!isNaN(val)) {
      setWeightLbs((val * 2.20462).toFixed(2))
    }
  }

  const convertLbsToKg = (lbs: string) => {
    if (!lbs) {
      setWeightKg("")
      return
    }
    const val = Number.parseFloat(lbs)
    if (!isNaN(val)) {
      setWeightKg((val / 2.20462).toFixed(2))
    }
  }

  const convertMToCm = (m: string) => {
    if (!m) {
      setHeightCm("")
      setHeightFtIn("")
      setHeightFtDecimal("")
      return
    }
    const val = Number.parseFloat(m)
    if (!isNaN(val)) {
      const cm = val * 100
      setHeightCm(cm.toFixed(1))

      const totalInches = cm / 2.54
      const feet = Math.floor(totalInches / 12)
      const remainingInches = totalInches % 12
      const roundedInches = Math.round(remainingInches)
      setHeightFtIn(`${feet}' ${roundedInches}"`)
      setHeightFtDecimal((totalInches / 12).toFixed(2))
    }
  }

  const convertCmToOthers = (cm: string) => {
    if (!cm) {
      setHeightM("")
      setHeightFtIn("")
      setHeightFtDecimal("")
      return
    }
    const val = Number.parseFloat(cm)
    if (!isNaN(val)) {
      setHeightM((val / 100).toFixed(3))

      const totalInches = val / 2.54
      const feet = Math.floor(totalInches / 12)
      const remainingInches = totalInches % 12
      const roundedInches = Math.round(remainingInches)
      setHeightFtIn(`${feet}' ${roundedInches}"`)
      setHeightFtDecimal((totalInches / 12).toFixed(2))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unit Converter</CardTitle>
        <CardDescription>Convert weight and height between different units</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weight" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weight">Weight</TabsTrigger>
            <TabsTrigger value="height">Height</TabsTrigger>
          </TabsList>

          <TabsContent value="weight" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight-kg">Weight (kg)</Label>
                <Input
                  id="weight-kg"
                  type="number"
                  placeholder="Enter weight in kg"
                  value={weightKg}
                  onChange={(e) => {
                    setWeightKg(e.target.value)
                    convertKgToLbs(e.target.value)
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight-lbs">Weight (lbs)</Label>
                <Input
                  id="weight-lbs"
                  type="number"
                  placeholder="Enter weight in lbs"
                  value={weightLbs}
                  onChange={(e) => {
                    setWeightLbs(e.target.value)
                    convertLbsToKg(e.target.value)
                  }}
                />
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <strong>Conversion:</strong> 1 kg = 2.20462 lbs
            </div>
          </TabsContent>

          <TabsContent value="height" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height-m">Height (meters)</Label>
                <Input
                  id="height-m"
                  type="number"
                  placeholder="Enter height in meters"
                  value={heightM}
                  onChange={(e) => {
                    setHeightM(e.target.value)
                    convertMToCm(e.target.value)
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height-cm">Height (cm)</Label>
                <Input
                  id="height-cm"
                  type="number"
                  placeholder="Enter height in cm"
                  value={heightCm}
                  onChange={(e) => {
                    setHeightCm(e.target.value)
                    convertCmToOthers(e.target.value)
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height-ft-in">Height (feet & inches)</Label>
                <Input
                  id="height-ft-in"
                  type="text"
                  placeholder="e.g., 5' 10.5&quot;"
                  value={heightFtIn}
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height-ft-decimal">Height (feet decimal)</Label>
                <Input
                  id="height-ft-decimal"
                  type="text"
                  placeholder="e.g., 5.875"
                  value={heightFtDecimal}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <strong>Conversions:</strong>
              <br />1 meter = 100 cm
              <br />1 foot = 12 inches = 30.48 cm
              <br />1 inch = 2.54 cm
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
