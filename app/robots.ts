import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://convertlab-nex.vercel.app").replace(/\/$/, "")

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/favorites", "/history", "/recent", "/settings"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
