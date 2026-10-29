import type { LogLevel, RunSort, RunStatus, RunTrigger } from "./enums"

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

interface LogStats {
  total: number
  debug: number
  info: number
  warn: number
  error: number
  fatal: number
}

export type { Paginated, RunQuery, LogQuery, LogStats }
