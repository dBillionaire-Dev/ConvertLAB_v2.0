import Link from "next/link"
import type { ComponentProps } from "react"
import { APP_URL, splitEnabled } from "@/lib/site"

/** A link into the app. Absolute (to the app domain) in the two-domain setup, a normal client link otherwise. */
export function AppLink({ path = "/", children, ...rest }: Omit<ComponentProps<"a">, "href"> & { path?: string }) {
  if (splitEnabled) return <a href={`${APP_URL}${path}`} {...rest}>{children}</a>
  return <Link href={path} {...rest}>{children}</Link>
}
