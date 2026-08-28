"use client"

import Link from "next/link"
import { Calculator, ArrowLeftRight, FlaskConical, Search, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

const quickLinks = [
  { href: "/calculators", label: "Calculators", icon: Calculator },
  { href: "/conversions", label: "Conversions", icon: ArrowLeftRight },
  { href: "/lab-tools", label: "Lab Tools", icon: FlaskConical },
]

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 sm:py-24 max-w-lg text-center">
      <p className="text-sm font-medium text-primary mb-2">404</p>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Page not found</h1>
      <p className="text-muted-foreground text-sm sm:text-base mb-8">
        The page you're looking for doesn't exist, may have moved, or the link might be out of date.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
        <Button asChild>
          <Link href="/">
            <Home className="h-4 w-4 mr-2" />
            Back to home
          </Link>
        </Button>
        <Button
          variant="outline"
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
        >
          <Search className="h-4 w-4 mr-2" />
          Search ConvertLAB
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="items-center p-4">
                <link.icon className="h-5 w-5 text-primary mb-1.5" aria-hidden />
                <CardTitle className="text-xs font-medium">{link.label}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
