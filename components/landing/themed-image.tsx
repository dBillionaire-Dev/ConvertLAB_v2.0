import type { Shot } from "@/lib/landing-data"
import { IMG } from "@/lib/landing-data"

/** Shows the light or dark screenshot to match the site theme (pure CSS, no flash). */
export function ThemedImage({ shot, className, priority = false }: { shot: Shot; className?: string; priority?: boolean }) {
  const dims = shot.device === "desktop" ? IMG.desktop : IMG.phone
  const alt = `${shot.title}: ${shot.caption}`
  const common = { width: dims.width, height: dims.height, alt, decoding: "async" as const, className }
  if (!shot.dark || shot.dark === shot.light) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={shot.light} loading={priority ? "eager" : "lazy"} {...common} />
  }
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shot.light} loading={priority ? "eager" : "lazy"} {...common} className={`${className ?? ""} dark:hidden`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shot.dark} loading="lazy" {...common} className={`${className ?? ""} hidden dark:block`} />
    </>
  )
}
