import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs"
import type { BackupRecord, StoreResult } from "@chest-backup/shared"
import { RunStatus, RunTrigger, deriveRunStatus } from "@chest-backup/shared"
import { DATA_DIR, BACKUP_HISTORY_PATH } from "./config"
import { findDestinationById } from "./destinations"
import type { PaginatedResult, BackupStats, DestinationUsage } from "../../types/api"
import type { BackupQuery } from "../../types/query"
import { destAvgDurationMs, buildDestUsage } from "./usage"
import { applyQuery, paginate } from "./backup-query"
import { seedFromArchiveDir } from "./backup-seed"

// How many finished runs are kept on disk.
const MAX_HISTORY_RECORDS = 500
// How many individual file paths are kept per destination result.
const MAX_PATHS_PER_RESULT = 25

let backupCache: BackupRecord[] | null = null
let backupCacheMtimeMs = 0

// Historic records stored the run stamp as a local wall-clock value tagged as UTC; reinterpret it as local time.
const localStampToIso = (stamp: string): string => {
  const match = stamp.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/)
  if (!match) {
    const parsed = Date.parse(stamp)
    return Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString()
  }
  const [, y, mo, d, h, mi, s] = match
  return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)).toISOString()
}

const trimResult = (result: StoreResult): StoreResult => ({
  ...result,
  uploadedCount: result.uploadedCount ?? result.uploaded?.length,
  deletedCount: result.deletedCount ?? result.deleted?.length,
  uploaded: (result.uploaded ?? []).slice(0, MAX_PATHS_PER_RESULT),
  deleted: (result.deleted ?? []).slice(0, MAX_PATHS_PER_RESULT),
})

// Older records only flagged destination failures without a message; surface them as run-level errors.
const withDerivedErrors = (record: BackupRecord): BackupRecord => {
  if (record.errors.length) return record
  const derived = record.destinationResults
    .filter((result) => !result.success && !result.skipped)
    .map((result) => result.error ?? `Destination failed: ${result.destName ?? result.destPath ?? "destination"}`)
  return derived.length ? { ...record, errors: derived } : record
}

// Historic records only stored the destination type; recover name/path from the current config.
const fillDestinationMeta = (result: BackupRecord["destinationResults"][number]): BackupRecord["destinationResults"][number] => {
  if (result.destName && result.destPath) return result
  const dest = result.destId ? findDestinationById(result.destId) : undefined
  if (!dest) return result
  return { ...result, destName: result.destName ?? dest.name, destPath: result.destPath ?? dest.path, destType: result.destType ?? dest.type }
}

const resolveDestinationMeta = (record: BackupRecord): BackupRecord => {
  if (!record.destinationResults.some((result) => !result.destName || !result.destPath)) return record
  return { ...record, destinationResults: record.destinationResults.map(fillDestinationMeta) }
}

const hydrate = (record: BackupRecord): BackupRecord => withDerivedErrors(resolveDestinationMeta(record))

// Legacy records had no finish timestamp — derive it from the recorded duration.
const normalizeRecord = (raw: Partial<BackupRecord> & { id?: string }): BackupRecord => {
  const id = raw.id ?? `backup-${raw.timestamp ?? new Date().toISOString()}`
  const startedAt = raw.startedAt ?? localStampToIso(raw.timestamp ?? "")
  return {
    id,
    runId: raw.runId ?? id,
    status: raw.status ?? deriveRunStatus({ success: raw.success ?? false, results: raw.destinationResults ?? [] }),
    success: raw.success ?? false,
    trigger: raw.trigger ?? RunTrigger.Scheduled,
    timestamp: raw.timestamp ?? startedAt,
    startedAt,
    finishedAt: raw.finishedAt ?? new Date(Date.parse(startedAt) + (raw.durationMs ?? 0)).toISOString(),
    durationMs: raw.durationMs ?? 0,
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
    return Array.isArray(parsed) ? parsed.map((entry) => hydrate(normalizeRecord(entry as Partial<BackupRecord>))) : []
  } catch (err) {
    console.error("failed to read backup history", err)
    return []
  }
}

// Rewrites the history file when trimming removed a meaningful amount of data.
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

const persistHistory = (records: BackupRecord[]): void => {
  writeFileSync(BACKUP_HISTORY_PATH, JSON.stringify(records, null, 2))
  backupCache = records
  backupCacheMtimeMs = statSync(BACKUP_HISTORY_PATH).mtimeMs
}

const seedHistoryFile = (): BackupRecord[] => {
  const records = seedFromArchiveDir(normalizeRecord, localStampToIso)
  persistHistory(records)
  return records
}

const loadBackupHistory = (): BackupRecord[] => {
  const mtimeMs = statSync(BACKUP_HISTORY_PATH).mtimeMs
  if (backupCache && backupCacheMtimeMs === mtimeMs) return backupCache
  const records = readHistoryFile()
  backupCache = records
  backupCacheMtimeMs = mtimeMs
  compactHistoryFile(records, readFileSync(BACKUP_HISTORY_PATH, "utf-8").length)
  return records
}

const readBackupHistory = (): BackupRecord[] => {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(BACKUP_HISTORY_PATH)) return seedHistoryFile()
  return loadBackupHistory()
}

const writeBackupHistory = (records: BackupRecord[]): void => {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  persistHistory(records.slice(0, MAX_HISTORY_RECORDS))
}

const invalidateBackupCache = (): void => {
  backupCache = null
}

const getBackups = (query: BackupQuery = {}): PaginatedResult<BackupRecord> => {
  const page = query.page ?? 1
  const limit = query.limit ?? 20
  return paginate(applyQuery(readBackupHistory(), query), page, limit)
}

const getBackupById = (id: string): BackupRecord | undefined =>
  readBackupHistory().find((record) => record.id === id || record.runId === id)

const getBackupStats = (query: BackupQuery = {}): BackupStats => {
  const records = applyQuery(readBackupHistory(), query)
  return {
    total: records.length,
    success: records.filter((record) => record.status === RunStatus.Success).length,
    failed: records.filter((record) => record.status === RunStatus.Failed).length,
    partial: records.filter((record) => record.status === RunStatus.Partial).length,
    skipped: records.filter((record) => record.status === RunStatus.Skipped).length,
    avgDuration: records.length > 0 ? records.reduce((acc, record) => acc + record.durationMs, 0) / records.length : 0,
    totalUploadedBytes: records.reduce((acc, record) => acc + (record.totalUploadedBytes ?? 0), 0),
    filesChanged: records.reduce((acc, record) => acc + (record.filesChanged ?? 0), 0),
  }
}

const getDestinationUsage = async (id: string): Promise<DestinationUsage | null> => {
  const dest = findDestinationById(id)
  if (!dest) return null
  return buildDestUsage(dest, destAvgDurationMs(dest))
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
