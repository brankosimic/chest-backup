import { readdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import type { Destination } from "../types/config"
import { logger } from "../utils/logger"
import { basename, parseTimestampFromName } from "../utils/retention-naming"
import { normalizeBase } from "../utils/mirror"

const BACKUP_PREFIXES = ["chest-backup-", "db-dump-", "sqlite-backup-", "sqlite-container-backup-"]
const TIMESTAMP_PATTERN = /(\d{8}-\d{6})/
const CHECKSUM_SUFFIX = ".sha256"
const MIN_RETENTION_DAYS = 1

const isBackupFile = (name: string): boolean =>
  !name.endsWith(CHECKSUM_SUFFIX) && BACKUP_PREFIXES.some((prefix) => name.startsWith(prefix)) && TIMESTAMP_PATTERN.test(name)

const sortByTimestampDesc = (a: string, b: string): number => {
  const tsA = parseTimestampFromName(a)
  const tsB = parseTimestampFromName(b)
  if (!tsA || !tsB) return 0
  return tsB.localeCompare(tsA)
}

const collectRoot = (dir: string): string[] => {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => join(dir, entry.name))
  } catch (err) {
    logger.debug({ dir, err }, "retention root scan unreadable")
    return []
  }
}

const removeWithChecksum = (filePath: string): void => {
  try {
    rmSync(filePath, { force: true })
    rmSync(`${filePath}${CHECKSUM_SUFFIX}`, { force: true })
    logger.info({ file: filePath }, "deleted old backup file for retention")
  } catch (err) {
    logger.error({ file: filePath, err }, "failed to delete old backup file")
  }
}

const selectByCount = (files: string[], retention: number): string[] => {
  if (files.length <= retention) return []
  return files
    .map((path) => ({ path, name: basename(path) }))
    .sort((a, b) => sortByTimestampDesc(a.name, b.name))
    .slice(retention)
    .map((f) => f.path)
}

const backupFiles = (files: string[]): string[] => files.filter((f) => isBackupFile(basename(f)))

// Each destination mirrors the source tree, so there is exactly one copy of every
// file and no generation to age out. Only legacy whole-archive files left at the
// destination root are pruned, and only by count. Dump artefacts are deliberately
// never pruned: with one copy per database, deleting on age destroys the backup.
const enforceRetention = (destination: Destination, globalRetention: number): void => {
  const retention = Math.max(destination.retention ?? globalRetention, MIN_RETENTION_DAYS)
  const legacy = backupFiles(collectRoot(normalizeBase(destination.path)))

  selectByCount(legacy, retention).forEach((path) => {
    removeWithChecksum(path)
  })

  logger.debug({ dest: destination.path, retention }, "retention enforcement complete")
}

export { enforceRetention, parseTimestampFromName, sortByTimestampDesc, isBackupFile, selectByCount, backupFiles }
