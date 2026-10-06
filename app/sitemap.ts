import type { MetadataRoute } from "next"
import { calculatorCategories, calculators } from "@/lib/calculators/registry"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://convertlab-nex.vercel.app"
  const base = baseUrl.replace(/\/$/, "")

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    // With a separate landing domain, /welcome is not a page of the app (it redirects to the landing domain).
    ...(process.env.NEXT_PUBLIC_LANDING_URL ? [] : [{ url: `${base}/welcome`, changeFrequency: "monthly" as const, priority: 0.9 }]),
    { url: `${base}/calculators`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/conversions`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/lab-tools`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/estimators`, changeFrequency: "weekly", priority: 0.8 },
    ...calculatorCategories.map((category) => ({
      url: `${base}/calculators/${category.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...calculators.map((calculator) => ({
      url: `${base}/calculators/${calculator.category}/${calculator.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ]
}
