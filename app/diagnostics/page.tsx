import type { Metadata } from "next"
import { DiagnosticsPanel } from "@/components/diagnostics-panel"

// Hidden support page: not linked anywhere, not in the sitemap, and asks search engines not to index it.
export const metadata: Metadata = {
  title: "Diagnostics",
  robots: { index: false, follow: false },
}

export default function DiagnosticsPage() {
  return (
    <div className="dark min-h-screen bg-neutral-950  text-neutral-100 w-full px-4 py-8 sm:px-8">
      <DiagnosticsPanel />
    </div>
  )
}
