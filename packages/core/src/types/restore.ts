import type { RestoreFileResult, RestoreProgressEvent, RestoreSnapshotFile } from "@chest-backup/shared"
import type { Destination } from "./config"

interface RestoreContext {
  targetRoot: string
  overwrite: boolean
  dryRun: boolean
}

interface FileOutcome {
  result: RestoreFileResult
  bytes: number
}

interface RestoreCounters {
  completed: number
  restored: number
  skipped: number
  failed: number
  bytes: number
}

interface ProgressTotals {
  totalFiles: number
  totalBytes: number
  missingErrors: string[]
}

type RestoreProgressCallback = (event: RestoreProgressEvent) => void

interface RestoreRunArgs {
  dest: Destination
  periodKey: string
  files: RestoreSnapshotFile[]
  missing: string[]
  context: RestoreContext
  onProgress?: RestoreProgressCallback
}

interface FileSelection {
  selected: RestoreSnapshotFile[]
  missing: string[]
}

interface RestoreHandlerArgs {
  files: RestoreSnapshotFile[]
  missing: string[]
  context: RestoreContext
  handler: (file: RestoreSnapshotFile) => Promise<FileOutcome>
  onProgress?: RestoreProgressCallback
}

interface ProcessFilesArgs {
  files: RestoreSnapshotFile[]
  context: RestoreContext
  handler: (file: RestoreSnapshotFile) => Promise<FileOutcome>
  totals: ProgressTotals
  counts: RestoreCounters
  results: RestoreFileResult[]
  onProgress?: RestoreProgressCallback
}

export type { RestoreContext, FileOutcome, RestoreCounters, ProgressTotals, RestoreProgressCallback, RestoreRunArgs, ProcessFilesArgs, FileSelection, RestoreHandlerArgs }
