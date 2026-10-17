import { rest } from "@/lib/traction/admin-data"
import { DEFAULT_CONFIG, type FeedbackConfig } from "./schedule"
import type { FeedbackRow } from "./summary"
import { toRow, type Submission } from "./submission"

type Settings = { enabled: boolean; survey_version: number; remind_after_hours: number; max_reminders: number }

export async function getFeedbackConfig(): Promise<FeedbackConfig> {
  try {
    const [row] = await rest().selectAll("feedback_settings", "select=*&id=eq.1")
    if (!row) return DEFAULT_CONFIG
    return { enabled: row.enabled === true, version: row.survey_version, remindAfterHours: row.remind_after_hours, maxReminders: row.max_reminders }
  } catch {
    return DEFAULT_CONFIG // storage not ready: stay quiet rather than ask for answers that cannot be saved
  }
}

async function readSettings(): Promise<Settings> {
  const c = await getFeedbackConfig()
  return { enabled: c.enabled, survey_version: c.version, remind_after_hours: c.remindAfterHours, max_reminders: c.maxReminders }
}

export async function saveFeedbackSettings(patch: Partial<Settings>): Promise<void> {
  const next = { ...(await readSettings()), ...patch }
  await rest().upsert("feedback_settings", [{ id: 1, ...next, updated_at: new Date().toISOString() }], "id")
}

export async function saveFeedback(submission: Submission): Promise<void> {
  await rest().upsert("feedback_responses", [toRow(submission)], "anonymous_id,survey_version")
}

export type StoredFeedback = FeedbackRow & {
  id: string
  created_at: string
  survey_version: number
  anonymous_id: string
  platform: string | null
  app_version: string | null
  improve: string | null
  missing: string | null
  other: string | null
}

/** Production responses, newest first. `version` null = every round. */
export async function listFeedback(version: number | null): Promise<StoredFeedback[]> {
  const filter = version === null ? "" : `&survey_version=eq.${version}`
  return (await rest().selectAll("feedback_responses", `select=*&environment=eq.production${filter}&order=created_at.desc`)) as StoredFeedback[]
}

export async function deleteFeedback(id: string): Promise<void> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return
  await rest().delete("feedback_responses", `id=eq.${id}`)
}
