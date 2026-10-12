import { readdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import type { Destination } from "../types/config"
import { logger } from "../utils/logger"
import { normalizeBase } from "../utils/mirror"
import { isMonthKey, selectExpiredMonthKeys } from "./months"

const MIN_RETENTION_MONTHS = 1

const listMonthFolders = (base: string): string[] => {
  try {
    return readdirSync(base, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && isMonthKey(entry.name))
      .map((entry) => entry.name)
  } catch (err) {
    logger.debug({ base, err }, "retention root scan unreadable")
    return []
  }
}

const removeMonthFolder = (base: string, monthKey: string): void => {
  const dir = join(base, monthKey)
  try {
    rmSync(dir, { recursive: true, force: true })
    logger.info({ dir }, "deleted expired month snapshot for retention")
  } catch (err) {
    logger.error({ dir, err }, "failed to delete expired month snapshot")
  }
}

// Retention counts calendar-month snapshot folders, not individual files. The
// destination mirrors the source tree inside each folder, so there is nothing
// to age out mid-month — only whole months roll off once they fall outside the
// retention window.
const enforceRetention = (destination: Destination, globalRetention: number, monthKey: string): void => {
  const retention = Math.max(destination.retention ?? globalRetention, MIN_RETENTION_MONTHS)
  const base = normalizeBase(destination.path)
  const expired = selectExpiredMonthKeys(listMonthFolders(base), retention, monthKey)

  expired.forEach((key) => {
    removeMonthFolder(base, key)
  })

  logger.debug({ dest: destination.path, retention, monthKey, expired }, "retention enforcement complete")
}

export { enforceRetention, listMonthFolders }