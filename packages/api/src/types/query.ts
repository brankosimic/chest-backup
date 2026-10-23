import type { LogLevel, RunStatus, RunTrigger } from "@chest-backup/shared"

enum RunSort {
  Newest = "newest",
  Oldest = "oldest",
  Duration = "duration",
  Size = "size",
}

interface BackupQuery {
  page?: number
  limit?: number
  status?: RunStatus
  trigger?: RunTrigger
  destinationId?: string
  search?: string
  from?: string
  to?: string
  sort?: RunSort
}

interface LogQuery {
  level?: LogLevel
  levels?: LogLevel[]
  search?: string
  runId?: string
  since?: string
  page?: number
  limit?: number
}

export { RunSort }
export type { BackupQuery, LogQuery }
