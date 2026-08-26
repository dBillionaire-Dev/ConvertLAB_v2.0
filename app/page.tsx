"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Calculator, ArrowLeftRight, FlaskConical, BookOpen, Star, Clock, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { calculatorCategories, getCalculatorById } from "@/lib/calculators/registry"
import { conversionCategories } from "@/lib/conversions/registry"
import { getFavorites, subscribeFavorites } from "@/lib/favorites"
import { getRecentlyUsed, subscribeRecentlyUsed } from "@/lib/recently-used"

const quickLinks = [
  { href: "/calculators", label: "Calculators", icon: Calculator, description: "Clinical, renal, chemistry, hematology" },
  { href: "/conversions", label: "Conversions", icon: ArrowLeftRight, description: "Mass, volume, temperature, and more" },
  { href: "/lab-tools", label: "Lab Tools", icon: FlaskConical, description: "Dilutions and solution prep" },
  { href: "/reference", label: "Reference", icon: BookOpen, description: "Formulas and unit definitions" },
]

export default function HomePage() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [recentIds, setRecentIds] = useState<string[]>([])

  useEffect(() => {
    setFavoriteIds(getFavorites())
    setRecentIds(getRecentlyUsed())
    const unsubFav = subscribeFavorites(() => setFavoriteIds(getFavorites()))
    const unsubRecent = subscribeRecentlyUsed(() => setRecentIds(getRecentlyUsed()))
    return () => {
      unsubFav()
      unsubRecent()
    }
  }, [])

  const favoriteTools = favoriteIds.map((id) => getCalculatorById(id)).filter((t): t is NonNullable<typeof t> => Boolean(t))
  const recentTools = recentIds
    .filter((id) => !id.startsWith("conversion:"))
    .map((id) => getCalculatorById(id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-5xl">
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">ConvertLAB</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-xl mx-auto">
          From units to results, calculators, conversions, and lab tools, all stored locally on your device.
        </p>
        <Button
          variant="outline"
          className="mt-5 gap-2 text-muted-foreground font-normal w-full sm:w-auto max-w-sm mx-auto"
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
        >
          <Search className="h-4 w-4" />
          Search calculators, conversions...
          <kbd className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded border hidden sm:inline">⌘K</kbd>
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-10">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="h-full hover:border-primary/50 transition-colors">
              <CardHeader className="p-4 sm:p-6">
                <link.icon className="h-6 w-6 text-primary mb-2" />
                <CardTitle className="text-sm sm:text-base">{link.label}</CardTitle>
                <CardDescription className="text-xs hidden sm:block">{link.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {(favoriteTools.length > 0 || recentTools.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2 mb-10">
          {favoriteTools.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                <Star className="h-4 w-4" /> Favorites
              </h2>
              <div className="space-y-2">
                {favoriteTools.slice(0, 5).map((tool) => (
                  <Link key={tool.id} href={`/calculators/${tool.category}/${tool.id}`}>
                    <Card className="hover:border-primary/50 transition-colors">
                      <CardContent className="py-3 px-4 text-sm font-medium">{tool.name}</CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {recentTools.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                <Clock className="h-4 w-4" /> Recently Used
              </h2>
              <div className="space-y-2">
                {recentTools.slice(0, 5).map((tool) => (
                  <Link key={tool.id} href={`/calculators/${tool.category}/${tool.id}`}>
                    <Card className="hover:border-primary/50 transition-colors">
                      <CardContent className="py-3 px-4 text-sm font-medium">{tool.name}</CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Calculator Categories</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {calculatorCategories.map((cat) => (
            <Link key={cat.id} href={`/calculators/${cat.id}`}>
              <Card className="h-full hover:border-primary/50 transition-colors">
                <CardHeader className="py-4">
                  <CardTitle className="text-sm">{cat.label}</CardTitle>
                  <CardDescription>{cat.count} tools</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 mt-8">Conversion Categories</h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {conversionCategories.map((cat) => (
            <Link key={cat.id} href={`/conversions/${cat.id}`}>
              <Card className="h-full hover:border-primary/50 transition-colors">
                <CardHeader className="py-3">
                  <CardTitle className="text-xs sm:text-sm">{cat.name}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
