import { unlinkSync, statSync } from "node:fs"
import type { Config } from "../types/config"
import type { Destination } from "../types/config"
import type { BackupResult, StoreResult, VerifyResult } from "../types/index"
import { formatTimestamp, createArchive } from "./archiver"
import { verifyArchive } from "./verify"
import { resolveSources } from "./sources"
import { enforceRetention } from "./retention"
import { dumpHostDatabase, dumpDockerDatabase } from "../database/postgres"
import { stopContainers, startContainers } from "../docker/manager"
import { handleDestination } from "../destinations/types"
import { sendDiscordNotification } from "../notification/discord"
import { logger } from "../utils/logger"

async function ensureContainersStarted(containers: string[] | undefined): Promise<void> {
  if (!containers?.length) return
  try { await startContainers(containers) } catch { logger.debug("container restart (best-effort) failed") }
}

async function stopBackupContainers(containers: string[] | undefined, errors: string[]): Promise<void> {
  if (!containers?.length) return
  try { await stopContainers(containers) } catch (err) {
    errors.push(`Failed to stop containers: ${String(err)}`)
  }
}

async function startBackupContainers(containers: string[] | undefined, errors: string[]): Promise<void> {
  if (!containers?.length) return
  try { await startContainers(containers) } catch (err) {
    errors.push(`Failed to start containers: ${String(err)}`)
  }
}

async function storeToDestination(
  archivePath: string,
  checksumFile: string | undefined,
  dest: Destination,
  retention: number,
  errors: string[],
): Promise<StoreResult> {
  const result = await handleDestination(archivePath, checksumFile, dest)

  if (result.success) {
    try { await enforceRetention(dest, "chest-backup", retention) } catch (err) {
      errors.push(`Retention enforcement failed for ${dest.path}: ${String(err)}`)
    }
  }

  return result
}

async function dumpDatabases(
  config: Config,
  timestamp: string,
  tempFiles: string[],
  errors: string[],
): Promise<string[]> {
  if (!config.databases?.length) return []

  const dbDumps: string[] = []
  for (const db of config.databases) {
    const outputPath = `/tmp/db-dump-${timestamp}-${crypto.randomUUID()}.dump`
    tempFiles.push(outputPath)
    try {
      if (db.type === "host" && db.connectionString) {
        await dumpHostDatabase(db.connectionString, db.database, outputPath)
      } else if (db.type === "docker" && db.containerName) {
        await dumpDockerDatabase(db.containerName, db.database, db.username, db.password ?? "", outputPath)
      }
      dbDumps.push(outputPath)
    } catch (err) {
      errors.push(`Database dump failed: ${String(err)}`)
    }
  }
  return dbDumps
}

function sendNotification(config: Config, result: BackupResult): void {
  if (!config.notifications?.discord) return

  sendDiscordNotification(config.notifications.discord.webhookUrl, result).catch((err) => {
    logger.error({ err }, "failed to send notification")
  })
}

async function dispatchToDestinations(
  archivePath: string,
  checksumFile: string | undefined,
  config: Config,
  errors: string[],
): Promise<StoreResult[]> {
  const sequential = config.destinations.filter((d) => !d.parallel)
  const parallel = config.destinations.filter((d) => d.parallel)
  const results: StoreResult[] = []

  for (const dest of sequential) {
    results.push(await storeToDestination(archivePath, checksumFile, dest, config.retention, errors))
  }

  if (parallel.length) {
    const parallelResults = await Promise.all(
      parallel.map((dest) => storeToDestination(archivePath, checksumFile, dest, config.retention, errors)),
    )
    results.push(...parallelResults)
  }

  return results
}

async function runBackup(config: Config): Promise<BackupResult> {
  const startTime = Date.now()
  const timestamp = formatTimestamp(new Date())
  const errors: string[] = []
  const tempFiles: string[] = []

  try {
    await stopBackupContainers(config.containers, errors)

    const [dbDumps, sources] = await Promise.all([
      dumpDatabases(config, timestamp, tempFiles, errors),
      resolveSources(config.sources).catch((err) => {
        errors.push(`Source resolution failed: ${String(err)}`)
        return [] as string[]
      }),
    ])

    await startBackupContainers(config.containers, errors)

    if (!sources.length && !dbDumps.length) {
      await ensureContainersStarted(config.containers)
      return {
        success: false,
        timestamp,
        durationMs: Date.now() - startTime,
        destinationResults: [],
        errors: [...errors, "No sources or database dumps to archive"],
      }
    }

    let archivePath: string
    let verification: VerifyResult | undefined
    try {
      archivePath = await createArchive(timestamp, sources, dbDumps)
      tempFiles.push(archivePath)
    } catch (err) {
      await ensureContainersStarted(config.containers)
      return {
        success: false,
        timestamp,
        durationMs: Date.now() - startTime,
        destinationResults: [],
        errors: [...errors, `Archive creation failed: ${String(err)}`],
      }
    }

    try {
      verification = await verifyArchive(archivePath)
      tempFiles.push(verification.checksumFile)
    } catch (err) {
      errors.push(`Archive verification failed: ${String(err)}`)
    }

    const destinationResults = await dispatchToDestinations(archivePath, verification?.checksumFile, config, errors)
    const successCount = destinationResults.filter((r) => r.success).length
    const result: BackupResult = {
      success: successCount === destinationResults.length,
      timestamp,
      archiveName: archivePath.split("/").pop() ?? "unknown",
      archiveSize: statSync(archivePath).size,
      durationMs: Date.now() - startTime,
      destinationResults,
      errors,
      verification,
    }

    sendNotification(config, result)
    return result
  } finally {
    for (const file of tempFiles) {
      try { unlinkSync(file) } catch { logger.debug({ file }, "temp file cleanup failed") }
    }

    await ensureContainersStarted(config.containers)
  }
}

export { runBackup }