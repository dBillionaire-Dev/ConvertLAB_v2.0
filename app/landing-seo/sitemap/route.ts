import { LANDING_URL } from "@/lib/site"

export const dynamic = "force-static"

/** sitemap.xml for the landing domain: just the landing page (the app has its own sitemap on its own domain). */
export function GET() {
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${LANDING_URL}/</loc><changefreq>monthly</changefreq><priority>1.0</priority></url>\n</urlset>\n`
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } })
}
