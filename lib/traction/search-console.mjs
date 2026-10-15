// Google Search Console Search Analytics client using only Node built-ins.
// Auth: a service account (GSC_SERVICE_ACCOUNT_JSON, or GSC_CLIENT_EMAIL + GSC_PRIVATE_KEY).
import { createSign } from "node:crypto"
import { addDays } from "./dates.mjs"

const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"
const TOKEN_URL = "https://oauth2.googleapis.com/token"
const ROW_LIMIT = 25_000

const b64url = (input) => Buffer.from(input).toString("base64url")

/** @returns {{ client_email: string, private_key: string }} */
export function readServiceAccount(env = process.env) {
  if (env.GSC_SERVICE_ACCOUNT_JSON) {
    const parsed = JSON.parse(env.GSC_SERVICE_ACCOUNT_JSON)
    return { client_email: parsed.client_email, private_key: parsed.private_key }
  }
  if (env.GSC_CLIENT_EMAIL && env.GSC_PRIVATE_KEY) {
    return { client_email: env.GSC_CLIENT_EMAIL, private_key: env.GSC_PRIVATE_KEY.replace(/\\n/g, "\n") }
  }
  throw new Error("Set GSC_SERVICE_ACCOUNT_JSON (or GSC_CLIENT_EMAIL and GSC_PRIVATE_KEY).")
}

export function signJwt({ client_email, private_key }, nowSeconds = Math.floor(Date.now() / 1000)) {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const claims = b64url(
    JSON.stringify({ iss: client_email, scope: SCOPE, aud: TOKEN_URL, iat: nowSeconds, exp: nowSeconds + 3600 }),
  )
  const signer = createSign("RSA-SHA256")
  signer.update(`${header}.${claims}`)
  return `${header}.${claims}.${signer.sign(private_key).toString("base64url")}`
}

export async function getAccessToken(account, fetchImpl = fetch) {
  const res = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: signJwt(account) }),
  })
  if (!res.ok) throw new Error(`Google token request failed (${res.status}): ${(await res.text()).slice(0, 200)}`)
  return (await res.json()).access_token
}

/** Split [start, end] into windows of at most `days` days (inclusive). */
export function chunkRange(start, end, days = 31) {
  const chunks = []
  let from = start
  while (from <= end) {
    const to = addDays(from, days - 1) < end ? addDays(from, days - 1) : end
    chunks.push([from, to])
    from = addDays(to, 1)
  }
  return chunks
}

/** Map one API row (dimensions: date, query, page, country, device) to a table row. */
export function mapRow(row) {
  const [date, query, page, country, device] = row.keys
  return {
    date,
    query,
    page,
    country,
    device,
    clicks: Math.round(row.clicks ?? 0),
    impressions: Math.round(row.impressions ?? 0),
    ctr: Number(row.ctr ?? 0),
    position: Number(row.position ?? 0),
  }
}

/** Remove duplicate keys inside one batch (an upsert cannot touch the same row twice). */
export function dedupeRows(rows) {
  const map = new Map()
  for (const r of rows) map.set(`${r.date}|${r.query}|${r.page}|${r.country}|${r.device}`, r)
  return [...map.values()]
}

export async function fetchRange({ siteUrl, token, startDate, endDate, fetchImpl = fetch }) {
  const rows = []
  for (let startRow = 0; ; startRow += ROW_LIMIT) {
    const res = await fetchImpl(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ["date", "query", "page", "country", "device"],
          rowLimit: ROW_LIMIT,
          startRow,
          dataState: "final",
        }),
      },
    )
    if (!res.ok) throw new Error(`Search Console API ${res.status}: ${(await res.text()).slice(0, 300)}`)
    const batch = (await res.json()).rows ?? []
    rows.push(...batch.map(mapRow))
    if (batch.length < ROW_LIMIT) break
  }
  return rows
}
