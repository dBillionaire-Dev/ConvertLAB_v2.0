export const dynamic = "force-static"

/**
 * Manifest for the landing domain. display "browser" means it is NOT installable: the landing site is not the app
 * (the installable PWA lives on the app domain). The proxy rewrites convertlab.co/manifest.webmanifest here.
 */
export function GET() {
  const body = JSON.stringify({ name: "ConvertLAB", short_name: "ConvertLAB", start_url: "/", display: "browser" })
  return new Response(body, { headers: { "Content-Type": "application/manifest+json; charset=utf-8" } })
}
