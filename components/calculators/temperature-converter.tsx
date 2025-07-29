"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function TemperatureConverter() {
  const [celsius, setCelsius] = useState("")
  const [fahrenheit, setFahrenheit] = useState("")
  const [kelvin, setKelvin] = useState("")

  const convertFromCelsius = (c: string) => {
    if (!c) {
      setFahrenheit("")
      setKelvin("")
      return
    }
    const val = Number.parseFloat(c)
    if (!isNaN(val)) {
      setFahrenheit(((val * 9) / 5 + 32).toFixed(2))
      setKelvin((val + 273).toFixed(2))
    }
  }

  const convertFromFahrenheit = (f: string) => {
    if (!f) {
      setCelsius("")
      setKelvin("")
      return
    }
    const val = Number.parseFloat(f)
    if (!isNaN(val)) {
      const c = ((val - 32) * 5) / 9
      setCelsius(c.toFixed(2))
      setKelvin((c + 273).toFixed(2))
    }
  }

  const convertFromKelvin = (k: string) => {
    if (!k) {
      setCelsius("")
      setFahrenheit("")
      return
    }
    const val = Number.parseFloat(k)
    if (!isNaN(val)) {
      const c = val - 273
      setCelsius(c.toFixed(2))
      setFahrenheit(((c * 9) / 5 + 32).toFixed(2))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Temperature Converter</CardTitle>
        <CardDescription>Convert temperature between Celsius, Fahrenheit, and Kelvin</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="celsius">Celsius (°C)</Label>
            <Input
              id="celsius"
              type="number"
              placeholder="Enter °C"
              value={celsius}
              onChange={(e) => {
                setCelsius(e.target.value)
                convertFromCelsius(e.target.value)
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fahrenheit">Fahrenheit (°F)</Label>
            <Input
              id="fahrenheit"
              type="number"
              placeholder="Enter °F"
              value={fahrenheit}
              onChange={(e) => {
                setFahrenheit(e.target.value)
                convertFromFahrenheit(e.target.value)
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kelvin">Kelvin (K)</Label>
            <Input
              id="kelvin"
              type="number"
              placeholder="Enter K"
              value={kelvin}
              onChange={(e) => {
                setKelvin(e.target.value)
                convertFromKelvin(e.target.value)
              }}
            />
          </div>
        </div>

        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <strong>Conversion Formulas:</strong>
          <br />
          °F = (°C × 9/5) + 32
          <br />K = °C + 273
          <br />
          °C = (°F - 32) × 5/9
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-600">Water Freezes</div>
            <div className="text-xs text-gray-600">0°C | 32°F | 273K</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-green-600">Room Temperature</div>
            <div className="text-xs text-gray-600">20°C | 68°F | 293K</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="text-sm font-medium text-red-600">Water Boils</div>
            <div className="text-xs text-gray-600">100°C | 212°F | 373K</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
