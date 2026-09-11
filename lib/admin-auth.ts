import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

const COOKIE_NAME = "convertlab-admin"
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET
  if (!value || value.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must be configured and at least 32 characters long.")
  }
  return value
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex")
}

export function createAdminToken() {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const payload = `${timestamp}`
  return `${payload}.${signature(payload)}`
}

export function isValidAdminToken(token: string | undefined) {
  if (!token) return false

  const [timestamp, providedSignature] = token.split(".")
  if (!timestamp || !providedSignature || !/^\d+$/.test(timestamp)) return false

  const age = Math.floor(Date.now() / 1000) - Number(timestamp)
  if (age < 0 || age > MAX_AGE_SECONDS) return false

  const expected = signature(timestamp)
  if (providedSignature.length !== expected.length) return false

  return timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expected))
}

export async function isAdminAuthenticated() {
  const store = await cookies()
  return isValidAdminToken(store.get(COOKIE_NAME)?.value)
}

export async function setAdminCookie() {
  const store = await cookies()
  store.set(COOKIE_NAME, createAdminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function clearAdminCookie() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME
