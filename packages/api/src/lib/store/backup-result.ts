import type { BackupResult } from "@core/types/index"
import { addBackupRecord } from "./backups"
import { addLogEntry, parseTimestamp } from "./logs"

const persistBackupResult = (result: BackupResult): void => {
  const { destinationResults, ...fields } = result

  addBackupRecord({
    ...fields,
    id: `backup-${result.timestamp}`,
    timestamp: parseTimestamp(result.timestamp),
    destinationResults,
  })

  const changed = result.filesChanged ?? 0
  const total = result.filesBackedUp ?? 0
  const summary = `${String(changed)}/${String(total)} files changed`

  addLogEntry({
    id: `log-${result.timestamp}`,
    timestamp: parseTimestamp(result.timestamp),
    level: result.success ? "info" : "error",
    message: `Backup ${result.success ? "completed" : "failed"}: ${summary} (${String(Math.round(result.durationMs / 1000))}s)`,
    metadata: { filesChanged: changed, filesBackedUp: total, success: result.success, durationMs: result.durationMs },
  })
}

export { persistBackupResult }
