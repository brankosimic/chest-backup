import type { RestoreJob } from "@chest-backup/shared"
import { LogLevel, RestoreStatus } from "@chest-backup/shared"
import { addLogEntry } from "./logs"

const logStarted = (job: RestoreJob): void => {
  addLogEntry({
    id: `log-${job.id}-start`,
    timestamp: job.startedAt,
    level: LogLevel.Info,
    message: `Restore started: ${job.destinationName ?? job.destinationPath} (${job.periodKey}) → ${job.targetRoot}`,
    metadata: { jobId: job.id, destinationId: job.destinationId, periodKey: job.periodKey, targetRoot: job.targetRoot },
  })
}

const logFinished = (job: RestoreJob): void => {
  const outcome = job.status === RestoreStatus.Success ? "completed" : job.status === RestoreStatus.Partial ? "partially completed" : "failed"
  addLogEntry({
    id: `log-${job.id}-finish`,
    timestamp: job.finishedAt ?? new Date().toISOString(),
    level: job.status === RestoreStatus.Failed ? LogLevel.Error : LogLevel.Info,
    message: `Restore ${outcome}: ${String(job.restoredCount)} restored, ${String(job.skippedCount)} skipped, ${String(job.failedCount)} failed`,
    metadata: {
      jobId: job.id,
      destinationId: job.destinationId,
      periodKey: job.periodKey,
      restoredCount: job.restoredCount,
      skippedCount: job.skippedCount,
      failedCount: job.failedCount,
      restoredBytes: job.restoredBytes,
    },
  })
}

export { logStarted, logFinished }
