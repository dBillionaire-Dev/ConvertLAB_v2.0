"use client"

import { useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DEVICE_LABELS, IMG, SHOTS, type Device, type Shot } from "@/lib/landing-data"
import { cn } from "@/lib/utils"

const FILTERS: { id: "all" | Device; label: string }[] = [
  { id: "all", label: "All" },
  { id: "desktop", label: "Large screen" },
  { id: "phone", label: "Phone (PWA)" },
  { id: "app", label: "Android app" },
]

export function Gallery() {
  const [filter, setFilter] = useState<"all" | Device>("all")
  const [dark, setDark] = useState(false)
  const [open, setOpen] = useState<Shot | null>(null)
  const shots = SHOTS.filter((s) => filter === "all" || s.device === filter)
  const src = (s: Shot) => (dark && s.dark ? s.dark : s.light)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
        {FILTERS.map((f) => (
          <Button key={f.id} type="button" size="sm" variant={filter === f.id ? "default" : "outline"} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</Button>
        ))}
        <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden />
        <Button type="button" size="sm" variant="outline" aria-pressed={dark} onClick={() => setDark((d) => !d)}>
          {dark ? <Moon className="mr-2 h-4 w-4" aria-hidden /> : <Sun className="mr-2 h-4 w-4" aria-hidden />}
          {dark ? "Dark theme" : "Light theme"}
        </Button>
      </div>

      {/* Phones: swipe sideways (keeps the page short). Larger screens: a grid. */}
      <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
        {shots.map((s) => {
          const wide = s.device === "desktop"
          const dims = wide ? IMG.desktop : IMG.phone
          return (
            <li key={s.id} className={cn("w-[62%] shrink-0 snap-start sm:w-auto", wide && "w-[88%] sm:col-span-2")}>
              <button type="button" onClick={() => setOpen(s)} className="group block w-full rounded-xl border bg-card p-2 text-left transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src(s)} width={dims.width} height={dims.height} loading="lazy" decoding="async" alt={`${s.title}: ${s.caption}`} className="h-auto w-full rounded-lg border" />
                <span className="mt-2 block px-1 text-sm font-semibold">{s.title}</span>
                <span className="block px-1 pb-1 text-xs text-muted-foreground">{DEVICE_LABELS[s.device]}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className={cn("max-h-[92vh] overflow-auto", open?.device === "desktop" ? "max-w-5xl" : "max-w-md")}>
          {open && (
            <>
              <DialogHeader>
                <DialogTitle>{open.title}</DialogTitle>
                <DialogDescription>{open.caption} · {DEVICE_LABELS[open.device]}</DialogDescription>
              </DialogHeader>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src(open)} alt={`${open.title}: ${open.caption}`} className="h-auto w-full rounded-lg border" />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
