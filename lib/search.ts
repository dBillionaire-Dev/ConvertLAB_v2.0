import { calculators } from "./calculators/registry"
import { conversionCategories } from "./conversions/registry"

export interface SearchResult {
  id: string
  title: string
  subtitle: string
  href: string
  type: "calculator" | "conversion"
}

export function globalSearch(query: string): SearchResult[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const calcResults: SearchResult[] = calculators
    .filter((c) => {
      const haystack = [c.name, c.shortName ?? "", c.description, ...(c.keywords ?? [])].join(" ").toLowerCase()
      return haystack.includes(q)
    })
    .map((c) => ({
      id: c.id,
      title: c.name,
      subtitle: c.isEstimator ? "Estimator" : "Calculator",
      href: `/calculators/${c.category}/${c.id}`,
      type: "calculator",
    }))

  const conversionResults: SearchResult[] = conversionCategories
    .filter((cat) => {
      const haystack = [cat.name, ...cat.units.map((u) => `${u.name} ${u.symbol}`)].join(" ").toLowerCase()
      return haystack.includes(q)
    })
    .map((cat) => ({
      id: cat.id,
      title: cat.name,
      subtitle: "Conversion",
      href: `/conversions/${cat.id}`,
      type: "conversion",
    }))

  return [...calcResults, ...conversionResults]
}
