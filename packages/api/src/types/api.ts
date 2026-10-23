import { RetentionMode } from "@core/types/config"

interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

interface DiskSpace {
  used: number
  total: number
}

interface DestinationUsage {
  type: string
  name?: string
  path: string
  totalSize: number
  fileCount: number
  avgDurationMs: number
  available: boolean
  diskSpace?: DiskSpace
}

interface LocalUsage {
  totalSize: number
  fileCount: number
}

interface BackupStats {
  total: number
  success: number
  failed: number
  partial: number
  skipped: number
  avgDuration: number
  totalUploadedBytes: number
  filesChanged: number
}

type Result<T> = { ok: true; data: T } | { ok: false; error: Response }

interface CpuTimes {
  total: number
  idle: number
}

interface Retention {
  globalRetention: number
  retentionMode: RetentionMode
}

interface ExcludeSettings {
  patterns: string[]
}

interface SourceExclusion {
  path: string
  total: number
  excluded: number
}

interface SourceExclusions {
  patterns: string[]
  sources: SourceExclusion[]
}

export type {
  PaginatedResult,
  BackupStats,
  DiskSpace,
  DestinationUsage,
  LocalUsage,
  Result,
  CpuTimes,
  Retention,
  ExcludeSettings,
  SourceExclusion,
  SourceExclusions,
}
