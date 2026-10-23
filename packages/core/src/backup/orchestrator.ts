import { mkdirSync, unlinkSync } from "node:fs"
import type { Config, Destination } from "../types/config"
import type {
  BackupResult,
  BackupSummary,
  DestOutcome,
  BackupProgressCallback,
  RunOptions,
  StoreResult,
} from "../types/index"
import type { FileStat } from "../types/manifest"
import { formatTimestamp } from "./archiver"
import { resolveSources } from "./sources"
import { stopBackupContainers, startBackupContainers } from "../docker/manager"
import { storeToDestination } from "../destinations/types"
import { sendStartedNotification, sendCompletedNotification } from "../notification/discord"
import { prepareIncremental, persistManifest, uploadedFrom } from "./incremental"
import { periodKeyFor } from "./periods"
import { sweepStaleTempFiles } from "./temp-sweep"
import { logger, withRunContext } from "../utils/logger"
import { RunTrigger } from "@chest-backup/shared"

interface RunContext {
  runId: string
  timestamp: string
  startedAt: string
  trigger: BackupResult["trigger"]
}

const buildSkippedResult = (dest: Destination): StoreResult => ({
  success: true,
  skipped: true,
  skippedReason: "no-changes",
  destId: dest.id,
  destName: dest.name,
  destPath: dest.path,
  destType: dest.type,
  destLabel: dest.name ?? dest.path,
  uploaded: [],
  deleted: [],
})

const createRunId = (): string =>
  `run-${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}-${Math.random().toString(36).slice(2, 8)}`

const processDestination = async (
  config: Config,
  dest: Destination,
  files: string[],
  errors: string[],
  periodKey: string,
  onProgress?: BackupProgressCallback,
): Promise<DestOutcome> => {
  const { diff, manifest } = await prepareIncremental(config, dest, files, periodKey)

  if (!diff.toUpload.length && !diff.toDelete.length) {
    return { result: buildSkippedResult(dest), uploaded: [] }
  }

  const result = await storeToDestination(diff.toUpload, diff.toDelete, diff.unchanged, dest, config, errors, periodKey, onProgress)

  if (result.skipped) return { result, uploaded: [] }

  const uploaded = uploadedFrom(diff, result)
  persistManifest(config, dest, manifest, uploaded, result.deleted ?? [], periodKey)

  return { result, uploaded }
}

const processSequential = async (
  dests: Destination[],
  config: Config,
  files: string[],
  errors: string[],
  periodKey: string,
  onProgress?: BackupProgressCallback,
): Promise<DestOutcome[]> => {
  const outcomes: DestOutcome[] = []

  for (const dest of dests) {
    outcomes.push(await processDestination(config, dest, files, errors, periodKey, onProgress))
  }

  return outcomes
}

const summariseOutcomes = (outcomes: DestOutcome[]): BackupSummary => {
  const completed = outcomes.filter((o) => !o.result.skipped)

  if (!completed.length) return { filesChanged: 0, totalUploadedBytes: 0 }

  const reference = completed.reduce((a, b) => (a.uploaded.length <= b.uploaded.length ? a : b))
  const uploadedBytes = reference.uploaded.reduce((acc, f: FileStat) => acc + f.size, 0)

  return { filesChanged: reference.uploaded.length, totalUploadedBytes: uploadedBytes }
}

const buildEmptyResult = (run: RunContext, errors: string[]): BackupResult => ({
  success: false,
  runId: run.runId,
  timestamp: run.timestamp,
  startedAt: run.startedAt,
  finishedAt: new Date().toISOString(),
  trigger: run.trigger,
  durationMs: 0,
  destinationResults: [],
  errors,
})

const executeBackup = async (
  config: Config,
  run: RunContext,
  errors: string[],
  tempFiles: string[],
  onProgress?: BackupProgressCallback,
): Promise<BackupResult> => {
  const containers = config.sources.flatMap((s) => {
    if (s.type === "container-volume") return [s.containerName]
    return []
  })

  await stopBackupContainers(containers, errors)

  const tempDir = config.tempDir ?? "/tmp"
  mkdirSync(tempDir, { recursive: true })
  sweepStaleTempFiles(config)

  const periodKey = periodKeyFor(config.retentionMode, run.timestamp, new Date(run.startedAt))

  let files: string[] = []
  try {
    const resolved = await resolveSources(config, tempFiles, errors)
    files = resolved.paths

    if (!files.length) {
      logger.error({ timestamp: run.timestamp }, "no sources to back up")
      errors.push("No sources to back up")
      return buildEmptyResult(run, errors)
    }
  } finally {
    await startBackupContainers(containers, errors)
  }

  onProgress?.({ phase: "archiving", runId: run.runId, timestamp: run.timestamp })

  const active = config.destinations.filter((d) => !d.skip)
  const sequential = active.filter((d) => !d.parallel)
  const parallel = active.filter((d) => d.parallel)

  const outcomes: DestOutcome[] = []
  outcomes.push(...(await processSequential(sequential, config, files, errors, periodKey, onProgress)))

  if (parallel.length) {
    const parallelOutcomes = await Promise.all(parallel.map((dest) => processDestination(config, dest, files, errors, periodKey, onProgress)))
    outcomes.push(...parallelOutcomes)
  }

  const destinationResults = outcomes.map((o) => o.result)
  const allOk = destinationResults.every((r) => r.success)
  const summary = summariseOutcomes(outcomes)
  const success = allOk && errors.length === 0

  return {
    success,
    runId: run.runId,
    timestamp: run.timestamp,
    startedAt: run.startedAt,
    finishedAt: new Date().toISOString(),
    trigger: run.trigger,
    durationMs: 0,
    destinationResults,
    errors,
    filesBackedUp: files.length,
    filesChanged: summary.filesChanged,
    totalUploadedBytes: summary.totalUploadedBytes,
  }
}

const cleanupTempFiles = (tempFiles: string[]): void => {
  tempFiles.forEach((file) => {
    try {
      unlinkSync(file)
    } catch (err) {
      logger.debug({ file, err }, "temp file cleanup failed")
    }
  })
}

const executeRun = async (
  config: Config,
  run: RunContext,
  onProgress?: BackupProgressCallback,
): Promise<BackupResult> => {
  const startTime = Date.now()
  const errors: string[] = []
  const tempFiles: string[] = []

  onProgress?.({ phase: "run-start", runId: run.runId, timestamp: run.timestamp })

  await sendStartedNotification(config, run.timestamp)
  logger.info({ timestamp: run.timestamp }, "backup started")

  try {
    const result = await executeBackup(config, run, errors, tempFiles, onProgress)
    result.durationMs = Date.now() - startTime
    result.finishedAt = new Date().toISOString()
    await sendCompletedNotification(config, result)
    logger.info({ success: result.success, durationMs: result.durationMs, timestamp: run.timestamp }, "backup finished")
    return result
  } catch (err) {
    const failedResult: BackupResult = {
      success: false,
      runId: run.runId,
      timestamp: run.timestamp,
      startedAt: run.startedAt,
      finishedAt: new Date().toISOString(),
      trigger: run.trigger,
      durationMs: Date.now() - startTime,
      destinationResults: [],
      errors: [String(err)],
    }
    await sendCompletedNotification(config, failedResult)
    logger.info({ success: false, durationMs: failedResult.durationMs, timestamp: run.timestamp }, "backup finished")
    return failedResult
  } finally {
    cleanupTempFiles(tempFiles)
  }
}

const runBackup = async (
  config: Config,
  onProgress?: BackupProgressCallback,
  options?: RunOptions,
): Promise<BackupResult> => {
  const run: RunContext = {
    runId: options?.runId ?? createRunId(),
    timestamp: formatTimestamp(new Date()),
    startedAt: new Date().toISOString(),
    trigger: options?.trigger ?? RunTrigger.Manual,
  }

  return withRunContext(run.runId, () => executeRun(config, run, onProgress))
}

export { runBackup, createRunId }
