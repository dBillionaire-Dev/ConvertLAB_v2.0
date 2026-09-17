import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://convertlab-nex.vercel.app"
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${baseUrl.replace(/\/$/, "")}/sitemap.xml`,
  }
}
