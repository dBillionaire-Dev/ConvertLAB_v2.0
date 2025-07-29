"use client"

import { Calculator, TestTube, Heart, Droplets, Scale, Thermometer } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: "bmi", label: "BMI", icon: Calculator },
  { id: "lab", label: "Lab Units", icon: TestTube },
  { id: "ldl", label: "LDL Calc", icon: Heart },
  { id: "blood", label: "Blood", icon: Droplets },
  { id: "units", label: "Units", icon: Scale },
  { id: "temperature", label: "Temp", icon: Thermometer },
]

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant={activeTab === tab.id ? "default" : "outline"}
          className="flex flex-col items-center p-3 h-auto"
          onClick={() => onTabChange(tab.id)}
        >
          <tab.icon className="h-5 w-5 mb-1" />
          <span className="text-xs">{tab.label}</span>
        </Button>
      ))}
    </div>
  )
}
