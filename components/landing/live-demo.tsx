"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, ExternalLink, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DEMO, IMG, SHOTS, shotById, type DemoScenario } from "@/lib/landing-data"
import { LaptopFrame, PhoneFrame } from "@/components/landing/device-frame"
import { ThemedImage } from "@/components/landing/themed-image"
import { cn } from "@/lib/utils"
import { appHref } from "@/lib/site"

const SCREEN = { desktop: { w: 1280, h: 800 }, phone: { w: 390, h: 844 } } as const

/** Scales a fixed-size page (an iframe) down to the width of its container. */
function useFitScale(designWidth: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setScale(el.clientWidth / designWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [designWidth])
  return { ref, scale }
}

function LiveScreen({ kind, scenarios }: { kind: "desktop" | "phone"; scenarios: DemoScenario[] }) {
  const [id, setId] = useState(scenarios[0].id)
  const [live, setLive] = useState(false)
  const scenario = scenarios.find((s) => s.id === id) ?? scenarios[0]
  const size = SCREEN[kind]
  const { ref, scale } = useFitScale(size.w)
  const poster = shotById(scenario.poster)
  const dims = kind === "desktop" ? IMG.desktop : IMG.phone
  const ready = scale > 0

  const screen = (
    <div ref={ref} className="relative w-full" style={{ aspectRatio: `${size.w} / ${size.h}` }}>
      {live && ready ? (
        <div style={{ width: size.w, height: size.h, transform: `scale(${scale})`, transformOrigin: "top left" }} className="absolute left-0 top-0">
          <iframe
            key={scenario.path}
            src={appHref(scenario.path)}
            title={`Live Clinexia demo: ${scenario.label}`}
            width={size.w}
            height={size.h}
            className="block border-0"
            loading="lazy"
          />
        </div>
      ) : (
        <>
          <ThemedImage shot={poster} className="absolute inset-0 h-full w-full object-cover object-top" />
          <button
            type="button"
            onClick={() => setLive(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors hover:bg-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Try the live demo: ${scenario.label}`}
          >
            <span className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg">
              <Play className="h-4 w-4" aria-hidden />Try it live
            </span>
          </button>
        </>
      )}
    </div>
  )
  void dims

  return (
    <div className="flex flex-col items-center gap-5">
      <div role="group" aria-label="Choose a page to try" className="flex flex-wrap justify-center gap-2">
        {scenarios.map((s) => (
          <Button key={s.id} type="button" size="sm" variant={s.id === id ? "default" : "outline"} aria-pressed={s.id === id} onClick={() => setId(s.id)}>
            {s.label}
          </Button>
        ))}
      </div>
      {kind === "desktop" ? (
        <div className="w-full max-w-4xl"><LaptopFrame>{screen}</LaptopFrame></div>
      ) : (
        <div className="w-[min(300px,80vw)]"><PhoneFrame>{screen}</PhoneFrame></div>
      )}
      <p className="text-center text-sm text-muted-foreground">
        {live ? "This is the real app: type values, press Calculate, explore." : "Press “Try it live” to use the real app right here."}{" "}
        <a href={appHref(scenario.path)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
          Open full screen <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </p>
    </div>
  )
}

function AppScreens() {
  const shots = SHOTS.filter((s) => s.device === "app")
  const [i, setI] = useState(0)
  const shot = shots[i]
  const go = (d: number) => setI((n) => (n + d + shots.length) % shots.length)
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-3">
        <Button type="button" size="icon" variant="outline" aria-label="Previous screen" onClick={() => go(-1)}><ChevronLeft className="h-4 w-4" /></Button>
        <div className="w-[min(300px,70vw)]">
          <PhoneFrame><ThemedImage shot={shot} className="block h-auto w-full" priority /></PhoneFrame>
        </div>
        <Button type="button" size="icon" variant="outline" aria-label="Next screen" onClick={() => go(1)}><ChevronRight className="h-4 w-4" /></Button>
      </div>
      <div role="group" aria-label="Choose an Android screen" className="flex max-w-2xl flex-wrap justify-center gap-2">
        {shots.map((s, n) => (
          <Button key={s.id} type="button" size="sm" variant={n === i ? "default" : "outline"} aria-pressed={n === i} onClick={() => setI(n)}>{s.title}</Button>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground" aria-live="polite">{shot.title}: {shot.caption}. Screenshots of the Android app.</p>
    </div>
  )
}

export function LiveDemo() {
  return (
    <Tabs defaultValue="desktop" className="w-full">
      <TabsList className="mx-auto grid w-full max-w-xl grid-cols-3">
        <TabsTrigger value="desktop">Web</TabsTrigger>
        <TabsTrigger value="phone">Phone (PWA)</TabsTrigger>
        <TabsTrigger value="app">Android app</TabsTrigger>
      </TabsList>
      <TabsContent value="desktop" className={cn("mt-8")}><LiveScreen kind="desktop" scenarios={DEMO.desktop} /></TabsContent>
      <TabsContent value="phone" className="mt-8"><LiveScreen kind="phone" scenarios={DEMO.phone} /></TabsContent>
      <TabsContent value="app" className="mt-8"><AppScreens /></TabsContent>
    </Tabs>
  )
}
