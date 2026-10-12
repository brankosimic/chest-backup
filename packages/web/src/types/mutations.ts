interface SourceMutationData {
  id: string
  data: Record<string, unknown>
}

interface ScheduleUpdateData {
  schedule: string
  enabled: boolean
}

interface RetentionMode {
  Monthly: "months"
  Weekly: "weeks"
  Forever: "forever"
}

interface RetentionSettings {
  globalRetention: number
  retentionMode: RetentionMode[keyof RetentionMode]
}

interface RetentionUpdateData {
  globalRetention: number
  retentionMode: RetentionSettings["retentionMode"]
}

interface NotificationUpdateData {
  discord?: {
    webhookUrl: string
    enabled: boolean
  }
}

export type { SourceMutationData, ScheduleUpdateData, RetentionMode, RetentionSettings, RetentionUpdateData, NotificationUpdateData }
