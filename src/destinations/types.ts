import type { Config } from "../types/config"
import type { Destination } from "../types/config"
import type { StoreResult } from "../types/index"
import { getLatestChecksumLocal, storeLocal } from "./local"
import { connectClient, getLatestChecksumSftp, storeSftp, enforceRetentionSftp } from "./sftp"
import { enforceRetention } from "../backup/retention"
import { logger } from "../utils/logger"

const getLatestChecksum = async (dest: Destination): Promise<string | null> => {
  if (dest.type === "local") return getLatestChecksumLocal(dest)

  const { default: SFTPClient } = await import("ssh2-sftp-client")
  const sftp = new SFTPClient()
  try {
    await connectClient(sftp, dest)
    return await getLatestChecksumSftp(sftp, dest)
  } finally {
    await sftp.end()
  }
}

const handleDestination = async (
  archivePath: string,
  checksumFile: string | undefined,
  dest: Destination,
): Promise<StoreResult> => {
  try {
    if (dest.type === "local") return storeLocal(archivePath, checksumFile, dest)
    return await storeSftp(archivePath, checksumFile, dest)
  } catch (err) {
    logger.error({ dest: dest.path, err }, "destination store failed")
    return { success: false, error: String(err) }
  }
}

const storeToDestination = async (
  archivePath: string,
  checksumFile: string | undefined,
  checksumValue: string | undefined,
  dest: Destination,
  retention: number,
  errors: string[],
): Promise<StoreResult> => {
  if (checksumValue) {
    const latest = await getLatestChecksum(dest)

    if (latest === checksumValue) {
      logger.info({ dest: dest.path }, "destination already has identical archive, skipping")
      return { success: true, skipped: true, skippedReason: "identical", destLabel: dest.type }
    }
  }

  const start = Date.now()
  const result = await handleDestination(archivePath, checksumFile, dest)
  result.durationMs = Date.now() - start
  result.destLabel = dest.type

  if (result.success) {
    try {
      if (dest.type === "local") {
        enforceRetention(dest, "chest-backup", retention)
      } else {
        await enforceRetentionSftp(dest, "chest-backup", retention)
      }
    } catch (err) {
      errors.push(`Retention enforcement failed for ${dest.path}: ${String(err)}`)
    }
  }

  return result
}

const dispatchToDestinations = async (
  archivePath: string,
  checksumFile: string | undefined,
  checksumValue: string | undefined,
  config: Config,
  errors: string[],
): Promise<StoreResult[]> => {
  const active = config.destinations.filter((d) => !d.skip)
  const skipped = config.destinations.filter((d) => d.skip)
  skipped.forEach((dest) => logger.info({ dest: dest.path, type: dest.type }, "destination skipped per config"))

  const sequential = active.filter((d) => !d.parallel)
  const parallel = active.filter((d) => d.parallel)
  const results: StoreResult[] = []

  for (const dest of sequential) {
    results.push(await storeToDestination(archivePath, checksumFile, checksumValue, dest, config.retention, errors))
  }

  if (parallel.length) {
    const parallelResults = await Promise.all(
      parallel.map((dest) => storeToDestination(archivePath, checksumFile, checksumValue, dest, config.retention, errors)),
    )
    results.push(...parallelResults)
  }

  return results
}

export { handleDestination, storeToDestination, dispatchToDestinations }
