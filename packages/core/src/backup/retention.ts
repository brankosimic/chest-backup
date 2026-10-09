import { readdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import type { Destination } from "../types/config"
import { logger } from "../utils/logger"
import { basename, ageDays, parseTimestampFromName } from "../utils/retention-naming"
import { mirrorPathFor, normalizeBase } from "../utils/mirror"

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

const collectRecursive = (dir: string, acc: string[]): string[] => {
  const entries = readdirSync(dir, { withFileTypes: true })
  entries.forEach((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) collectRecursive(full, acc)
    else if (entry.isFile()) acc.push(full)
  })

  return acc
}

const collectSafely = (dir: string): string[] => {
  try {
    return collectRecursive(dir, [])
  } catch (err) {
    logger.debug({ dir, err }, "retention scan directory unreadable")
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

const selectOlderThanDays = (files: string[], maxAgeDays: number): string[] =>
  files.filter((path) => {
    const age = ageDays(basename(path))
    return age !== null && age > maxAgeDays
  })

const backupFiles = (files: string[]): string[] => files.filter((f) => isBackupFile(basename(f)))

const enforceRetention = (destination: Destination, globalRetention: number, tempDir: string): void => {
  const retention = Math.max(destination.retention ?? globalRetention, MIN_RETENTION_DAYS)
  const base = normalizeBase(destination.path)
  const root = backupFiles(collectRoot(base))
  const dumps = backupFiles(collectSafely(mirrorPathFor(base, tempDir)))

  selectByCount(root, retention).forEach((path) => {
    removeWithChecksum(path)
  })
  selectOlderThanDays(dumps, retention).forEach((path) => {
    removeWithChecksum(path)
  })

  logger.debug({ dest: destination.path, retention }, "retention enforcement complete")
}

export { enforceRetention, parseTimestampFromName, sortByTimestampDesc, isBackupFile, selectByCount, selectOlderThanDays, backupFiles }
