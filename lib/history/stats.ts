import type { HistoryItem } from "./db"

export interface ActivityStats {
  calculationsThisWeek: number
  calculatorsUsedCount: number
  mostUsed: { calculatorId: string; calculatorName: string; count: number } | null
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function computeActivityStats(items: HistoryItem[]): ActivityStats {
  const now = Date.now()
  const calculationsThisWeek = items.filter((item) => now - new Date(item.timestamp).getTime() <= WEEK_MS).length

  const counts = new Map<string, { calculatorName: string; count: number }>()
  for (const item of items) {
    const existing = counts.get(item.calculatorId)
    if (existing) {
      existing.count += 1
    } else {
      counts.set(item.calculatorId, { calculatorName: item.calculatorName, count: 1 })
    }
  }

  let mostUsed: ActivityStats["mostUsed"] = null
  for (const [calculatorId, { calculatorName, count }] of counts) {
    if (!mostUsed || count > mostUsed.count) {
      mostUsed = { calculatorId, calculatorName, count }
    }
  }

  return {
    calculationsThisWeek,
    calculatorsUsedCount: counts.size,
    mostUsed,
  }
}
