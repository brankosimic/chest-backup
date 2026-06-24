import type { Config } from "../types/config"
import type { Destination } from "../types/config"
import type { StoreResult } from "../types/index"
import { storeLocal } from "./local"
import { storeSftp } from "./sftp"
import { enforceRetention } from "../backup/retention"
import { logger } from "../utils/logger"

const handleDestination = async (
  archivePath: string,
  checksumFile: string | undefined,
  dest: Destination,
): Promise<StoreResult> => {
  try {
    if (dest.type === "local") return await storeLocal(archivePath, checksumFile, dest)
    return await storeSftp(archivePath, checksumFile, dest)
  } catch (err) {
    logger.error({ dest: dest.path, err }, "destination store failed")
    return { success: false, error: String(err) }
  }
}

const storeToDestination = async (
  archivePath: string,
  checksumFile: string | undefined,
  dest: Destination,
  retention: number,
  errors: string[],
): Promise<StoreResult> => {
  const start = Date.now()
  const result = await handleDestination(archivePath, checksumFile, dest)
  result.durationMs = Date.now() - start
  result.destLabel = dest.type

  if (result.success) {
    try {
      await enforceRetention(dest, "chest-backup", retention)
    } catch (err) {
      errors.push(`Retention enforcement failed for ${dest.path}: ${String(err)}`)
    }
  }

  return result
}

const dispatchToDestinations = async (
  archivePath: string,
  checksumFile: string | undefined,
  config: Config,
  errors: string[],
): Promise<StoreResult[]> => {
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

export { handleDestination, storeToDestination, dispatchToDestinations }
