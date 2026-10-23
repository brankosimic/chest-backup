enum SourceErrorCode {
  Duplicate = "duplicate_source",
  NotFound = "source_not_found",
}

enum DestinationType {
  Local = "local",
  Sftp = "sftp",
}

enum RunStatus {
  Success = "success",
  Partial = "partial",
  Failed = "failed",
  Skipped = "skipped",
  Running = "running",
}

enum RunTrigger {
  Manual = "manual",
  Scheduled = "scheduled",
}

enum LogLevel {
  Debug = "debug",
  Info = "info",
  Warn = "warn",
  Error = "error",
  Fatal = "fatal",
}

interface Source {
  id: string
  type: "path" | "postgres" | "postgres-container" | "container-volume" | "sqlite" | "sqlite-container"
  path?: string
  isFile?: boolean
  host?: string
  port?: number
  user?: string
  password?: string
  database?: string
  containerName?: string
  name?: string
  containers?: string[]
  volumePath?: string
  include?: string[]
  dbPath?: string
  createdAt: string
  updatedAt: string
}

interface Destination {
  id: string
  type: DestinationType
  name?: string
  path: string
  host?: string
  port?: number
  user?: string
  password?: string
  privateKey?: string
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

interface NotificationConfig {
  discord?: {
    webhookUrl: string
    enabled: boolean
  }
}

interface StoreResult {
  success: boolean
  error?: string
  durationMs?: number
  destId?: string
  destName?: string
  destPath?: string
  destType?: DestinationType
  destLabel?: string
  speed?: number
  skipped?: boolean
  skippedReason?: string
  uploaded?: string[]
  deleted?: string[]
  uploadedCount?: number
  deletedCount?: number
  failedCount?: number
  vanishedCount?: number
}

interface BackupRecord {
  id: string
  runId: string
  /** Absent on records written by older API builds. */
  status?: RunStatus
  success: boolean
  trigger: RunTrigger
  /** Wall-clock label derived from the run stamp (YYYYMMDD-HHMMSS). */
  timestamp: string
  /** Real UTC instant the run started. */
  startedAt: string
  /** Real UTC instant the run finished. */
  finishedAt: string
  archiveName?: string
  archiveSize?: number
  durationMs: number
  destinationResults: StoreResult[]
  errors: string[]
  filesBackedUp?: number
  filesChanged?: number
  totalUploadedBytes?: number
}

interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  message: string
  runId?: string
  metadata?: Record<string, unknown>
}

interface RunStats {
  total: number
  success: number
  failed: number
  partial: number
  skipped: number
  avgDuration: number
  totalUploadedBytes: number
  filesChanged: number
}

interface ResourceUsage {
  used: number
  total: number
}

interface SystemInfo {
  version: string
  uptime: number
  status: "running" | "idle" | "error"
  cpuUsage: number
  memoryUsage: ResourceUsage
  diskUsage: ResourceUsage
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  code?: string
}

/**
 * Derives the run status from the overall result and the per-destination outcomes.
 * - every destination skipped  -> skipped (nothing to upload)
 * - all destinations succeeded -> success
 * - some succeeded, some failed -> partial
 * - everything failed           -> failed
 */
const deriveRunStatus = (input: {
  success: boolean
  results: { success: boolean; skipped?: boolean }[]
}): RunStatus => {
  const results = input.results
  if (results.length > 0 && results.every((r) => r.skipped)) return RunStatus.Skipped
  if (input.success) return RunStatus.Success
  if (results.some((r) => r.success)) return RunStatus.Partial
  return RunStatus.Failed
}

// --- Utility types for frontend use (subset without server-only fields) ---

type WebSource = Omit<Source, "createdAt" | "updatedAt">
type WebDestination = Omit<Destination, "createdAt" | "updatedAt">

export {
  SourceErrorCode,
  DestinationType,
  RunStatus,
  RunTrigger,
  LogLevel,
  deriveRunStatus,
  type Source,
  type Destination,
  type Schedule,
  type NotificationConfig,
  type BackupRecord,
  type StoreResult,
  type LogEntry,
  type RunStats,
  type ResourceUsage,
  type SystemInfo,
  type ApiResponse,
  type WebSource,
  type WebDestination,
}
