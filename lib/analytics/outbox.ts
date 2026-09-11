"use client"

import type { CalculationEvent } from "./types"

const DB_NAME = "convertlab"
const DB_VERSION = 2
const STORE_NAME = "analytics_outbox"

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

      if (!db.objectStoreNames.contains("history")) {
        const history = db.createObjectStore("history", { keyPath: "id" })
        history.createIndex("timestamp", "timestamp", { unique: false })
        history.createIndex("calculatorId", "calculatorId", { unique: false })
        history.createIndex("category", "category", { unique: false })
      }

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const outbox = db.createObjectStore(STORE_NAME, { keyPath: "id" })
        outbox.createIndex("occurredAt", "occurredAt", { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function queueCalculationEvent(
  event: Omit<CalculationEvent, "id">,
  id?: string,
): Promise<CalculationEvent> {
  const eventId = id ?? crypto.randomUUID()
  const full: CalculationEvent = { ...event, id: eventId }
  const db = await openDB()

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    if (id) store.put(full)
    else store.add(full)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })

  db.close()
  return full
}

export async function getPendingCalculationEvents(): Promise<CalculationEvent[]> {
  if (!isBrowser()) return []

  const db = await openDB()
  const events = await new Promise<CalculationEvent[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const request = tx.objectStore(STORE_NAME).getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  db.close()

  return events.sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime())
}

export async function removeCalculationEvents(ids: string[]): Promise<void> {
  if (!ids.length) return

  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    for (const id of ids) store.delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}
