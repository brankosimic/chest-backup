interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

interface BackupStats {
  total: number
  success: number
  failed: number
  avgDuration: number
  totalSize: number
}

export type { PaginatedResult, BackupStats }
