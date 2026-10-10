import { LANDING_URL } from "@/lib/site"

export const dynamic = "force-static"

/** robots.txt for the landing domain (the proxy rewrites example.com/robots.txt here). */
export function GET() {
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${LANDING_URL}/sitemap.xml\n`
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } })
}
