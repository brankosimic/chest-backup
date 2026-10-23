import type { LogLevel, RunStatus, RunTrigger } from "@chest-backup/shared"

enum RunSort {
  Newest = "newest",
  Oldest = "oldest",
  Duration = "duration",
  Size = "size",
}

interface Paginated<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

interface RunQuery {
  page?: number
  limit?: number
  status?: RunStatus | null
  trigger?: RunTrigger | null
  destinationId?: string | null
  search?: string
  from?: string
  to?: string
  sort?: RunSort
}

interface LogQuery {
  level?: LogLevel | null
  levels?: LogLevel[]
  search?: string
  runId?: string
  since?: string
  page?: number
  limit?: number
}

export { RunSort }
export type { Paginated, RunQuery, LogQuery }
