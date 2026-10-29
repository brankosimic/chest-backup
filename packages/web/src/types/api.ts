import type { LogLevel, RunSort, RunStatus, RunTrigger } from "@chest-backup/shared"
import type { ResourceUsage } from "@chest-backup/shared"

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

interface ScheduleInfo {
  schedule: string
  enabled: boolean
  lastRun?: string
  nextRun?: string
}

interface LogStats {
  total: number
  debug: number
  info: number
  warn: number
  error: number
  fatal: number
}

interface SystemInfo {
  status: string
  uptime: number
  version: string
  cpuUsage: number
  memoryUsage: ResourceUsage
  diskUsage: ResourceUsage
}

export type { Paginated, RunQuery, LogQuery, ScheduleInfo, LogStats, SystemInfo }
