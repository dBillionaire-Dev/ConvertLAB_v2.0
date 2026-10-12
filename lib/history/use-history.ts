"use client"

import { useCallback, useEffect, useState } from "react"
import { addHistoryItem, clearHistory, deleteHistoryItem, getAllHistory, type HistoryItem } from "./db"
import { trackCalculation } from "@/lib/analytics/track-calculation"

export interface RecordOptions {
  /** Name sent to analytics when it should differ from the history label. */
  analyticsName?: string
}

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const all = await getAllHistory()
      setItems(all)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  /**
   * Saves a result to local history AND queues the matching analytics event.
   *
   * Every saved history entry produces exactly one analytics event that reuses the
   * history ID, so what a user sees on their device and what the admin console
   * counts cannot drift apart. If the local save fails (private mode, storage
   * full) the calculation is still reported, just without a history ID.
   */
  const record = useCallback(
    async (item: Omit<HistoryItem, "id" | "timestamp">, options?: RecordOptions) => {
      let saved: HistoryItem | null = null
      try {
        saved = await addHistoryItem(item)
      } finally {
        void trackCalculation({
          calculatorId: item.calculatorId,
          calculatorName: options?.analyticsName ?? item.calculatorName,
          category: item.category,
          eventId: saved?.id,
          occurredAt: saved?.timestamp,
        })
      }
      await refresh()
      return saved
    },
    [refresh],
  )

  const remove = useCallback(
    async (id: string) => {
      await deleteHistoryItem(id)
      await refresh()
    },
    [refresh],
  )

  const clear = useCallback(async () => {
    await clearHistory()
    await refresh()
  }, [refresh])

  return { items, loading, record, remove, clear, refresh }
}
