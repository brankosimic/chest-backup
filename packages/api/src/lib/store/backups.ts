import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs"
import { resolve } from "node:path"
import type { BackupRecord } from "@chest-backup/shared"
import { getConfig, stableId, DATA_DIR, BACKUP_HISTORY_PATH } from "./config"
import { findDestinationById } from "./entities"
import type { PaginatedResult, BackupStats, DestinationUsage } from "../../types/api"
import { scanSftpUsage } from "@core/destinations/sftp"
import type { Destination } from "@core/types/config"
import { withTimeout } from "../utils"

let backupCache: BackupRecord[] | null = null

const readBackupHistory = (): BackupRecord[] => {
  if (backupCache) return backupCache
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(BACKUP_HISTORY_PATH)) {
    const records = seedFromArchiveDir()
    writeFileSync(BACKUP_HISTORY_PATH, JSON.stringify(records, null, 2))
    backupCache = records
    return records
  }
  const raw = readFileSync(BACKUP_HISTORY_PATH, "utf-8")
  const records = JSON.parse(raw) as BackupRecord[]
  backupCache = records
  return records
}

const writeBackupHistory = (records: BackupRecord[]): void => {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(BACKUP_HISTORY_PATH, JSON.stringify(records, null, 2))
}

const invalidateBackupCache = (): void => {
  backupCache = null
}

const seedFromArchiveDir = (): BackupRecord[] => {
  const { config } = getConfig()
  const localDest = config.destinations.find((d) => d.type === "local")
  if (!localDest?.path) return []

  const dir = localDest.path
  if (!existsSync(dir)) return []

  const files = readdirSync(dir)
  const archiveFiles = files
    .filter((f) => f.endsWith(".tar.gz") && !f.endsWith(".sha256"))
    .sort()
    .reverse()

  return archiveFiles.map((file) => {
    const filePath = resolve(dir, file)
    const st = statSync(filePath)
    const shaFile = file + ".sha256"
    const shaExists = existsSync(resolve(dir, shaFile))

    const match = file.match(/chest-backup-(\d{8})-(\d{6})/)
    const timestamp = match
      ? `${match[1].slice(0, 4)}-${match[1].slice(4, 6)}-${match[1].slice(6, 8)}T${match[2].slice(0, 2)}:${match[2].slice(2, 4)}:${match[2].slice(4, 6)}.000Z`
      : st.mtime.toISOString()

    return {
      id: stableId({ file, timestamp: st.mtimeMs }),
      timestamp,
      success: shaExists,
      archiveName: file,
      archiveSize: st.size,
      durationMs: 0,
      destinationResults: [{ success: shaExists, destLabel: localDest.path, durationMs: 0 }],
      errors: shaExists ? [] : ["Missing SHA256 checksum file"],
    }
  })
}

const getBackups = (page = 1, limit = 20): PaginatedResult<BackupRecord> => {
  const records = readBackupHistory()
  const start = (page - 1) * limit
  const paged = records.slice(start, start + limit)
  return { data: paged, total: records.length, page, limit }
}

const getBackupById = (id: string): BackupRecord | undefined => readBackupHistory().find((b) => b.id === id)

const buildDestUsage = async (
  dest: Destination,
  avgDurationMs: number,
): Promise<DestinationUsage | null> => {
  const name = dest.name
  const destType = dest.type

  if (destType === "local") {
    try {
      const dir = dest.path
      if (!existsSync(dir)) return null
      const files = readdirSync(dir).filter((f) => f.endsWith(".tar.gz") && !f.endsWith(".sha256"))
      const totalSize = files.reduce((acc, f) => acc + statSync(resolve(dir, f)).size, 0)
      return { type: "local", name, path: dir, totalSize, fileCount: files.length, avgDurationMs, available: true }
    } catch {
      console.warn("failed to scan local destination", dest.path)
      return null
    }
  }

  const usage = await withTimeout(scanSftpUsage(dest), 8000, null)
  if (!usage) return null
  return {
    type: "sftp",
    name,
    path: dest.path,
    totalSize: usage.totalSize,
    fileCount: usage.fileCount,
    avgDurationMs,
    available: true,
  }
}

const getBackupStats = (): BackupStats => {
  const records = readBackupHistory()
  const total = records.length
  const success = records.filter((b) => b.success).length
  const failed = total - success
  const avgDuration = total > 0 ? records.reduce((acc, b) => acc + b.durationMs, 0) / total : 0

  return { total, success, failed, avgDuration }
}

const getDestinationUsage = async (id: string): Promise<DestinationUsage | null> => {
  const dest = findDestinationById(id)
  if (!dest) return null

  const records = readBackupHistory()
  const total = records.length
  const avgDurationMs = total > 0 ? records.reduce((acc, b) => acc + b.durationMs, 0) / total : 0

  const usage = await buildDestUsage(dest, avgDurationMs)
  if (usage) return usage

  return {
    type: dest.type,
    name: dest.name,
    path: dest.path,
    totalSize: 0,
    fileCount: 0,
    avgDurationMs,
    available: false,
  }
}

const addBackupRecord = (record: BackupRecord): void => {
  const records = readBackupHistory()
  records.unshift(record)
  writeBackupHistory(records)
  backupCache = records
}

export { getBackups, getBackupById, getBackupStats, getDestinationUsage, addBackupRecord, invalidateBackupCache, readBackupHistory }
