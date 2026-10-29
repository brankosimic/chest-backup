interface SourceMutationData {
  id: string
  data: Record<string, unknown>
}

interface ScheduleUpdateData {
  schedule: string
  enabled: boolean
}

type RetentionMode = "months" | "weeks" | "forever"

interface RetentionSettings {
  globalRetention: number
  retentionMode: RetentionMode
}

interface RetentionUpdateData {
  globalRetention: number
  retentionMode: RetentionMode
}

interface DiscordNotification {
  webhookUrl: string
  enabled: boolean
}

interface NotificationInfo {
  discord?: DiscordNotification
}

interface NotificationUpdateData {
  discord?: DiscordNotification
}

interface ExcludeUpdateData {
  patterns: string[]
}

interface ExcludeSettings {
  patterns: string[]
}

export type {
  SourceMutationData,
  ScheduleUpdateData,
  RetentionMode,
  RetentionSettings,
  RetentionUpdateData,
  DiscordNotification,
  NotificationInfo,
  NotificationUpdateData,
  ExcludeUpdateData,
  ExcludeSettings,
}
