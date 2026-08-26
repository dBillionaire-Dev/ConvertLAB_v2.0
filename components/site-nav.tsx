"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export const siteNavLinks = [
  { href: "/", label: "Home" },
  { href: "/calculators", label: "Calculators" },
  { href: "/conversions", label: "Conversions" },
  { href: "/estimators", label: "Estimators" },
  { href: "/lab-tools", label: "Lab Tools" },
  { href: "/reference", label: "Reference" },
  { href: "/history", label: "History" },
  { href: "/favorites", label: "Favorites" },
]

export function SiteNav() {
  const pathname = usePathname()

  return (
    <>
      {siteNavLinks.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </>
  )
}
