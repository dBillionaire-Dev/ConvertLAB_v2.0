"use client"

// Themed replacements for window.confirm / window.prompt. Call them from anywhere (no provider or JSX needed):
//   if (await confirmDialog({ title: "Delete it?", destructive: true })) ...
//   const reason = await promptDialog({ title: "Why?", label: "Reason" })   // string, or null if cancelled
import { useState, type ReactNode } from "react"
import { createRoot } from "react-dom/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export interface ConfirmOptions {
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

export interface PromptOptions extends ConfirmOptions {
  label: string
  placeholder?: string
  multiline?: boolean
  /** Return an error message to block confirming, or null when the value is fine. */
  validate?: (value: string) => string | null
  /** If set, the confirm button stays disabled until the person types exactly this (case-insensitive). */
  mustType?: string
}

type Props = { opts: ConfirmOptions | PromptOptions; prompt: boolean; onDone: (value: string | boolean | null) => void }

function Modal({ opts, prompt, onDone }: Props) {
  const [open, setOpen] = useState(true)
  const [value, setValue] = useState("")
  const [touched, setTouched] = useState(false)
  const p = opts as PromptOptions

  const finish = (v: string | boolean | null) => {
    setOpen(false)
    onDone(v)
  }
  const trimmed = value.trim()
  const error = !prompt ? null : p.mustType !== undefined ? (trimmed.toLowerCase() === p.mustType.trim().toLowerCase() ? null : `Type ${p.mustType} to continue.`) : p.validate ? p.validate(trimmed) : trimmed ? null : "This is required."
  const submit = () => {
    if (prompt) {
      setTouched(true)
      if (error) return
      finish(trimmed)
    } else finish(true)
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) finish(prompt ? null : false) }}>
      <AlertDialogContent>
        <form onSubmit={(e) => { e.preventDefault(); submit() }} className="space-y-4">
          <AlertDialogHeader>
            <AlertDialogTitle>{opts.title}</AlertDialogTitle>
            {opts.description ? <AlertDialogDescription>{opts.description}</AlertDialogDescription> : null}
          </AlertDialogHeader>
          {prompt && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="app-dialog-field">{p.label}</label>
              {p.multiline ? (
                <textarea id="app-dialog-field" autoFocus rows={3} value={value} placeholder={p.placeholder} onChange={(e) => setValue(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              ) : (
                <Input id="app-dialog-field" autoFocus value={value} placeholder={p.placeholder} onChange={(e) => setValue(e.target.value)} />
              )}
              {touched && error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
            </div>
          )}
          <AlertDialogFooter>
            <Button type="button" variant="outline" onClick={() => finish(prompt ? null : false)}>{opts.cancelLabel ?? "Cancel"}</Button>
            <Button type="submit" variant={opts.destructive ? "destructive" : "default"} disabled={prompt && Boolean(error)}>{opts.confirmLabel ?? (prompt ? "Continue" : "Confirm")}</Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function show(opts: ConfirmOptions | PromptOptions, prompt: boolean): Promise<string | boolean | null> {
  if (typeof document === "undefined") return Promise.resolve(prompt ? null : false)
  return new Promise((resolve) => {
    const host = document.createElement("div")
    document.body.appendChild(host)
    const root = createRoot(host)
    let settled = false
    const onDone = (v: string | boolean | null) => {
      if (settled) return
      settled = true
      resolve(v)
      window.setTimeout(() => { root.unmount(); host.remove() }, 300) // let the closing animation finish
    }
    root.render(<Modal opts={opts} prompt={prompt} onDone={onDone} />)
  })
}

export const confirmDialog = (opts: ConfirmOptions) => show(opts, false) as Promise<boolean>
export const promptDialog = (opts: PromptOptions) => show(opts, true) as Promise<string | null>
