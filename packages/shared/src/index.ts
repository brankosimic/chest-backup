interface Source {
  id: string
  type: "path" | "postgres" | "postgres-container" | "docker-compose"
  path?: string
  host?: string
  port?: number
  user?: string
  password?: string
  database?: string
  containerName?: string
  name?: string
  containers?: string[]
  createdAt: string
  updatedAt: string
}

interface Destination {
  id: string
  type: "local" | "sftp"
  path: string
  host?: string
  port?: number
  user?: string
  password?: string
  privateKey?: string
  retention?: number
  parallel?: boolean
  timeout?: number
  skip?: boolean
  createdAt: string
  updatedAt: string
}

interface Schedule {
  schedule: string
  enabled: boolean
  lastRun?: string
  nextRun?: string
}

interface RetentionConfig {
  globalRetention: number
  destinations: { id: string; retention: number }[]
}

interface NotificationConfig {
  discord?: {
    webhookUrl: string
    enabled: boolean
  }
}

interface BackupRecord {
  id: string
  timestamp: string
  success: boolean
  archiveName?: string
  archiveSize?: number
  durationMs: number
  destinationResults: StoreResult[]
  errors: string[]
}

interface StoreResult {
  success: boolean
  error?: string
  durationMs?: number
  destLabel?: string
  speed?: number
  skipped?: boolean
  skippedReason?: string
}

interface LogEntry {
  id: string
  timestamp: string
  level: "debug" | "info" | "warn" | "error" | "fatal"
  message: string
  metadata?: Record<string, unknown>
}

interface SystemInfo {
  version: string
  uptime: number
  status: "running" | "idle" | "error"
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// --- Utility types for frontend use (subset without server-only fields) ---

interface WebSource extends Omit<Source, "createdAt" | "updatedAt"> {}
interface WebDestination extends Omit<Destination, "createdAt" | "updatedAt"> {}

export type {
  Source,
  Destination,
  Schedule,
  RetentionConfig,
  NotificationConfig,
  BackupRecord,
  StoreResult,
  LogEntry,
  SystemInfo,
  ApiResponse,
  WebSource,
  WebDestination,
}
