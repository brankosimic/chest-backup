import type { Destination, RetentionMode } from "@core/types/config"
import type { RestoreJob, RestoreOptions, RestoreProgressEvent, RestoreResult } from "@chest-backup/shared"
import { RestorePhase, RestoreStatus } from "@chest-backup/shared"
import { isPeriodKey } from "@core/backup/periods"
import { restoreSnapshot } from "@core/restore/restore"
import { logger } from "@core/utils/logger"
import { logFinished, logStarted } from "./restore-logs"

const MAX_JOBS = 25

const jobs = new Map<string, RestoreJob>()
const controllers = new Map<string, AbortController>()
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
  Object.assign(job, event)
}

const finalStatus = (result: RestoreResult): RestoreStatus => {
  if (result.success) return RestoreStatus.Success
  return result.restoredCount > 0 ? RestoreStatus.Partial : RestoreStatus.Failed
}

const finishJob = (job: RestoreJob, durationMs: number): void => {
  job.finishedAt = new Date().toISOString()
  job.durationMs = durationMs
  job.currentFileBytes = 0
  job.currentFileTotal = 0
  delete job.currentPath
  logFinished(job)
}

const applyResult = (job: RestoreJob, result: RestoreResult): void => {
  const status = finalStatus(result)
  job.status = status
  job.phase = status === RestoreStatus.Failed ? RestorePhase.Failed : RestorePhase.Completed
  job.totalFiles = result.totalFiles
  job.completedFiles = result.totalFiles
  job.restoredCount = result.restoredCount
  job.skippedCount = result.skippedCount
  job.failedCount = result.failedCount
  job.totalBytes = result.totalBytes
  job.restoredBytes = result.restoredBytes
  job.files = result.files
  job.errors = result.errors
  finishJob(job, result.durationMs)
}

const elapsedSinceStart = (job: RestoreJob): number => (job.startedAt ? Date.now() - Date.parse(job.startedAt) : 0)

const failJob = (job: RestoreJob, err: unknown): void => {
  const message = err instanceof Error ? err.message : String(err)
  job.status = RestoreStatus.Failed
  job.phase = RestorePhase.Failed
  job.errors = [message]
  logger.error({ jobId: job.id, err }, "restore job failed")
  finishJob(job, elapsedSinceStart(job))
}

const markCancelled = (job: RestoreJob): void => {
  job.status = RestoreStatus.Cancelled
  job.phase = RestorePhase.Cancelled
  finishJob(job, elapsedSinceStart(job))
}

const runJob = async (
  job: RestoreJob,
  dest: Destination,
  periodKey: string,
  options: RestoreOptions,
): Promise<void> => {
  const controller = new AbortController()
  controllers.set(job.id, controller)
  try {
    job.phase = RestorePhase.Restoring
    const result = await restoreSnapshot(dest, periodKey, options, controller, (event) => {
      applyProgress(job, event)
    })
    if (controller.signal.aborted) markCancelled(job)
    else applyResult(job, result)
  } catch (err) {
    failJob(job, err)
  } finally {
    controllers.delete(job.id)
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
    currentFileBytes: 0,
    currentFileTotal: 0,
    speed: 0,
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

const cancelRestoreJob = (id: string): RestoreJob | undefined => {
  const job = jobs.get(id)
  if (!job || !isRunning(job)) return job
  controllers.get(id)?.abort()
  markCancelled(job)
  return job
}

const getRestoreJob = (id: string): RestoreJob | undefined => jobs.get(id)

const getActiveRestoreJob = (): RestoreJob | null => {
  if (activeJobId) {
    const job = jobs.get(activeJobId)
    if (job) return job
  }
  let latest: RestoreJob | undefined
  for (const job of jobs.values()) {
    if (!latest || job.startedAt > latest.startedAt) latest = job
  }
  return latest ?? null
}

export { startRestoreJob, cancelRestoreJob, getRestoreJob, getActiveRestoreJob }
