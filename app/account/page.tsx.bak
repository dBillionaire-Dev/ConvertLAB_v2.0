import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { AccountApp } from "@/components/account/account-app"
import { billingEnabled } from "@/lib/billing/config"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Account", robots: { index: false, follow: false } }

// Dormant: answers 404 until BILLING_ENABLED=true. Nothing links here and it is not in the sitemap.
export default function AccountPage() {
  if (!billingEnabled()) notFound()
  return <div className="mx-auto w-full max-w-2xl px-4 py-8"><AccountApp /></div>
}
