import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { OrganisationDashboard } from "@/components/account/organisation-dashboard"
import { billingEnabled } from "@/lib/billing/config"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Organisation", robots: { index: false, follow: false } }

export default async function OrganisationPage({ searchParams }: { searchParams: Promise<{ org?: string }> }) {
  if (!billingEnabled()) notFound()
  const { org } = await searchParams
  if (!org) notFound()
  return <div className="mx-auto w-full max-w-3xl px-4 py-8"><OrganisationDashboard orgId={org} /></div>
}
