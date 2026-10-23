import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs"
import { resolve } from "node:path"
import type { BackupRecord, StoreResult } from "@chest-backup/shared"
import { DestinationType, RunStatus, RunTrigger, deriveRunStatus } from "@chest-backup/shared"
import { getConfig, stableId, DATA_DIR, BACKUP_HISTORY_PATH } from "./config"
import { findDestinationById } from "./entities"
import type { PaginatedResult, BackupStats, DestinationUsage } from "../../types/api"
import { RunSort } from "../../types/query"
import type { BackupQuery } from "../../types/query"
import { scanSftpUsage } from "@core/destinations/sftp"
import type { Destination } from "@core/types/config"
import { scanLocalUsage, withTimeout } from "../utils"
import { getLocalDiskSpace, getSftpDiskSpace } from "./disk-space"

/** How many finished runs are kept on disk. */
const MAX_HISTORY_RECORDS = 500
/** How many individual file paths are kept per destination result. */
const MAX_PATHS_PER_RESULT = 25

let backupCache: BackupRecord[] | null = null
let backupCacheMtimeMs = 0

/**
 * Historic records stored the run stamp as a local wall-clock value but tagged it as UTC.
 * Reinterpret it as local time so the stored instant matches what the operator saw.
 */
const localStampToIso = (stamp: string): string => {
  const match = stamp.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/)
  if (!match) {
    const parsed = Date.parse(stamp)
    return Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString()
  }

  const [, y, mo, d, h, mi, s] = match
  return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)).toISOString()
}

const trimResult = (result: StoreResult): StoreResult => {
  const uploaded = result.uploaded ?? []
  const deleted = result.deleted ?? []

  return {
    ...result,
    uploadedCount: result.uploadedCount ?? uploaded.length,
    deletedCount: result.deletedCount ?? deleted.length,
    uploaded: uploaded.slice(0, MAX_PATHS_PER_RESULT),
    deleted: deleted.slice(0, MAX_PATHS_PER_RESULT),
  }
}

/**
 * Older records only flagged destination failures without a message. Surface them as
 * run-level errors so the UI never shows a failed run without a reason.
 */
const withDerivedErrors = (record: BackupRecord): BackupRecord => {
  if (record.errors.length) return record

  const derived = record.destinationResults
    .filter((result) => !result.success && !result.skipped)
    .map((result) => result.error ?? `Destination failed: ${result.destName ?? result.destPath ?? "destination"}`)

  return derived.length ? { ...record, errors: derived } : record
}

/**
 * Historic records only stored the destination type. Recover the friendly name and path
 * from the current configuration so the UI can tell destinations apart.
 */
const resolveDestinationMeta = (record: BackupRecord): BackupRecord => {
  if (!record.destinationResults.some((result) => !result.destName || !result.destPath)) return record

  return {
    ...record,
    destinationResults: record.destinationResults.map((result) => {
      if (result.destName && result.destPath) return result
      const dest = result.destId ? findDestinationById(result.destId) : undefined
      if (!dest) return result

      return {
        ...result,
        destName: result.destName ?? dest.name,
        destPath: result.destPath ?? dest.path,
        destType: result.destType ?? dest.type,
      }
    }),
  }
}

const hydrate = (record: BackupRecord): BackupRecord => withDerivedErrors(resolveDestinationMeta(record))

const deriveStatus = (raw: Partial<BackupRecord>): RunStatus => {
  if (raw.status) return raw.status
  return deriveRunStatus({ success: raw.success ?? false, results: raw.destinationResults ?? [] })
}

const normalizeRecord = (raw: Partial<BackupRecord> & { id?: string }): BackupRecord => {
  const id = raw.id ?? `backup-${raw.timestamp ?? new Date().toISOString()}`
  const startedAt = raw.startedAt ?? localStampToIso(raw.timestamp ?? "")
  const durationMs = raw.durationMs ?? 0
  // Legacy records had no finish timestamp — derive it from the recorded duration.
  const finishedAt = raw.finishedAt ?? new Date(Date.parse(startedAt) + durationMs).toISOString()

  return {
    id,
    runId: raw.runId ?? id,
    status: deriveStatus(raw),
    success: raw.success ?? false,
    trigger: raw.trigger ?? RunTrigger.Scheduled,
    timestamp: raw.timestamp ?? startedAt,
    startedAt,
    finishedAt,
    durationMs,
    destinationResults: (raw.destinationResults ?? []).map(trimResult),
    errors: raw.errors ?? [],
    ...(raw.archiveName ? { archiveName: raw.archiveName } : {}),
    ...(raw.archiveSize !== undefined ? { archiveSize: raw.archiveSize } : {}),
    ...(raw.filesBackedUp !== undefined ? { filesBackedUp: raw.filesBackedUp } : {}),
    ...(raw.filesChanged !== undefined ? { filesChanged: raw.filesChanged } : {}),
    ...(raw.totalUploadedBytes !== undefined ? { totalUploadedBytes: raw.totalUploadedBytes } : {}),
  }
}

const readHistoryFile = (): BackupRecord[] => {
  try {
    const parsed: unknown = JSON.parse(readFileSync(BACKUP_HISTORY_PATH, "utf-8"))
    if (!Array.isArray(parsed)) return []
    return parsed.map((entry) => hydrate(normalizeRecord(entry as Partial<BackupRecord>)))
  } catch (err) {
    console.error("failed to read backup history", err)
    return []
  }
}

/**
 * Rewrites the history file when trimming removed a meaningful amount of data.
 */
const compactHistoryFile = (records: BackupRecord[], previousSize: number): void => {
  const serialized = JSON.stringify(records, null, 2)
  if (serialized.length > previousSize * 0.9) return

  try {
    writeFileSync(BACKUP_HISTORY_PATH, serialized)
    backupCacheMtimeMs = statSync(BACKUP_HISTORY_PATH).mtimeMs
  } catch (err) {
    console.error("failed to compact backup history", err)
  }
}

const seedHistoryFile = (): BackupRecord[] => {
  const records = seedFromArchiveDir()
  writeFileSync(BACKUP_HISTORY_PATH, JSON.stringify(records, null, 2))
  backupCache = records
  backupCacheMtimeMs = statSync(BACKUP_HISTORY_PATH).mtimeMs
  return records
}

const readBackupHistory = (): BackupRecord[] => {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(BACKUP_HISTORY_PATH)) return seedHistoryFile()

  const mtimeMs = statSync(BACKUP_HISTORY_PATH).mtimeMs
  if (backupCache && backupCacheMtimeMs === mtimeMs) return backupCache

  const raw = readFileSync(BACKUP_HISTORY_PATH, "utf-8")
  const records = readHistoryFile()
  backupCache = records
  backupCacheMtimeMs = mtimeMs
  compactHistoryFile(records, raw.length)
  return records
}

const writeBackupHistory = (records: BackupRecord[]): void => {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  const pruned = records.slice(0, MAX_HISTORY_RECORDS)
  writeFileSync(BACKUP_HISTORY_PATH, JSON.stringify(pruned, null, 2))
  backupCache = pruned
  backupCacheMtimeMs = statSync(BACKUP_HISTORY_PATH).mtimeMs
}

const invalidateBackupCache = (): void => {
  backupCache = null
}

const seedFromArchiveDir = (): BackupRecord[] => {
  const { config } = getConfig()
  const localDest = config.destinations.find((d) => d.type === DestinationType.Local)
  if (!localDest?.path) return []

  const dir = localDest.path
  if (!existsSync(dir)) return []

  return readdirSync(dir)
    .filter((f) => f.endsWith(".tar.gz") && !f.endsWith(".sha256"))
    .sort()
    .reverse()
    .map((file) => seedRecordFromArchive(file, dir, localDest))
}

const seedRecordFromArchive = (file: string, dir: string, localDest: { id?: string; name?: string; path: string }): BackupRecord => {
  const filePath = resolve(dir, file)
  const st = statSync(filePath)
  const shaExists = existsSync(resolve(dir, `${file}.sha256`))
  const match = file.match(/chest-backup-(\d{8})-(\d{6})/)
  const stamp = match
    ? `${match[1].slice(0, 4)}-${match[1].slice(4, 6)}-${match[1].slice(6, 8)}T${match[2].slice(0, 2)}:${match[2].slice(2, 4)}:${match[2].slice(4, 6)}.000Z`
    : st.mtime.toISOString()
  const startedAt = localStampToIso(stamp)

  return normalizeRecord({
    id: stableId({ file, timestamp: st.mtimeMs }),
    timestamp: stamp,
    startedAt,
    finishedAt: startedAt,
    success: shaExists,
    trigger: RunTrigger.Scheduled,
    archiveName: file,
    archiveSize: st.size,
    durationMs: 0,
    destinationResults: [
      {
        success: shaExists,
        destId: localDest.id,
        destName: localDest.name,
        destPath: localDest.path,
        destType: DestinationType.Local,
        destLabel: localDest.path,
        durationMs: 0,
        uploaded: [],
        deleted: [],
        uploadedCount: 0,
        deletedCount: 0,
      },
    ],
    errors: shaExists ? [] : ["Missing SHA256 checksum file"],
  })
}

const matchesSearch = (record: BackupRecord, needle: string): boolean => {
  if (record.id.toLowerCase().includes(needle)) return true
  if (record.runId.toLowerCase().includes(needle)) return true
  if (record.archiveName?.toLowerCase().includes(needle)) return true
  if (record.errors.some((error) => error.toLowerCase().includes(needle))) return true
  if (record.destinationResults.some((result) => result.destName?.toLowerCase().includes(needle))) return true
  return record.destinationResults.some((result) => result.destPath?.toLowerCase().includes(needle))
}

const isWithinRange = (record: BackupRecord, query: BackupQuery): boolean => {
  const started = Date.parse(record.startedAt)
  const from = query.from ? Date.parse(query.from) : Number.NaN
  const to = query.to ? Date.parse(query.to) : Number.NaN
  if (!Number.isNaN(from) && started < from) return false
  if (!Number.isNaN(to) && started > to) return false
  return true
}

const matchesDestination = (record: BackupRecord, destinationId: string): boolean =>
  record.destinationResults.some((result) => result.destId === destinationId || result.destPath === destinationId)

const compareRuns = (sort: BackupQuery["sort"]): ((a: BackupRecord, b: BackupRecord) => number) => {
  if (sort === RunSort.Oldest) return (a, b) => a.startedAt.localeCompare(b.startedAt)
  if (sort === RunSort.Duration) return (a, b) => b.durationMs - a.durationMs
  if (sort === RunSort.Size) return (a, b) => (b.totalUploadedBytes ?? 0) - (a.totalUploadedBytes ?? 0)
  return (a, b) => b.startedAt.localeCompare(a.startedAt)
}

const applyQuery = (records: BackupRecord[], query: BackupQuery): BackupRecord[] => {
  const needle = query.search?.toLowerCase()

  return records
    .filter((record) => !query.status || record.status === query.status)
    .filter((record) => !query.trigger || record.trigger === query.trigger)
    .filter((record) => !query.destinationId || matchesDestination(record, query.destinationId))
    .filter((record) => isWithinRange(record, query))
    .filter((record) => !needle || matchesSearch(record, needle))
    .sort(compareRuns(query.sort))
}

const getBackups = (query: BackupQuery = {}): PaginatedResult<BackupRecord> => {
  const page = query.page ?? 1
  const limit = query.limit ?? 20
  const filtered = applyQuery(readBackupHistory(), query)
  const start = (page - 1) * limit

  return { data: filtered.slice(start, start + limit), total: filtered.length, page, limit }
}

const getBackupById = (id: string): BackupRecord | undefined =>
  readBackupHistory().find((record) => record.id === id || record.runId === id)

const getBackupStats = (query: BackupQuery = {}): BackupStats => {
  const records = applyQuery(readBackupHistory(), query)
  const total = records.length
  const sum = (pick: (record: BackupRecord) => number): number => records.reduce((acc, record) => acc + pick(record), 0)

  return {
    total,
    success: records.filter((record) => record.status === RunStatus.Success).length,
    failed: records.filter((record) => record.status === RunStatus.Failed).length,
    partial: records.filter((record) => record.status === RunStatus.Partial).length,
    skipped: records.filter((record) => record.status === RunStatus.Skipped).length,
    avgDuration: total > 0 ? sum((record) => record.durationMs) / total : 0,
    totalUploadedBytes: sum((record) => record.totalUploadedBytes ?? 0),
    filesChanged: sum((record) => record.filesChanged ?? 0),
  }
}

const destAvgDurationMs = (dest: Destination): number => {
  const durations = readBackupHistory()
    .flatMap((record) => record.destinationResults)
    .filter((result) => result.success && !result.skipped && (result.destId === dest.id || result.destPath === dest.path))
    .map((result) => result.durationMs)
    .filter((duration): duration is number => typeof duration === "number" && duration > 0)

  return durations.length ? durations.reduce((acc, duration) => acc + duration, 0) / durations.length : 0
}

const buildLocalUsage = (dest: Destination, avgDurationMs: number): DestinationUsage | null => {
  try {
    if (!existsSync(dest.path)) return null
    const usage = scanLocalUsage(dest.path)
    return {
      type: dest.type,
      name: dest.name,
      path: dest.path,
      totalSize: usage.totalSize,
      fileCount: usage.fileCount,
      avgDurationMs,
      available: true,
      diskSpace: getLocalDiskSpace(dest.path),
    }
  } catch (err) {
    console.error("failed to scan local destination", dest.path, err)
    return null
  }
}

const buildSftpUsage = async (dest: Destination, avgDurationMs: number): Promise<DestinationUsage | null> => {
  const [usage, diskSpace] = await Promise.all([
    withTimeout(scanSftpUsage(dest), 30_000, null),
    getSftpDiskSpace(dest),
  ])
  if (!usage) return null

  return {
    type: dest.type,
    name: dest.name,
    path: dest.path,
    totalSize: usage.totalSize,
    fileCount: usage.fileCount,
    avgDurationMs,
    available: true,
    diskSpace,
  }
}

const buildDestUsage = async (dest: Destination, avgDurationMs: number): Promise<DestinationUsage | null> => {
  if (dest.type === DestinationType.Local) return buildLocalUsage(dest, avgDurationMs)
  return buildSftpUsage(dest, avgDurationMs)
}

const getDestinationUsage = async (id: string): Promise<DestinationUsage | null> => {
  const dest = findDestinationById(id)
  if (!dest) return null

  const avgDurationMs = destAvgDurationMs(dest)
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
    diskSpace: dest.type === DestinationType.Local ? getLocalDiskSpace(dest.path) : undefined,
  }
}

const addBackupRecord = (record: BackupRecord): void => {
  const records = readBackupHistory()
  records.unshift(hydrate(record))
  writeBackupHistory(records)
}

export {
  getBackups,
  getBackupById,
  getBackupStats,
  getDestinationUsage,
  addBackupRecord,
  invalidateBackupCache,
  readBackupHistory,
  normalizeRecord,
  localStampToIso,
}
