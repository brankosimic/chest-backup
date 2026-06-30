interface BackupSource {
  type: "path" | "postgres" | "postgres-container" | "docker-compose"
  label: string
  path?: string
  name?: string
  containerName?: string
  database?: string
  containers?: string[]
}

interface BackupDestination {
  type: "local" | "sftp"
  path: string
  host?: string
  port?: number
  user?: string
  retention?: number
  parallel?: boolean
  skip?: boolean
}

interface StoreResultData {
  success: boolean
  error?: string
  durationMs?: number
  destLabel?: string
  speed?: number
  skipped?: boolean
  skippedReason?: string
}

interface BackupRecord {
  id: string
  timestamp: string
  success: boolean
  durationMs: number
  archiveName?: string
  archiveSize?: number
  destinationResults: StoreResultData[]
  errors: string[]
}

interface DaemonStatus {
  running: boolean
  state: "idle" | "running" | "success" | "error"
  message: string
  lastBackup: BackupRecord | null
  schedule: string
  uptime: number
}

interface ConfigView {
  schedule?: string
  retention: number
  sources: BackupSource[]
  destinations: BackupDestination[]
  hasDiscordNotifications: boolean
}

interface DashboardStats {
  totalBackups: number
  successfulBackups: number
  failedBackups: number
  lastBackup: BackupRecord | null
  nextScheduled: string | null
  uptime: number
}

export type {
  BackupSource,
  BackupDestination,
  StoreResultData,
  BackupRecord,
  DaemonStatus,
  ConfigView,
  DashboardStats,
}
