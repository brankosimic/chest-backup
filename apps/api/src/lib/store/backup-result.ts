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

  addLogEntry({
    id: `log-${result.timestamp}`,
    timestamp: parseTimestamp(result.timestamp),
    level: result.success ? "info" : "error",
    message: `Backup ${result.success ? "completed" : "failed"}: ${result.archiveName ?? "unknown"} (${Math.round(result.durationMs / 1000)}s)`,
    metadata: { archiveName: result.archiveName, success: result.success, durationMs: result.durationMs },
  })
}

export { persistBackupResult }
