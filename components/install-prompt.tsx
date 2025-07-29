"use client"

import { useState, useEffect } from "react"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Check if app is already installed
      if (window.matchMedia("(display-mode: standalone)").matches) {
        return
      }

      // Show install prompt after a short delay
      setTimeout(() => {
        setShowInstallPrompt(true)
      }, 2000)
    }

    const handleAppInstalled = () => {
      setShowInstallPrompt(false)
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

    if (outcome === "accepted") {
      setShowInstallPrompt(false)
    }

    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
  }

  if (!showInstallPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 max-w-sm mx-auto">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Install ConvertLab CCU</h3>
          <p className="text-xs text-gray-600 mb-3">Install this app for quick access to medical unit conversions</p>
          <div className="flex space-x-2">
            <Button size="sm" onClick={handleInstallClick} className="flex items-center">
              <Download className="h-4 w-4 mr-1" />
              Install
            </Button>
            <Button size="sm" variant="outline" onClick={handleDismiss}>
              Not now
            </Button>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={handleDismiss} className="p-1">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
