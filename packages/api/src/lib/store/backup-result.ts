import type { BackupResult } from "@core/types/index"
import type { BackupRecord, StoreResult } from "@chest-backup/shared"
import { LogLevel, deriveRunStatus } from "@chest-backup/shared"
import { addBackupRecord } from "./backups"
import { addLogEntry } from "./logs"

/** How many individual file paths are kept per destination result. */
const MAX_PATHS_PER_RESULT = 25

const trimPaths = (paths: string[] | undefined): { paths: string[]; count: number } => {
  const list = paths ?? []
  return { paths: list.slice(0, MAX_PATHS_PER_RESULT), count: list.length }
}

const toStoreResult = (result: StoreResult): StoreResult => {
  const uploaded = trimPaths(result.uploaded)
  const deleted = trimPaths(result.deleted)

  return {
    ...result,
    uploadedCount: result.uploadedCount ?? uploaded.count,
    deletedCount: result.deletedCount ?? deleted.count,
    uploaded: uploaded.paths,
    deleted: deleted.paths,
  }
}

const toBackupRecord = (result: BackupResult): BackupRecord => ({
  id: result.runId,
  runId: result.runId,
  status: deriveRunStatus({ success: result.success, results: result.destinationResults }),
  success: result.success,
  trigger: result.trigger,
  timestamp: result.timestamp,
  startedAt: result.startedAt,
  finishedAt: result.finishedAt,
  durationMs: result.durationMs,
  destinationResults: result.destinationResults.map(toStoreResult),
  errors: result.errors,
  ...(result.archiveName ? { archiveName: result.archiveName } : {}),
  ...(result.archiveSize !== undefined ? { archiveSize: result.archiveSize } : {}),
  ...(result.filesBackedUp !== undefined ? { filesBackedUp: result.filesBackedUp } : {}),
  ...(result.filesChanged !== undefined ? { filesChanged: result.filesChanged } : {}),
  ...(result.totalUploadedBytes !== undefined ? { totalUploadedBytes: result.totalUploadedBytes } : {}),
})

const logResult = (result: BackupResult): void => {
  const changed = result.filesChanged ?? 0
  const total = result.filesBackedUp ?? 0
  const summary = `${String(changed)}/${String(total)} files changed`
  const outcome = result.success ? "completed" : "failed"

  addLogEntry({
    id: `log-${result.runId}`,
    timestamp: result.finishedAt,
    level: result.success ? LogLevel.Info : LogLevel.Error,
    message: `Backup ${outcome}: ${summary} (${String(Math.round(result.durationMs / 1000))}s)`,
    runId: result.runId,
    metadata: {
      filesChanged: changed,
      filesBackedUp: total,
      success: result.success,
      durationMs: result.durationMs,
      trigger: result.trigger,
    },
  })
}

const persistBackupResult = (result: BackupResult): void => {
  addBackupRecord(toBackupRecord(result))
  logResult(result)
}

export { persistBackupResult }
