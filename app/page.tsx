"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { BMICalculator } from "@/components/calculators/bmi-calculator"
import { LabConverter } from "@/components/calculators/lab-converter"
import { LDLCalculator } from "@/components/calculators/ldl-calculator"
import { BloodCalculator } from "@/components/calculators/blood-calculator"
import { UnitConverter } from "@/components/calculators/unit-converter"
import { TemperatureConverter } from "@/components/calculators/temperature-converter"
import { Navigation } from "@/components/navigation"
import { InstallPrompt } from "@/components/install-prompt"
import { Footer } from "@/components/footer"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("bmi")

  const renderActiveComponent = () => {
    switch (activeTab) {
      case "bmi":
        return <BMICalculator />
      case "lab":
        return <LabConverter />
      case "ldl":
        return <LDLCalculator />
      case "blood":
        return <BloodCalculator />
      case "units":
        return <UnitConverter />
      case "temperature":
        return <TemperatureConverter />
      default:
        return <BMICalculator />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-6 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-gray-600 text-2xl font-bold mb-2">Medical & Laboratory Unit Converter</h3>
          </div>

          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="mt-6">
            {renderActiveComponent()}
            <InstallPrompt />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
