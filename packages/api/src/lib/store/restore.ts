import type { Destination, RetentionMode } from "@core/types/config"
import type { RestoreJob, RestoreOptions, RestoreProgressEvent, RestoreResult } from "@chest-backup/shared"
import { LogLevel, RestorePhase, RestoreStatus } from "@chest-backup/shared"
import { isPeriodKey } from "@core/backup/periods"
import { restoreSnapshot } from "@core/restore/restore"
import { logger } from "@core/utils/logger"
import { addLogEntry } from "./logs"

const MAX_JOBS = 25

const jobs = new Map<string, RestoreJob>()
let activeJobId: string | null = null

const createJobId = (): string =>
  `restore-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const isRunning = (job: RestoreJob | undefined): boolean => job?.status === RestoreStatus.Running

const pruneJobs = (): void => {
  if (jobs.size <= MAX_JOBS) return

  for (const [id, job] of jobs) {
    if (jobs.size <= MAX_JOBS) return
    if (!isRunning(job)) jobs.delete(id)
  }
}

const applyProgress = (job: RestoreJob, event: RestoreProgressEvent): void => {
  job.phase = event.phase
  job.totalFiles = event.totalFiles
  job.completedFiles = event.completedFiles
  job.restoredCount = event.restoredCount
  job.skippedCount = event.skippedCount
  job.failedCount = event.failedCount
  job.restoredBytes = event.restoredBytes
  if (event.currentPath) job.currentPath = event.currentPath
}

const finalStatus = (result: RestoreResult): RestoreStatus => {
  if (result.success) return RestoreStatus.Success
  return result.restoredCount > 0 ? RestoreStatus.Partial : RestoreStatus.Failed
}

const applyResult = (job: RestoreJob, result: RestoreResult): void => {
  const status = finalStatus(result)
  job.status = status
  job.phase = status === RestoreStatus.Failed ? RestorePhase.Failed : RestorePhase.Completed
  job.finishedAt = new Date().toISOString()
  job.durationMs = result.durationMs
  job.totalFiles = result.totalFiles
  job.completedFiles = result.totalFiles
  job.restoredCount = result.restoredCount
  job.skippedCount = result.skippedCount
  job.failedCount = result.failedCount
  job.totalBytes = result.totalBytes
  job.restoredBytes = result.restoredBytes
  job.files = result.files
  job.errors = result.errors
  delete job.currentPath
  logFinished(job)
}

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

const failJob = (job: RestoreJob, err: unknown): void => {
  const message = err instanceof Error ? err.message : String(err)
  job.status = RestoreStatus.Failed
  job.phase = RestorePhase.Failed
  job.finishedAt = new Date().toISOString()
  job.errors = [message]
  job.durationMs = job.startedAt ? Date.parse(job.finishedAt) - Date.parse(job.startedAt) : 0
  delete job.currentPath
  logger.error({ jobId: job.id, err }, "restore job failed")
  logFinished(job)
}

const runJob = async (
  job: RestoreJob,
  dest: Destination,
  periodKey: string,
  options: RestoreOptions,
): Promise<void> => {
  try {
    job.phase = RestorePhase.Restoring
    const result = await restoreSnapshot(dest, periodKey, options, (event) => {
      applyProgress(job, event)
    })
    applyResult(job, result)
  } catch (err) {
    failJob(job, err)
  } finally {
    if (activeJobId === job.id) activeJobId = null
  }
}

const startRestoreJob = (dest: Destination, periodKey: string, options: RestoreOptions, retentionMode: RetentionMode): RestoreJob => {
  const running = activeJobId ? jobs.get(activeJobId) : undefined
  if (isRunning(running)) throw new Error("A restore is already running")
  if (!isPeriodKey(retentionMode, periodKey)) throw new Error(`Invalid snapshot key: ${periodKey}`)

  const job: RestoreJob = {
    id: createJobId(),
    status: RestoreStatus.Running,
    phase: RestorePhase.Queued,
    destinationId: dest.id ?? dest.path,
    destinationName: dest.name,
    destinationPath: dest.path,
    destinationType: dest.type,
    periodKey,
    targetRoot: options.targetRoot?.trim() || "/",
    overwrite: options.overwrite ?? true,
    dryRun: options.dryRun ?? false,
    startedAt: new Date().toISOString(),
    totalFiles: 0,
    completedFiles: 0,
    restoredCount: 0,
    skippedCount: 0,
    failedCount: 0,
    totalBytes: 0,
    restoredBytes: 0,
    files: [],
    errors: [],
  }

  jobs.set(job.id, job)
  activeJobId = job.id
  pruneJobs()
  logStarted(job)

  void runJob(job, dest, periodKey, options)
  return job
}

const getRestoreJob = (id: string): RestoreJob | undefined => jobs.get(id)

const getActiveRestoreJob = (): RestoreJob | null => {
  const job = activeJobId ? jobs.get(activeJobId) : undefined
  return isRunning(job) ? (job ?? null) : null
}

export { startRestoreJob, getRestoreJob, getActiveRestoreJob }
