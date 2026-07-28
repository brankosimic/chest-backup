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

interface FetchPostgresParams {
  type: "postgres" | "postgres-container"
  host?: string
  port?: number
  user: string
  password: string
  containerName?: string
  database?: string
}

export type { SourceMutationData, ScheduleUpdateData, RetentionUpdateData, NotificationUpdateData, FetchPostgresParams }
