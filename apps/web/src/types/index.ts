type PathSource = { id: string; path: string }
type PostgresSource = { id: string; host: string; port: number; user: string; database: string }
type PostgresContainerSource = { id: string; containerName: string; user: string; database: string }
type DockerComposeSource = { id: string; name: string; path: string; containers: string[] }
type Source = PathSource | PostgresSource | PostgresContainerSource | DockerComposeSource

type LocalDestination = { id: string; path: string; retention?: number }
type SftpDestination = { id: string; host: string; port: number; user: string; path: string; privateKey?: string; retention?: number; parallel?: boolean; timeout?: number }
type Destination = LocalDestination | SftpDestination

interface BackupResult {
  id: string
  success: boolean
  timestamp: string
  archiveName?: string
  archiveSize?: number
  durationMs: number
  destinationResults: { success: boolean; error?: string; durationMs?: number; destLabel?: string; skipped?: boolean }[]
  errors: string[]
}

interface AppConfig {
  schedule?: string
  retention: number
  tempDir?: string
  sources: Source[]
  destinations: Destination[]
  notifications?: { discord?: { webhookUrl: string } }
}

interface SystemStatus {
  daemonRunning: boolean
  backupRunning: boolean
  lastBackup?: BackupResult
  nextSchedule?: string
}

type SourceType = "path" | "postgres" | "postgres-container" | "docker-compose"
type DestinationType = "local" | "sftp"
type NavPage = "dashboard" | "sources" | "destinations" | "schedule" | "notifications" | "history" | "settings"

export type {
  PathSource,
  PostgresSource,
  PostgresContainerSource,
  DockerComposeSource,
  Source,
  SourceType,
  LocalDestination,
  SftpDestination,
  Destination,
  DestinationType,
  BackupResult,
  AppConfig,
  SystemStatus,
  NavPage,
}
