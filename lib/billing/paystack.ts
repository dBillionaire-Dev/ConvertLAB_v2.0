// Paystack client (NGN, and USD when your Paystack account has international payments enabled). Server only: the secret key never reaches the browser. fetch is injectable for tests.
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

const API = "https://api.paystack.co"

/** Paystack signs the RAW request body with HMAC-SHA512 using your secret key (header x-paystack-signature). */
export function verifyWebhookSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex")
  if (signature.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

export const makeReference = () => `clx_${Date.now().toString(36)}_${randomBytes(9).toString("base64url")}`

export interface VerifiedTransaction { status: string; amountMinor: number; currency: string; providerId: string; reference: string }

export interface PaymentProvider {
  initialize(input: { email: string; amountMinor: number; currency: string; reference: string; callbackUrl: string }): Promise<{ authorizationUrl: string }>
  verify(reference: string): Promise<VerifiedTransaction>
}

export function createPaystack(secret: string, fetchImpl: typeof fetch = fetch): PaymentProvider {
  const headers = { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" }
  return {
    async initialize({ email, amountMinor, currency, reference, callbackUrl }) {
      const res = await fetchImpl(`${API}/transaction/initialize`, {
        method: "POST",
        headers,
        body: JSON.stringify({ email, amount: amountMinor, currency, reference, callback_url: callbackUrl }),
      })
      const json = (await res.json().catch(() => null)) as any
      if (!res.ok || !json?.status || !json?.data?.authorization_url) throw new Error(`Paystack initialize failed (${res.status})`)
      return { authorizationUrl: String(json.data.authorization_url) }
    },
    async verify(reference) {
      const res = await fetchImpl(`${API}/transaction/verify/${encodeURIComponent(reference)}`, { headers })
      const json = (await res.json().catch(() => null)) as any
      if (!res.ok || !json?.status || !json?.data) throw new Error(`Paystack verify failed (${res.status})`)
      const d = json.data
      return { status: String(d.status), amountMinor: Number(d.amount), currency: String(d.currency), providerId: String(d.id), reference: String(d.reference) }
    },
  }
}
