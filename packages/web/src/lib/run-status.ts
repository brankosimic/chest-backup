import { RunStatus } from "@chest-backup/shared"
import type { BackupRecord } from "@chest-backup/shared"

/**
 * Older API builds did not report a run status. Derive one from the raw result so the UI
 * never shows a finished run as "running".
 */
const resolveRunStatus = (record: BackupRecord): RunStatus => {
  if (record.status) return record.status
  if (record.success) return RunStatus.Success
  return RunStatus.Failed
}

export { resolveRunStatus }
