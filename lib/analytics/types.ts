export interface CalculationEvent {
  id: string
  anonymousId: string
  calculatorId: string
  calculatorName: string
  category: string
  occurredAt: string
  appVersion: string
  wasOffline: boolean
  source: "web" | "pwa"
  environment: string
}

export interface AnalyticsSnapshot {
  total: number
  today: number
  thisWeek: number
  offlineSynced: number
  historyBackfilled: number
  topCalculators: Array<{ calculatorId: string; calculatorName: string; uses: number }>
  categories: Array<{ category: string; uses: number }>
  sources: Array<{ source: string; uses: number }>
  environments: Array<{ environment: string; uses: number }>
  versions: Array<{ appVersion: string; uses: number }>
  daily: Array<{ date: string; uses: number }>
  lastEvent: {
    calculatorName: string
    source: string
    environment: string
    appVersion: string
    receivedAt: string
  } | null
}
