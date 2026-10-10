"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { Download, Share, SquarePlus, MoreVertical, Smartphone, ExternalLink, Monitor } from "lucide-react"
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
            <DialogTitle>Install Clinexia</DialogTitle>
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

/** The first Android channel that is configured: Google Play, then the Firebase beta, then a direct APK. Otherwise an honest "coming soon". */
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
  if (LANDING.firebaseUrl) {
    return (
      <Button asChild variant={variant} size={size} className={className}>
        <a href={LANDING.firebaseUrl} target="_blank" rel="noopener noreferrer">
          <Smartphone className="mr-2 h-4 w-4" aria-hidden />Join the Android beta<ExternalLink className="ml-2 h-3.5 w-3.5 opacity-70" aria-hidden />
        </a>
      </Button>
    )
  }
  if (LANDING.apkUrl) {
    return (
      <Button asChild variant={variant} size={size} className={className}>
        <a href={LANDING.apkUrl} rel="noopener noreferrer" download>
          <Download className="mr-2 h-4 w-4" aria-hidden />Download for Android (APK)
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

function Channel({ title, status, children }: { title: string; status: "ready" | "soon"; children: React.ReactNode }) {
  return (
    <li className="rounded-lg border bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{title}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status === "ready" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>
          {status === "ready" ? "Available" : "Coming soon"}
        </span>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{children}</div>
    </li>
  )
}

/** All the ways to get the Android app, each honest about whether it exists yet. */
export function AndroidChannels() {
  return (
    <ul className="mt-4 space-y-2">
      <Channel title="Google Play" status={LANDING.playStoreUrl ? "ready" : "soon"}>
        {LANDING.playStoreUrl ? (
          <a className="font-medium text-primary underline-offset-4 hover:underline" href={LANDING.playStoreUrl} target="_blank" rel="noopener noreferrer">Open the Play Store listing</a>
        ) : "Automatic updates once the listing is live."}
      </Channel>
      <Channel title="Beta on Firebase App Distribution" status={LANDING.firebaseUrl ? "ready" : "soon"}>
        {LANDING.firebaseUrl ? (
          <a className="font-medium text-primary underline-offset-4 hover:underline" href={LANDING.firebaseUrl} target="_blank" rel="noopener noreferrer">Join the beta testers</a>
        ) : "Early builds for testers, by invitation link."}
      </Channel>
      <Channel title={`Direct download (APK)${LANDING.apkVersion ? ` · v${LANDING.apkVersion}` : ""}`} status={LANDING.apkUrl ? "ready" : "soon"}>
        {LANDING.apkUrl ? (
          <>
            <a className="font-medium text-primary underline-offset-4 hover:underline" href={LANDING.apkUrl} rel="noopener noreferrer" download>Download the APK</a>
            {LANDING.apkSha256 && (
              <p className="mt-2 break-all">SHA-256: <code className="rounded bg-muted px-1 py-0.5 text-[10px]">{LANDING.apkSha256}</code></p>
            )}
            <details className="mt-2">
              <summary className="cursor-pointer font-medium text-foreground">How to install it</summary>
              <ol className="mt-1 list-decimal space-y-1 pl-4">
                <li>Open the downloaded file. Android may ask you to allow installs from your browser or Files app: allow it for this install.</li>
                <li>Tap Install. If Play Protect warns about an app from outside the Play Store, choose to install anyway only if you downloaded it from this page.</li>
                <li>Optional: compare the SHA-256 above with the file&apos;s checksum before installing.</li>
              </ol>
            </details>
          </>
        ) : "A signed APK file you can install without the Play Store."}
      </Channel>
    </ul>
  )
}

/** Windows: the Microsoft Store listing (packaged with PWABuilder) when it exists. */
export function WindowsButton({ variant = "secondary", size = "default", className }: { variant?: "default" | "outline" | "secondary"; size?: "default" | "sm" | "lg"; className?: string }) {
  if (LANDING.microsoftStoreUrl) {
    return (
      <Button asChild variant={variant} size={size} className={className}>
        <a href={LANDING.microsoftStoreUrl} target="_blank" rel="noopener noreferrer">
          <Monitor className="mr-2 h-4 w-4" aria-hidden />Get it from Microsoft Store<ExternalLink className="ml-2 h-3.5 w-3.5 opacity-70" aria-hidden />
        </a>
      </Button>
    )
  }
  return (
    <Button type="button" variant={variant} size={size} className={className} disabled aria-disabled="true">
      <Monitor className="mr-2 h-4 w-4" aria-hidden />Microsoft Store: coming soon
    </Button>
  )
}
