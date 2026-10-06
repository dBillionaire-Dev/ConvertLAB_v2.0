"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { Download, Share, SquarePlus, MoreVertical, Smartphone, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { isIOS, isStandaloneDisplayMode } from "@/lib/platform"
import { LANDING } from "@/lib/landing-config"
import { APP_URL, splitEnabled } from "@/lib/site"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

/** Install the web app (PWA): uses the browser's install prompt when it exists, otherwise shows step-by-step instructions. */
export function InstallPwaButton({ variant = "outline", size = "lg", className }: { variant?: "default" | "outline" | "secondary"; size?: "default" | "sm" | "lg"; className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [standalone, setStandalone] = useState(false)
  const [ios, setIos] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setStandalone(isStandaloneDisplayMode())
    setIos(isIOS())
    const onPrompt = (e: Event) => setDeferred(e as BeforeInstallPromptEvent)
    const onInstalled = () => { setDeferred(null); setStandalone(true) }
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  const onClick = useCallback(async () => {
    if (deferred) {
      try {
        await deferred.prompt()
        await deferred.userChoice
        setDeferred(null)
        return
      } catch {
        // The prompt may already have been used elsewhere on the page: fall back to the instructions.
      }
    }
    setOpen(true)
  }, [deferred])

  // Two-domain setup: the landing site is not the installable app. Send people to the app, where the browser can install it.
  if (splitEnabled) {
    return (
      <Button asChild variant={variant} size={size} className={className}>
        <a href={`${APP_URL}/`}><Download className="mr-2 h-4 w-4" aria-hidden />Install as an app</a>
      </Button>
    )
  }

  if (standalone) {
    return (
      <Button asChild variant={variant} size={size} className={className}>
        <Link href="/"><Smartphone className="mr-2 h-4 w-4" aria-hidden />Open the app</Link>
      </Button>
    )
  }

  return (
    <>
      <Button type="button" variant={variant} size={size} className={className} onClick={onClick}>
        <Download className="mr-2 h-4 w-4" aria-hidden />Install as an app
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install ConvertLAB</DialogTitle>
            <DialogDescription>It opens like an app, works offline, and uses almost no storage.</DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm">
            <li className={ios ? "rounded-md bg-accent p-3" : "p-3"}>
              <b>iPhone or iPad (Safari)</b>
              <p className="mt-1 text-muted-foreground">Tap <Share className="inline h-4 w-4" aria-label="Share" /> Share, then <SquarePlus className="inline h-4 w-4" aria-label="Add" /> <b>Add to Home Screen</b>.</p>
            </li>
            <li className={!ios ? "rounded-md bg-accent p-3" : "p-3"}>
              <b>Android (Chrome)</b>
              <p className="mt-1 text-muted-foreground">Tap <MoreVertical className="inline h-4 w-4" aria-label="Menu" /> then <b>Install app</b> (or <b>Add to Home screen</b>).</p>
            </li>
            <li className="p-3">
              <b>Computer (Chrome or Edge)</b>
              <p className="mt-1 text-muted-foreground">Click the install icon at the right end of the address bar, then <b>Install</b>.</p>
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Google Play button, a direct APK link, or an honest "coming soon" until one is configured. */
export function AndroidButton({ variant = "secondary", size = "lg", className }: { variant?: "default" | "outline" | "secondary"; size?: "default" | "sm" | "lg"; className?: string }) {
  if (LANDING.playStoreUrl) {
    return (
      <Button asChild variant={variant} size={size} className={className}>
        <a href={LANDING.playStoreUrl} target="_blank" rel="noopener noreferrer">
          <Smartphone className="mr-2 h-4 w-4" aria-hidden />Get it on Google Play<ExternalLink className="ml-2 h-3.5 w-3.5 opacity-70" aria-hidden />
        </a>
      </Button>
    )
  }
  if (LANDING.apkUrl) {
    return (
      <Button asChild variant={variant} size={size} className={className}>
        <a href={LANDING.apkUrl} rel="noopener noreferrer">
          <Download className="mr-2 h-4 w-4" aria-hidden />Download the Android app (APK)
        </a>
      </Button>
    )
  }
  return (
    <Button type="button" variant={variant} size={size} className={className} disabled aria-disabled="true">
      <Smartphone className="mr-2 h-4 w-4" aria-hidden />Android app: coming soon
    </Button>
  )
}

export const androidAvailable = Boolean(LANDING.playStoreUrl || LANDING.apkUrl)
