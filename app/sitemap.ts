import type { MetadataRoute } from "next"
import { calculatorCategories, calculators } from "@/lib/calculators/registry"
import { conversionCategories } from "@/lib/conversions/registry"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://convertlab-nex.vercel.app").replace(/\/$/, "")

  const staticRoutes = [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "/calculators", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/conversions", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/lab-tools", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/reference", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/calculators/hematology/red-cell-indices", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/conversions/mass-volume", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/conversions/molar-mass", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/lab-tools/dilution", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/lab-tools/serial-dilution", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/lab-tools/percentage-solution", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/lab-tools/microbiology", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/lab-tools/spectrophotometry", priority: 0.7, changeFrequency: "monthly" as const },
  ]

  return [
    ...staticRoutes.map(({ path, ...meta }) => ({ url: `${base}${path}`, ...meta })),
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
    ...conversionCategories.map((category) => ({
      url: `${base}/conversions/${category.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ]
}
