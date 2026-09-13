import { Activity } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { setAdminCookie } from "@/lib/admin-auth"

async function login(formData: FormData) {
  "use server"

  const password = String(formData.get("password") ?? "")
  const expected = process.env.ADMIN_PASSWORD

  if (!expected || password !== expected) {
    redirect("/admin/login?error=1")
  }

  await setAdminCookie()
  redirect("/admin")
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm rounded-xl border bg-background p-6 shadow-sm">
        <div className="mb-6">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="text-lg font-bold">ConvertLAB</span>
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Management Console</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to view anonymous calculation usage.
          </p>
        </div>

        {params.error ? (
          <p role="alert" className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            Invalid password.
          </p>
        ) : null}

        <form action={login} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Admin password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  )
}
