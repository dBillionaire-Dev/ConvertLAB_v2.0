import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** A laptop screen (16:10). Presentational only. */
export function LaptopFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("w-full", className)}>
      <div className="rounded-t-2xl border-[7px] border-b-0 border-slate-800 bg-slate-800 shadow-2xl dark:border-slate-700 dark:bg-slate-700">
        <div className="relative overflow-hidden rounded-t-lg bg-background">{children}</div>
      </div>
      <div className="mx-auto h-3 w-[104%] -translate-x-[2%] rounded-b-2xl bg-gradient-to-b from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700" />
    </div>
  )
}

/** A phone with a punch-hole camera. Presentational only. */
export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative mx-auto w-full rounded-[2.4rem] border-[9px] border-slate-900 bg-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-700", className)}>
      <div className="relative overflow-hidden rounded-[1.8rem] bg-background">
        <span aria-hidden className="pointer-events-none absolute left-1/2 top-2 z-10 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-slate-900" />
        {children}
      </div>
    </div>
  )
}
