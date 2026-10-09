import type { Config, Destination } from "../types/config"
import type { StoreResult, BackupProgressCallback } from "../types/index"
import type { FileStat } from "../types/manifest"
import { storeLocalIncremental } from "./local"
import { storeSftpIncremental } from "./sftp"
import { enforceRetention } from "../backup/retention"
import { enforceRetentionSftp } from "./sftp-retention"
import { logger } from "../utils/logger"

const handleDestination = async (files: FileStat[], toDelete: string[], dest: Destination): Promise<StoreResult> => {
  try {
    if (dest.type === "local") return await storeLocalIncremental(files, toDelete, dest)
    return await storeSftpIncremental(files, toDelete, dest)
  } catch (err) {
    logger.error({ dest: dest.path, err }, "destination store failed")
    return { success: false, error: String(err) }
  }
}

const storeToDestination = async (
  files: FileStat[],
  toDelete: string[],
  unchanged: number,
  dest: Destination,
  config: Config,
  errors: string[],
  onProgress?: BackupProgressCallback,
): Promise<StoreResult> => {
  if (!files.length && !toDelete.length) {
    logger.info({ dest: dest.name ?? dest.path, unchanged }, "destination already up to date, skipping")
    onProgress?.({
      phase: "destination-done",
      destName: dest.name,
      destPath: dest.path,
      destType: dest.type,
      message: "skipped",
    })
    return { success: true, skipped: true, skippedReason: "no-changes", destId: dest.id, destLabel: dest.type, uploaded: [], deleted: [] }
  }

  onProgress?.({ phase: "destination-start", destName: dest.name, destPath: dest.path, destType: dest.type })

  const start = Date.now()
  const result = await handleDestination(files, toDelete, dest)
  result.durationMs = Date.now() - start
  if (dest.id) result.destId = dest.id
  result.destLabel = dest.type

  if (result.success) {
    onProgress?.({
      phase: "destination-done",
      destName: dest.name,
      destPath: dest.path,
      destType: dest.type,
      speed: result.speed,
    })
    try {
      if (dest.type === "local") {
        enforceRetention(dest, config.retention, config.tempDir ?? "/tmp")
      } else {
        await enforceRetentionSftp(dest, config.retention, config.tempDir ?? "/tmp")
      }
    } catch (err) {
      errors.push(`Retention enforcement failed for ${dest.path}: ${String(err)}`)
    }
  } else {
    onProgress?.({
      phase: "destination-error",
      destName: dest.name,
      destPath: dest.path,
      destType: dest.type,
      message: result.error,
    })
  }

  return result
}

export { handleDestination, storeToDestination }
