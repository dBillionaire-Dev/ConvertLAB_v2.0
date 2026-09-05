"use client"

import { useState, useEffect } from "react"
import { Download, X, Share, SquarePlus, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { isIOS, isStandaloneDisplayMode, needsManualInstallInstructions } from "@/lib/platform"

const DISMISSED_KEY = "convertlab:install-prompt-dismissed"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showNativeBanner, setShowNativeBanner] = useState(false)
  const [showManualBanner, setShowManualBanner] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [platform, setPlatform] = useState<"ios" | "mac" | null>(null)

  useEffect(() => {
    if (isStandaloneDisplayMode()) return
    if (window.localStorage.getItem(DISMISSED_KEY) === "true") return

    if (needsManualInstallInstructions()) {
      setPlatform(isIOS() ? "ios" : "mac")
      setShowManualBanner(true)
      return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShowNativeBanner(true), 2000)
    }

    const handleAppInstalled = () => {
      setShowNativeBanner(false)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") setShowNativeBanner(false)
    setDeferredPrompt(null)
  }

  const dismiss = (permanently: boolean) => {
    setShowNativeBanner(false)
    setShowManualBanner(false)
    if (permanently) window.localStorage.setItem(DISMISSED_KEY, "true")
  }

  if (showNativeBanner && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-background border rounded-lg shadow-lg p-4 z-50 max-w-sm mx-auto">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="text-sm font-semibold mb-1">Install ConvertLAB</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Install this app for quick access and offline calculations.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleInstallClick}>
                <Download className="h-4 w-4 mr-1" />
                Install
              </Button>
              <Button size="sm" variant="outline" onClick={() => dismiss(false)}>
                Not now
              </Button>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => dismiss(true)} className="p-1 h-auto shrink-0" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  if (showManualBanner) {
    return (
      <>
        <div className="fixed bottom-4 left-4 right-4 bg-background border rounded-lg shadow-lg p-4 z-50 max-w-sm mx-auto">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="text-sm font-semibold mb-1">Install ConvertLAB on your {platform === "ios" ? "iPhone or iPad" : "Mac"}</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Add it to your {platform === "ios" ? "Home Screen" : "Dock"} for quick access and offline calculations.
              </p>
              <Button size="sm" onClick={() => setShowInstructions(true)}>
                Click here for how to install
              </Button>
            </div>
            <Button size="sm" variant="ghost" onClick={() => dismiss(true)} className="p-1 h-auto shrink-0" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Install ConvertLAB</DialogTitle>
              <DialogDescription>
                {platform === "ios"
                  ? "Safari doesn't offer an automatic install button — a few taps does it:"
                  : "Safari doesn't offer an automatic install button — a couple of clicks does it:"}
              </DialogDescription>
            </DialogHeader>

            {platform === "ios" ? (
              <ol className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">1</span>
                  <span className="flex items-center gap-1.5 pt-0.5">
                    Tap the Share button <Share className="h-4 w-4 inline shrink-0" aria-hidden /> in Safari's toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">2</span>
                  <span className="flex items-center gap-1.5 pt-0.5">
                    Scroll down and tap <SquarePlus className="h-4 w-4 inline shrink-0" aria-hidden /> "Add to Home Screen".
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">3</span>
                  <span className="pt-0.5">Tap "Add" in the top right.</span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">1</span>
                  <span className="flex items-center gap-1.5 pt-0.5">
                    Click the Share button <Share className="h-4 w-4 inline shrink-0" aria-hidden /> in Safari's toolbar
                    (or <MoreVertical className="h-4 w-4 inline shrink-0" aria-hidden /> the File menu).
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">2</span>
                  <span className="pt-0.5">Choose "Add to Dock".</span>
                </li>
              </ol>
            )}
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return null
}
