import { unlinkSync, statSync } from "node:fs"
import type { Config, DockerComposeSource } from "../types/config"
import type { BackupResult, VerifyResult, ArchiveWithVerification } from "../types/index"
import { formatTimestamp, createArchive } from "./archiver"
import { verifyArchive } from "./verify"
import { resolveSources } from "./sources"
import { stopBackupContainers, startBackupContainers } from "../docker/manager"
import { dispatchToDestinations } from "../destinations/types"
import { sendStartedNotification, sendCompletedNotification } from "../notification/discord"
import { logger } from "../utils/logger"

const createArchiveWithVerification = async (
  timestamp: string,
  sources: string[],
  tempFiles: string[],
  errors: string[],
  tempDir: string,
): Promise<ArchiveWithVerification | null> => {
  let archivePath: string
  try {
    archivePath = await createArchive(timestamp, sources, [], tempDir, tempFiles)
    tempFiles.push(archivePath)
  } catch (err) {
    errors.push(`Archive creation failed: ${String(err)}`)
    return null
  }

  let verification: VerifyResult | undefined
  try {
    verification = await verifyArchive(archivePath)
    tempFiles.push(verification.checksumFile)
  } catch (err) {
    errors.push(`Archive verification failed: ${String(err)}`)
  }

  return { archivePath, verification }
}

const executeBackup = async (
  config: Config,
  timestamp: string,
  errors: string[],
  tempFiles: string[],
): Promise<BackupResult> => {
  const dockerSources = config.sources.filter((s): s is DockerComposeSource => s.type === "docker-compose")
  const containers = dockerSources.flatMap((s) => s.containers)

  await stopBackupContainers(containers, errors)

  let sources: string[]
  let archiveResult: ArchiveWithVerification | null
  const tempDir = config.tempDir ?? "/tmp"

  try {
    const resolved = await resolveSources(config, timestamp, tempFiles)
    sources = resolved.paths

    if (!sources.length) {
      errors.push("No sources to archive")
      return { success: false, timestamp, durationMs: 0, destinationResults: [], errors }
    }

    archiveResult = await createArchiveWithVerification(timestamp, sources, tempFiles, errors, tempDir)
  } finally {
    await startBackupContainers(containers, errors)
  }

  if (!archiveResult) {
    return { success: false, timestamp, durationMs: 0, destinationResults: [], errors }
  }

  const { archivePath, verification } = archiveResult
  const destinationResults = await dispatchToDestinations(archivePath, verification?.checksumFile, verification?.checksum, config, errors)
  const allOk = destinationResults.every((r) => r.success)

  return {
    success: allOk,
    timestamp,
    archiveName: archivePath.split("/").pop() ?? "unknown",
    archiveSize: statSync(archivePath).size,
    durationMs: 0,
    destinationResults,
    errors,
    verification,
  }
}

const runBackup = async (config: Config): Promise<BackupResult> => {
  const startTime = Date.now()
  const timestamp = formatTimestamp(new Date())
  const errors: string[] = []
  const tempFiles: string[] = []

  await sendStartedNotification(config, timestamp)

  try {
    const result = await executeBackup(config, timestamp, errors, tempFiles)
    result.durationMs = Date.now() - startTime
    await sendCompletedNotification(config, result)
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
    return failedResult
  } finally {
    for (const file of tempFiles) {
      try {
        unlinkSync(file)
      } catch {
        logger.debug({ file }, "temp file cleanup failed")
      }
    }
  }
}

export { runBackup }
