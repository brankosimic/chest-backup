import { readdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import type { Destination } from "../types/config"
import { RetentionMode } from "../types/config"
import { logger } from "../utils/logger"
import { normalizeBase } from "../utils/mirror"
import { isPeriodKey, selectExpiredPeriodKeys } from "./periods"

const MIN_RETENTION_PERIODS = 1

const listPeriodFolders = (base: string, mode: RetentionMode): string[] => {
  try {
    return readdirSync(base, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && isPeriodKey(mode, entry.name))
      .map((entry) => entry.name)
  } catch (err) {
    logger.debug({ base, err }, "retention root scan unreadable")
    return []
  }
}

const removePeriodFolder = (base: string, periodKey: string): void => {
  const dir = join(base, periodKey)
  try {
    rmSync(dir, { recursive: true, force: true })
    logger.info({ dir }, "deleted expired snapshot folder for retention")
  } catch (err) {
    logger.error({ dir, err }, "failed to delete expired snapshot folder")
  }
}

const enforceRetention = (destination: Destination, globalRetention: number, mode: RetentionMode, periodKey: string): void => {
  const base = normalizeBase(destination.path)

  if (mode === RetentionMode.Forever) {
    logger.debug({ dest: destination.path, periodKey }, "retention disabled, keeping all snapshot folders")
    return
  }

  const retention = Math.max(globalRetention, MIN_RETENTION_PERIODS)
  const expired = selectExpiredPeriodKeys(listPeriodFolders(base, mode), retention, periodKey, (name) => isPeriodKey(mode, name))

  expired.forEach((key) => {
    removePeriodFolder(base, key)
  })

  logger.debug({ dest: destination.path, retention, mode, periodKey, expired }, "retention enforcement complete")
}

export { enforceRetention, listPeriodFolders }