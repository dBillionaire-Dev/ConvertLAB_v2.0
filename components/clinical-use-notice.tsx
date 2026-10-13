import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { CLINICAL_NOTICE_BODY, CLINICAL_NOTICE_TITLE, isHighRiskCategory } from "@/lib/legal"

/**
 * Shown before the inputs on dosing, oncology and stem-cell calculators, so the
 * warning is read before a result exists rather than only underneath it.
 */
export function ClinicalUseNotice({ category }: { category: string }) {
  if (!isHighRiskCategory(category)) return null

  return (
    <div
      role="note"
      className="flex gap-3 rounded-md border border-amber-300/60 bg-amber-50 p-3 text-sm dark:bg-amber-950/20"
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
      <div>
        <p className="font-medium text-amber-900 dark:text-amber-200">{CLINICAL_NOTICE_TITLE}</p>
        <p className="mt-1 text-amber-800 dark:text-amber-300">
          {CLINICAL_NOTICE_BODY}{" "}
          <Link href="/terms" className="font-medium underline underline-offset-2">
            Terms of use
          </Link>
        </p>
      </div>
    </div>
  )
}
