interface SourceMutationData {
  id: string
  data: Record<string, unknown>
}

interface ScheduleUpdateData {
  schedule: string
  enabled: boolean
}

interface RetentionUpdateData {
  globalRetention: number
}

interface NotificationUpdateData {
  discord?: {
    webhookUrl: string
    enabled: boolean
  }
}

export type { SourceMutationData, ScheduleUpdateData, RetentionUpdateData, NotificationUpdateData }
