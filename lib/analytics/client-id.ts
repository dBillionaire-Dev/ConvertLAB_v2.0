"use client"

const STORAGE_KEY = "convertlab:anonymous-id"

export function getAnonymousId(): string {
  if (typeof window === "undefined") return ""

  let id = window.localStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    window.localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}
