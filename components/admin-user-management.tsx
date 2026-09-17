"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Save, Trash2, X } from "lucide-react"
import type { AnalyticsSnapshot } from "@/lib/analytics/types"

type User = AnalyticsSnapshot["allUsersList"][number]

function localDateTime(value: string | null | undefined) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

// This is the human-facing anonymous name assigned to a device. Never expose
// the underlying anonymous ID in the admin table. If the ID already carries
// the User-XXXXXX form, preserve that exact assigned name; otherwise mirror
// the server-side pseudonym generator.
function assignedUserName(anonymousId: string) {
  if (/^User-[A-Za-z0-9]{6}$/i.test(anonymousId)) {
    return `User-${anonymousId.slice(5).toUpperCase()}`
  }

  const normalized = anonymousId.replace(/[^a-zA-Z0-9]/g, "")
  return `User-${normalized.slice(-8).toUpperCase().padEnd(8, "0").slice(0, 6)}`
}

export function AdminUserManagementTable({ users }: { users: User[] }) {
  const router = useRouter()
  const [rows, setRows] = useState(users)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState("")

  function beginEdit(user: User) {
    setError("")
    setEditingId(user.anonymousId)
    setDraftName(user.displayName)
  }

  function cancelEdit() {
    setEditingId(null)
    setDraftName("")
  }

  async function saveName(user: User) {
    const displayName = draftName.trim()
    if (!displayName) {
      setError("Enter a name or alias before saving.")
      return
    }

    setBusyId(user.anonymousId)
    setError("")
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anonymousId: user.anonymousId, displayName }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result?.error || "Unable to update user.")

      setRows((current) => current.map((row) => row.anonymousId === user.anonymousId ? { ...row, displayName } : row))
      cancelEdit()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update user.")
    } finally {
      setBusyId(null)
    }
  }

  async function deleteUser(user: User) {
    const confirmed = window.confirm(
      `Delete ${user.displayName}? This removes the user's anonymous device record and all calculation history from analytics. This cannot be undone.`,
    )
    if (!confirmed) return

    setBusyId(user.anonymousId)
    setError("")
    try {
      const response = await fetch(`/api/admin/users?anonymousId=${encodeURIComponent(user.anonymousId)}`, {
        method: "DELETE",
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result?.error || "Unable to delete user.")

      setRows((current) => current.filter((row) => row.anonymousId !== user.anonymousId))
      if (editingId === user.anonymousId) cancelEdit()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete user.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      {error ? (
        <div role="alert" className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <table className="w-full min-w-[1260px] text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-3 pr-4 font-medium">User</th>
            <th className="pb-3 pr-4 font-medium">Status</th>
            <th className="pb-3 pr-4 font-medium">Last online</th>
            <th className="pb-3 pr-4 font-medium">Last test</th>
            <th className="pb-3 pr-4 font-medium">Source</th>
            <th className="pb-3 pr-4 font-medium">Environment</th>
            <th className="pb-3 pr-4 font-medium">Today</th>
            <th className="pb-3 pr-4 font-medium">14 days</th>
            <th className="pb-3 pr-4 font-medium">Total</th>
            <th className="pb-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => {
            const lastSeen = new Date(item.lastSeenAt).getTime()
            const isActive = Number.isFinite(lastSeen) && Date.now() - lastSeen <= 5 * 60 * 1000
            const editing = editingId === item.anonymousId
            const busy = busyId === item.anonymousId
            const assignedName = assignedUserName(item.anonymousId)
            const renamed = item.displayName !== assignedName

            return (
              <tr key={item.anonymousId} className="border-b last:border-0">
                <td className="py-3 pr-4">
                  {editing ? (
                    <div className="flex min-w-[220px] items-center gap-2">
                      <input
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                        maxLength={80}
                        autoFocus
                        aria-label={`Name or alias for ${item.anonymousId}`}
                        className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        onKeyDown={(event) => {
                          if (event.key === "Enter") void saveName(item)
                          if (event.key === "Escape") cancelEdit()
                        }}
                      />
                    </div>
                  ) : (
                    <div className="min-w-[220px]">
                      <div className="font-medium">{item.displayName}</div>
                      {renamed ? (
                        <div className="mt-0.5 text-[11px] text-muted-foreground">{assignedName}</div>
                      ) : null}
                    </div>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <span className={isActive ? "font-medium text-emerald-600" : "text-muted-foreground"}>
                    {isActive ? "Active" : "Offline"}
                  </span>
                </td>
                <td className="whitespace-nowrap py-3 pr-4">{localDateTime(item.lastSeenAt)}</td>
                <td className="py-3 pr-4">
                  {item.lastCalculatorName ? (
                    <div>
                      <div className="max-w-[220px] truncate font-medium">{item.lastCalculatorName}</div>
                      {item.lastCalculationAt ? <div className="text-xs text-muted-foreground">{localDateTime(item.lastCalculationAt)}</div> : null}
                    </div>
                  ) : <span className="text-muted-foreground">No test recorded</span>}
                </td>
                <td className="py-3 pr-4 capitalize">{item.source}</td>
                <td className="py-3 pr-4">{item.environment}</td>
                <td className="py-3 pr-4 font-medium">{number(item.calculationsToday)}</td>
                <td className="py-3 pr-4 font-medium">{number(item.calculationsLast14Days)}</td>
                <td className="py-3 pr-4 font-medium">{number(item.totalCalculations)}</td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-1">
                    {editing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void saveName(item)}
                          disabled={busy}
                          title="Save name or alias"
                          aria-label={`Save name for ${item.displayName}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-emerald-600 hover:bg-muted disabled:opacity-50"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={busy}
                          title="Cancel editing"
                          aria-label="Cancel editing"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => beginEdit(item)}
                        disabled={busy}
                        title="Edit name or alias"
                        aria-label={`Edit name or alias for ${item.displayName}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted disabled:opacity-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void deleteUser(item)}
                      disabled={busy}
                      title="Delete user and analytics history"
                      aria-label={`Delete ${item.displayName}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {!rows.length ? <p className="py-4 text-sm text-muted-foreground">No users/devices recorded yet.</p> : null}
    </>
  )
}
