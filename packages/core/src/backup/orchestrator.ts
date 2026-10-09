import { mkdirSync, unlinkSync } from "node:fs"
import type { Config, Destination } from "../types/config"
import type { BackupResult, BackupSummary, DestOutcome, BackupProgressCallback } from "../types/index"
import type { FileStat } from "../types/manifest"
import { formatTimestamp } from "./archiver"
import { resolveSources } from "./sources"
import { stopBackupContainers, startBackupContainers } from "../docker/manager"
import { storeToDestination } from "../destinations/types"
import { sendStartedNotification, sendCompletedNotification } from "../notification/discord"
import { prepareIncremental, persistManifest, uploadedFrom } from "./incremental"
import { sweepStaleTempFiles } from "./temp-sweep"
import { logger } from "../utils/logger"

const processDestination = async (
  config: Config,
  dest: Destination,
  files: string[],
  errors: string[],
  onProgress?: BackupProgressCallback,
): Promise<DestOutcome> => {
  const { diff, manifest } = await prepareIncremental(config, dest, files)

  if (!diff.toUpload.length && !diff.toDelete.length) {
    const result = { success: true, skipped: true, skippedReason: "no-changes", destId: dest.id, destLabel: dest.type, uploaded: [], deleted: [] }
    return { result, uploaded: [] }
  }

  const result = await storeToDestination(diff.toUpload, diff.toDelete, diff.unchanged, dest, config, errors, onProgress)

  if (result.skipped) return { result, uploaded: [] }

  const uploaded = uploadedFrom(diff, result)
  persistManifest(config, dest, manifest, uploaded, result.deleted ?? [])

  return { result, uploaded }
}

const processSequential = async (
  dests: Destination[],
  config: Config,
  files: string[],
  errors: string[],
  onProgress?: BackupProgressCallback,
): Promise<DestOutcome[]> => {
  const outcomes: DestOutcome[] = []

  for (const dest of dests) {
    outcomes.push(await processDestination(config, dest, files, errors, onProgress))
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

const executeBackup = async (
  config: Config,
  timestamp: string,
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

  let files: string[] = []
  try {
    const resolved = await resolveSources(config, tempFiles, errors)
    files = resolved.paths

    if (!files.length) {
      logger.error({ timestamp }, "no sources to back up")
      errors.push("No sources to back up")
      return { success: false, timestamp, durationMs: 0, destinationResults: [], errors }
    }
  } finally {
    await startBackupContainers(containers, errors)
  }

  onProgress?.({ phase: "archiving" })

  const active = config.destinations.filter((d) => !d.skip)
  const sequential = active.filter((d) => !d.parallel)
  const parallel = active.filter((d) => d.parallel)

  const outcomes: DestOutcome[] = []
  outcomes.push(...(await processSequential(sequential, config, files, errors, onProgress)))

  if (parallel.length) {
    const parallelOutcomes = await Promise.all(parallel.map((dest) => processDestination(config, dest, files, errors, onProgress)))
    outcomes.push(...parallelOutcomes)
  }

  const destinationResults = outcomes.map((o) => o.result)
  const allOk = destinationResults.every((r) => r.success)
  const summary = summariseOutcomes(outcomes)
  const success = allOk && errors.length === 0

  return {
    success,
    timestamp,
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

const runBackup = async (config: Config, onProgress?: BackupProgressCallback): Promise<BackupResult> => {
  const startTime = Date.now()
  const timestamp = formatTimestamp(new Date())
  const errors: string[] = []
  const tempFiles: string[] = []

  await sendStartedNotification(config, timestamp)
  logger.info({ timestamp }, "backup started")

  try {
    const result = await executeBackup(config, timestamp, errors, tempFiles, onProgress)
    result.durationMs = Date.now() - startTime
    await sendCompletedNotification(config, result)
    logger.info({ success: result.success, durationMs: result.durationMs, timestamp }, "backup finished")
    return result
  } catch (err) {
    const failedResult: BackupResult = {
      success: false,
      timestamp,
      durationMs: Date.now() - startTime,
      destinationResults: [],
      errors: [String(err)],
    }
    await sendCompletedNotification(config, failedResult)
    logger.info({ success: failedResult.success, durationMs: failedResult.durationMs, timestamp }, "backup finished")
    return failedResult
  } finally {
    cleanupTempFiles(tempFiles)
  }
}

export { runBackup }
