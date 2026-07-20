interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

interface DestinationUsage {
  type: string
  name?: string
  path: string
  totalSize: number
  fileCount: number
  avgDurationMs: number
}

interface BackupStats {
  total: number
  success: number
  failed: number
  avgDuration: number
  totalSize: number
  destinations: DestinationUsage[]
}

export type { PaginatedResult, BackupStats, DestinationUsage }
