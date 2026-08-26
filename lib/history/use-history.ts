"use client"

import { useCallback, useEffect, useState } from "react"
import { addHistoryItem, clearHistory, deleteHistoryItem, getAllHistory, type HistoryItem } from "./db"

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

  const record = useCallback(
    async (item: Omit<HistoryItem, "id" | "timestamp">) => {
      await addHistoryItem(item)
      await refresh()
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
