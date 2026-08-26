"use client"

const DB_NAME = "convertlab"
const DB_VERSION = 1
const STORE_NAME = "history"

export interface HistoryItem {
  id: string
  calculatorId: string
  calculatorName: string
  category: string
  inputs: Record<string, unknown>
  result: unknown
  unit?: string
  timestamp: string
}

function isBrowser() {
  return typeof window !== "undefined" && "indexedDB" in window
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isBrowser()) {
      reject(new Error("IndexedDB is not available in this environment"))
      return
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" })
        store.createIndex("timestamp", "timestamp", { unique: false })
        store.createIndex("calculatorId", "calculatorId", { unique: false })
        store.createIndex("category", "category", { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode)
        const store = tx.objectStore(STORE_NAME)
        const request = fn(store)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
        tx.oncomplete = () => db.close()
      }),
  )
}

export async function addHistoryItem(item: Omit<HistoryItem, "id" | "timestamp">): Promise<HistoryItem> {
  const full: HistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  }
  await withStore("readwrite", (store) => store.add(full))
  return full
}

export async function getAllHistory(): Promise<HistoryItem[]> {
  if (!isBrowser()) return []
  const items = await withStore<HistoryItem[]>("readonly", (store) => store.getAll())
  return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export async function deleteHistoryItem(id: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(id))
}

export async function clearHistory(): Promise<void> {
  await withStore("readwrite", (store) => store.clear())
}
