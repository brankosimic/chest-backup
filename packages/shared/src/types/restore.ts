import type { DestinationType, RestoreFileStatus, RestorePhase, RestoreStatus } from "./enums"

interface RestoreSnapshot {
  key: string
  fileCount: number
  totalSize: number
  createdAt?: string
}

interface RestoreSnapshotFile {
  path: string
  size: number
}

interface RestoreFileResult {
  path: string
  target: string
  size: number
  status: RestoreFileStatus
  error?: string
}

interface RestoreOptions {
  files?: string[]
  targetRoot?: string
  overwrite?: boolean
  dryRun?: boolean
}

interface RestoreRequest extends RestoreOptions {
  destinationId: string
  periodKey: string
}

interface RestoreResult {
  success: boolean
  files: RestoreFileResult[]
  restoredCount: number
  skippedCount: number
  failedCount: number
  totalFiles: number
  totalBytes: number
  restoredBytes: number
  durationMs: number
  errors: string[]
}

interface RestoreProgressEvent {
  phase: RestorePhase
  totalFiles: number
  completedFiles: number
  restoredCount: number
  skippedCount: number
  failedCount: number
  restoredBytes: number
  currentPath?: string
}

interface RestoreJob {
  id: string
  status: RestoreStatus
  phase: RestorePhase
  destinationId: string
  destinationName?: string
  destinationPath: string
  destinationType: DestinationType
  periodKey: string
  targetRoot: string
  overwrite: boolean
  dryRun: boolean
  startedAt: string
  finishedAt?: string
  totalFiles: number
  completedFiles: number
  restoredCount: number
  skippedCount: number
  failedCount: number
  totalBytes: number
  restoredBytes: number
  currentPath?: string
  files: RestoreFileResult[]
  errors: string[]
  durationMs?: number
}

export type {
  RestoreSnapshot,
  RestoreSnapshotFile,
  RestoreFileResult,
  RestoreOptions,
  RestoreRequest,
  RestoreResult,
  RestoreProgressEvent,
  RestoreJob,
}
