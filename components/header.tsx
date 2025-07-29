"use client"

import { useState } from "react"
import Link from "next/link"
import { Activity } from "lucide-react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center h-10">
          <Link href="/" className="flex items-center space-x-2">
            <Activity className="h-8 w-8" />
            <span className="text-3xl font-bold">ConvertLab CCU</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
