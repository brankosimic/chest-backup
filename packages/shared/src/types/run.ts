import type { DestinationType, LogLevel, RunStatus, RunTrigger } from "./enums"

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

export type { StoreResult, BackupRecord, LogEntry, RunStats }
