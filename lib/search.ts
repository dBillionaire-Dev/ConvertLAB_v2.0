import { calculators } from "./calculators/registry"
import { conversionCategories } from "./conversions/registry"
import { labTools } from "./lab-tools-registry"

export interface SearchResult {
  id: string
  title: string
  subtitle: string
  href: string
  type: "calculator" | "conversion" | "tool"
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
      type: "calculator" as const,
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
      type: "conversion" as const,
    }))

  const toolResults: SearchResult[] = labTools
    .filter((tool) => {
      const haystack = [tool.name, tool.description, ...(tool.keywords ?? [])].join(" ").toLowerCase()
      return haystack.includes(q)
    })
    .map((tool) => ({
      id: tool.id,
      title: tool.name,
      subtitle: "Lab Tool",
      href: tool.href,
      type: "tool" as const,
    }))

  return [...calcResults, ...conversionResults, ...toolResults]
}
