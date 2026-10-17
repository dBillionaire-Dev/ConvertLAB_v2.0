// Small server-only Supabase REST client for the billing tables (service role, same env vars the analytics routes use).
// Every id that goes into a query string is checked first so a crafted value cannot add filters.
export type Row = Record<string, any>

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const uuid = (v: unknown): string => {
  if (typeof v !== "string" || !UUID.test(v)) throw new Error("Invalid id.")
  return v.toLowerCase()
}
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v)
export const eq = (v: string) => `eq.${encodeURIComponent(v)}`

function conn() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.")
  return { base: `${url.replace(/\/$/, "")}/rest/v1`, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" } }
}

async function check(res: Response, what: string) {
  if (!res.ok) throw new Error(`Supabase ${what} failed (${res.status}): ${(await res.text()).slice(0, 200)}`)
  return res
}

export const db = {
  async select(table: string, query = ""): Promise<Row[]> {
    const { base, headers } = conn()
    return (await (await check(await fetch(`${base}/${table}?${query}`, { headers, cache: "no-store" }), `select ${table}`)).json()) as Row[]
  },
  async insert(table: string, row: Row, opts: { ignoreDuplicates?: boolean } = {}): Promise<Row | null> {
    const { base, headers } = conn()
    const prefer = opts.ignoreDuplicates ? "resolution=ignore-duplicates,return=representation" : "return=representation"
    const res = await check(await fetch(`${base}/${table}`, { method: "POST", headers: { ...headers, Prefer: prefer }, body: JSON.stringify(row) }), `insert ${table}`)
    const rows = (await res.json()) as Row[]
    return rows[0] ?? null
  },
  async update(table: string, query: string, patch: Row): Promise<Row[]> {
    const { base, headers } = conn()
    const res = await check(await fetch(`${base}/${table}?${query}`, { method: "PATCH", headers: { ...headers, Prefer: "return=representation" }, body: JSON.stringify(patch) }), `update ${table}`)
    return (await res.json()) as Row[]
  },
  async remove(table: string, query: string): Promise<Row[]> {
    const { base, headers } = conn()
    const res = await check(await fetch(`${base}/${table}?${query}`, { method: "DELETE", headers: { ...headers, Prefer: "return=representation" } }), `delete ${table}`)
    return (await res.json()) as Row[]
  },
  async rpc<T = any>(name: string, args: Row): Promise<T> {
    const { base, headers } = conn()
    const res = await check(await fetch(`${base}/rpc/${name}`, { method: "POST", headers, body: JSON.stringify(args) }), `rpc ${name}`)
    const text = await res.text()
    return (text ? JSON.parse(text) : null) as T
  },
}
