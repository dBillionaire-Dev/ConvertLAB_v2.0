import type { Metadata } from "next"
import { DiagnosticsPanel } from "@/components/diagnostics-panel"

// Hidden support page: not linked anywhere, not in the sitemap, and asks search engines not to index it.
export const metadata: Metadata = {
  title: "Diagnostics",
  robots: { index: false, follow: false },
}

export default function DiagnosticsPage() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8">
      <DiagnosticsPanel />
    </div>
  )
}
