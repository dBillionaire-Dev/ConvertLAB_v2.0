"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function BMICalculator() {
  const [weight, setWeight] = useState("")
  const [height, setHeight] = useState("")
  const [weightUnit, setWeightUnit] = useState("kg")
  const [heightUnit, setHeightUnit] = useState("cm")
  const [bmi, setBMI] = useState<number | null>(null)
  const [category, setCategory] = useState("")
  const [showError, setShowError] = useState(false)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (!weight || !height) {
        setShowError(true)
        setTimeout(() => setShowError(false), 3000)
        return
      }
      calculateBMI()
    }
  }

  const calculateBMI = () => {
    if (!weight || !height) {
      setShowError(true)
      setTimeout(() => setShowError(false), 3000)
      return
    }

    let weightInKg = Number.parseFloat(weight)
    let heightInM = Number.parseFloat(height)

    // Convert weight to kg if needed
    if (weightUnit === "lbs") {
      weightInKg = weightInKg * 0.453592
    }

    // Convert height to meters if needed
    if (heightUnit === "cm") {
      heightInM = heightInM / 100
    } else if (heightUnit === "ft") {
      heightInM = heightInM * 0.3048
    }

    const bmiValue = weightInKg / (heightInM * heightInM)
    setBMI(Number.parseFloat(bmiValue.toFixed(1)))

    // Determine category
    if (bmiValue < 18.5) {
      setCategory("Underweight")
    } else if (bmiValue < 25) {
      setCategory("Normal weight")
    } else if (bmiValue < 30) {
      setCategory("Overweight")
    } else {
      setCategory("Obese")
    }
  }

  const getBMIColor = () => {
    if (!bmi) return "text-gray-600"
    if (bmi < 18.5) return "text-blue-600"
    if (bmi < 25) return "text-green-600"
    if (bmi < 30) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>BMI Calculator</CardTitle>
        <CardDescription>Calculate Body Mass Index and determine weight category</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Weight</Label>
            <div className="flex space-x-2">
              <Input
                id="weight"
                type="number"
                placeholder="Enter weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Select value={weightUnit} onValueChange={setWeightUnit}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="lbs">lbs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">Height</Label>
            <div className="flex space-x-2">
              <Input
                id="height"
                type="number"
                placeholder="Enter height"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Select value={heightUnit} onValueChange={setHeightUnit}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cm">cm</SelectItem>
                  <SelectItem value="m">m</SelectItem>
                  <SelectItem value="ft">ft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button onClick={calculateBMI} className="w-full">
          Calculate BMI
        </Button>

        {bmi && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className={`text-3xl font-bold ${getBMIColor()}`}>{bmi}</div>
            <div className={`text-lg font-semibold ${getBMIColor()}`}>{category}</div>
          </div>
        )}

        {showError && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            Please enter both weight and height values
          </div>
        )}
      </CardContent>
    </Card>
  )
}
