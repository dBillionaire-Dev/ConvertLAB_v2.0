"use client"

import { useEffect, useState } from "react"
import { PageContainer } from "@/components/page-container"
import { AppearanceRadioGroup } from "@/components/theme-toggle"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { clearHistory } from "@/lib/history/db"
import { getReduceMotion, setReduceMotion } from "@/lib/preferences"

export default function SettingsPage() {
  const { toast } = useToast()
  const [reduceMotion, setReduceMotionState] = useState(false)

  useEffect(() => {
    setReduceMotionState(getReduceMotion())
  }, [])

  return (
    <PageContainer title="Settings" description="Appearance, preferences, and local data.">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
            <CardDescription>Choose how ConvertLAB looks on this device.</CardDescription>
          </CardHeader>
          <CardContent>
            <AppearanceRadioGroup />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preferences</CardTitle>
            <CardDescription>Behavior settings for this device.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="reduce-motion" className="font-normal">
                  Reduce motion
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Stops the scrolling banner and other animations, independent of your system setting.
                </p>
              </div>
              <Switch
                id="reduce-motion"
                checked={reduceMotion}
                onCheckedChange={(checked) => {
                  setReduceMotionState(checked)
                  setReduceMotion(checked)
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Local Data</CardTitle>
            <CardDescription>
              Favorites, recently used tools, and calculation history are stored only on this device, nothing is
              sent to a server.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await clearHistory()
                toast({ description: "Calculation history cleared." })
              }}
            >
              Clear calculation history
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem("convertlab:favorites")
                localStorage.removeItem("convertlab:recently-used")
                toast({ description: "Favorites and recently-used tools cleared." })
              }}
            >
              Clear favorites & recently used
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
