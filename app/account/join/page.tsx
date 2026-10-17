import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { JoinInvite } from "@/components/account/simple-flows"
import { billingEnabled } from "@/lib/billing/config"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Join organisation", robots: { index: false, follow: false } }

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  if (!billingEnabled()) notFound()
  const { token } = await searchParams
  if (!token) notFound()
  return <div className="mx-auto w-full max-w-md px-4 py-16"><JoinInvite token={token} /></div>
}
