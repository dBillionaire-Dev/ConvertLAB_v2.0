import type { MetadataRoute } from "next"
import { calculatorCategories, calculators } from "@/lib/calculators/registry"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://convertlab-nex.vercel.app"
  const base = baseUrl.replace(/\/$/, "")

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/calculators`, changeFrequency: "weekly", priority: 0.9 },
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
