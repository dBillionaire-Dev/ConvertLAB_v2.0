"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const conversionFactors: Record<string, number> = {
  glucose: 0.0555, // mg/dL to mmol/L (1 mg/dL = 0.0555 mmol/L)
  cholesterol: 0.0259,
  triglycerides: 0.0113,
  urea: 0.357,
  creatinine: 88.4,
  uric_acid: 59.48,
  bilirubin: 17.1,
}

const parameters = [
  { value: "glucose", label: "Glucose", unit1: "mg/dL", unit2: "mmol/L" },
  { value: "cholesterol", label: "Cholesterol", unit1: "mg/dL", unit2: "mmol/L" },
  { value: "triglycerides", label: "Triglycerides", unit1: "mg/dL", unit2: "mmol/L" },
  { value: "urea", label: "Urea", unit1: "mg/dL", unit2: "mmol/L" },
  { value: "creatinine", label: "Creatinine", unit1: "mg/dL", unit2: "μmol/L" },
  { value: "uric_acid", label: "Uric Acid", unit1: "mg/dL", unit2: "μmol/L" },
  { value: "bilirubin", label: "Bilirubin", unit1: "mg/dL", unit2: "μmol/L" },
]

export function LabConverter() {
  const [selectedParameter, setSelectedParameter] = useState("glucose")
  const [value1, setValue1] = useState("")
  const [value2, setValue2] = useState("")
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    setValue1("")
    setValue2("")
  }, [selectedParameter])

  const currentParameter = parameters.find((p) => p.value === selectedParameter)
  const factor = conversionFactors[selectedParameter]

  const convertToUnit2 = (val: string) => {
    if (!val) {
      setValue2("")
      return
    }
    const numVal = Number.parseFloat(val)
    if (!isNaN(numVal)) {
      let converted: number
      if (selectedParameter === "glucose") {
        // For glucose: mg/dL to mmol/L, divide by 18
        converted = numVal / 18
      } else {
        converted = numVal * factor
      }
      setValue2(converted.toFixed(3))
    }
  }

  const convertToUnit1 = (val: string) => {
    if (!val) {
      setValue1("")
      return
    }
    const numVal = Number.parseFloat(val)
    if (!isNaN(numVal)) {
      let converted: number
      if (selectedParameter === "glucose") {
        // For glucose: mmol/L to mg/dL, multiply by 18
        converted = numVal * 18
      } else {
        converted = numVal / factor
      }
      setValue1(converted.toFixed(2))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (!value1 && !value2) {
        setShowError(true)
        setTimeout(() => setShowError(false), 3000)
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laboratory Unit Converter</CardTitle>
        <CardDescription>Convert laboratory parameters between different units</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Parameter</Label>
          <Select value={selectedParameter} onValueChange={setSelectedParameter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {parameters.map((param) => (
                <SelectItem key={param.value} value={param.value}>
                  {param.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="unit1">{currentParameter?.unit1}</Label>
            <Input
              id="unit1"
              type="number"
              placeholder={`Enter value in ${currentParameter?.unit1}`}
              value={value1}
              onChange={(e) => {
                setValue1(e.target.value)
                convertToUnit2(e.target.value)
              }}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit2">{currentParameter?.unit2}</Label>
            <Input
              id="unit2"
              type="number"
              placeholder={`Enter value in ${currentParameter?.unit2}`}
              value={value2}
              onChange={(e) => {
                setValue2(e.target.value)
                convertToUnit1(e.target.value)
              }}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <strong>Conversion Factor:</strong>
          {selectedParameter === "glucose"
            ? "1 mmol/L = 18 mg/dL"
            : `1 ${currentParameter?.unit1} = ${factor} ${currentParameter?.unit2}`}
        </div>

        {showError && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            Please enter a value to convert
          </div>
        )}
      </CardContent>
    </Card>
  )
}
