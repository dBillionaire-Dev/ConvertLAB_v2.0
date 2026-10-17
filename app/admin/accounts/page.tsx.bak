import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { AccountsAdmin } from "@/components/admin/accounts-admin"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { billingEnabled } from "@/lib/billing/config"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Accounts (admin)", robots: { index: false, follow: false } }

export default async function AdminAccountsPage() {
  if (!billingEnabled()) notFound()
  if (!(await isAdminAuthenticated())) redirect("/admin/login")
  return <div className="mx-auto w-full max-w-6xl px-4 py-8"><AccountsAdmin /></div>
}
