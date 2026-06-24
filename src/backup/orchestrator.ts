import { unlinkSync, statSync } from "node:fs"
import type { Config, DockerComposeSource } from "../types/config"
import type { BackupResult, VerifyResult, ArchiveWithVerification } from "../types/index"
import { formatTimestamp, createArchive } from "./archiver"
import { verifyArchive } from "./verify"
import { resolveSources } from "./sources"
import { stopBackupContainers, startBackupContainers } from "../docker/manager"
import { dispatchToDestinations } from "../destinations/types"
import { sendNotification } from "../notification/discord"
import { logger } from "../utils/logger"

const collectSources = async (
  config: Config,
  timestamp: string,
  tempFiles: string[],
  errors: string[],
): Promise<{ sources: string[]; containers: string[] }> => {
  const dockerSources = config.sources.filter((s): s is DockerComposeSource => s.type === "docker-compose")
  await stopBackupContainers(dockerSources.flatMap((s) => s.containers), errors)

  const result = await resolveSources(config, timestamp, tempFiles)
  return { sources: result.paths, containers: result.containers }
}

const createArchiveWithVerification = async (
  timestamp: string,
  sources: string[],
  tempFiles: string[],
  errors: string[],
): Promise<ArchiveWithVerification | null> => {
  let archivePath: string
  try {
    archivePath = await createArchive(timestamp, sources, [])
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
  const { sources, containers } = await collectSources(config, timestamp, tempFiles, errors)

  if (!sources.length) {
    errors.push("No sources to archive")
    return { success: false, timestamp, durationMs: 0, destinationResults: [], errors }
  }

  const archiveResult = await createArchiveWithVerification(timestamp, sources, tempFiles, errors)

  await startBackupContainers(containers, errors)

  if (!archiveResult) {
    return { success: false, timestamp, durationMs: 0, destinationResults: [], errors }
  }

  const { archivePath, verification } = archiveResult
  const destinationResults = await dispatchToDestinations(archivePath, verification?.checksumFile, config, errors)
  const successCount = destinationResults.filter((r) => r.success).length

  const result: BackupResult = {
    success: successCount === destinationResults.length,
    timestamp,
    archiveName: archivePath.split("/").pop() ?? "unknown",
    archiveSize: statSync(archivePath).size,
    durationMs: 0,
    destinationResults,
    errors,
    verification,
  }

  return result
}

const runBackup = async (config: Config): Promise<BackupResult> => {
  const startTime = Date.now()
  const timestamp = formatTimestamp(new Date())
  const errors: string[] = []
  const tempFiles: string[] = []

  try {
    const result = await executeBackup(config, timestamp, errors, tempFiles)
    result.durationMs = Date.now() - startTime
    await sendNotification(config, result)
    return result
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
