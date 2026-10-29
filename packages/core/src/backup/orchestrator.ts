import { mkdirSync, unlinkSync } from "node:fs"
import type { Config, ContainerVolumeSource, Destination } from "../types/config"
import type {
  BackupResult,
  BackupSummary,
  DestOutcome,
  BackupProgressCallback,
  BackupProgressEvent,
  RunOptions,
} from "../types/index"
import type { RunContext } from "../types/orchestrator"
import type { StoreResult } from "@chest-backup/shared"
import type { FileStat } from "../types/manifest"
import { formatTimestamp } from "./archiver"
import { resolveSources } from "./sources"
import { stopBackupContainers, startBackupContainers } from "../docker/manager"
import { storeToDestination } from "../destinations/dispatcher"
import { sendStartedNotification, sendCompletedNotification } from "../notification/discord"
import { prepareIncremental, persistManifest, uploadedFrom } from "./incremental"
import { periodKeyFor } from "./periods"
import { sweepStaleTempFiles } from "./temp-sweep"
import { logger, withRunContext } from "../utils/logger"
import { RunTrigger } from "@chest-backup/shared"
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
  for (const dest of dests) outcomes.push(await processDestination(config, dest, files, errors, periodKey, onProgress))
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
const resolveBackupFiles = async (config: Config, tempFiles: string[], errors: string[]): Promise<string[]> => {
  const containers = config.sources.filter((s): s is ContainerVolumeSource => s.type === "container-volume").map((s) => s.containerName)
  await stopBackupContainers(containers, errors)
  try {
    const resolved = await resolveSources(config, tempFiles, errors)
    if (!resolved.paths.length) {
      logger.error("no sources to back up")
      errors.push("No sources to back up")
    }
    return resolved.paths
  } finally {
    await startBackupContainers(containers, errors)
  }
}
const runDestinations = async (
  config: Config,
  dests: Destination[],
  files: string[],
  errors: string[],
  periodKey: string,
  onProgress?: BackupProgressCallback,
): Promise<DestOutcome[]> => {
  const outcomes: DestOutcome[] = []
  outcomes.push(...(await processSequential(dests.filter((d) => !d.parallel), config, files, errors, periodKey, onProgress)))
  const parallel = dests.filter((d) => d.parallel)
  if (parallel.length) {
    const parallelOutcomes = await Promise.all(parallel.map((dest) => processDestination(config, dest, files, errors, periodKey, onProgress)))
    outcomes.push(...parallelOutcomes)
  }
  return outcomes
}
const buildBackupResult = (run: RunContext, destinationResults: StoreResult[], errors: string[], files: number, summary: BackupSummary): BackupResult => ({
  success: destinationResults.every((r) => r.success) && errors.length === 0,
  runId: run.runId,
  timestamp: run.timestamp,
  startedAt: run.startedAt,
  finishedAt: new Date().toISOString(),
  trigger: run.trigger,
  durationMs: 0,
  destinationResults,
  errors,
  filesBackedUp: files,
  filesChanged: summary.filesChanged,
  totalUploadedBytes: summary.totalUploadedBytes,
})
const executeBackup = async (config: Config, run: RunContext, errors: string[], tempFiles: string[], onProgress?: BackupProgressCallback): Promise<BackupResult> => {
  const tempDir = config.tempDir ?? "/tmp"
  mkdirSync(tempDir, { recursive: true })
  sweepStaleTempFiles(config)
  const periodKey = periodKeyFor(config.retentionMode, run.timestamp, new Date(run.startedAt))
  const files = await resolveBackupFiles(config, tempFiles, errors)
  if (!files.length) return buildEmptyResult(run, errors)
  onProgress?.({ phase: "archiving", runId: run.runId, timestamp: run.timestamp })
  const outcomes = await runDestinations(config, config.destinations.filter((d) => !d.skip), files, errors, periodKey, onProgress)
  return buildBackupResult(run, outcomes.map((o) => o.result), errors, files.length, summariseOutcomes(outcomes))
}
const cleanupTempFile = (file: string): void => {
  try {
    unlinkSync(file)
  } catch (err) {
    logger.debug({ file, err }, "temp file cleanup failed")
  }
}
const buildFailedResult = (run: RunContext, startTime: number, err: unknown): BackupResult => ({
  success: false,
  runId: run.runId,
  timestamp: run.timestamp,
  startedAt: run.startedAt,
  finishedAt: new Date().toISOString(),
  trigger: run.trigger,
  durationMs: Date.now() - startTime,
  destinationResults: [],
  errors: [String(err)],
})
const executeRun = async (config: Config, run: RunContext, onProgress?: BackupProgressCallback): Promise<BackupResult> => {
  const startTime = Date.now()
  const errors: string[] = []
  const tempFiles: string[] = []
  const emitProgress = (event: BackupProgressEvent): void => {
    onProgress?.({ ...event, runId: event.runId ?? run.runId })
  }
  emitProgress({ phase: "run-start", runId: run.runId, timestamp: run.timestamp })
  await sendStartedNotification(config, run.timestamp)
  logger.info({ timestamp: run.timestamp }, "backup started")
  try {
    const result = await executeBackup(config, run, errors, tempFiles, emitProgress)
    result.durationMs = Date.now() - startTime
    result.finishedAt = new Date().toISOString()
    await sendCompletedNotification(config, result)
    logger.info({ success: result.success, durationMs: result.durationMs, timestamp: run.timestamp }, "backup finished")
    return result
  } catch (err) {
    const failedResult = buildFailedResult(run, startTime, err)
    await sendCompletedNotification(config, failedResult)
    logger.info({ success: false, durationMs: failedResult.durationMs, timestamp: run.timestamp }, "backup finished")
    return failedResult
  } finally {
    for (const file of tempFiles) cleanupTempFile(file)
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
