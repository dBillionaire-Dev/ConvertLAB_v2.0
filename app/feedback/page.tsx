import type { Metadata } from "next"
import { FeedbackForm } from "@/components/feedback-form"

export const metadata: Metadata = {
  title: "Feedback",
  description: "Tell us how Clinexia is working for you.",
  robots: { index: false, follow: false },
}

export default function FeedbackPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <FeedbackForm />
    </div>
  )
}
