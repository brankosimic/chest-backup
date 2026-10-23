import type { ContainerVolume, BackupRunProgress, DestinationUsage } from "../types/backup"
import type { RetentionSettings, ExcludeUpdateData, ExcludeSettings } from "../types/mutations"
import type { SourceExclusions } from "../types/sources"
import type { LogQuery, Paginated, RunQuery } from "../types/api"
import type { Source, Destination, BackupRecord, ApiResponse, LogEntry, RunStats } from "@chest-backup/shared"
import { SourceErrorCode } from "@chest-backup/shared"

const BASE_URL = ""

const getAuthHeader = (): string | undefined => {
  const stored = localStorage.getItem("auth")
  return stored ? `Basic ${stored}` : undefined
}

const toApiError = (body: { error?: string; message?: string; code?: string } | null, status: number): Error =>
  Object.assign(new Error(body?.message ?? body?.error ?? `API error ${String(status)}`), { code: body?.code })

const isDuplicateSourceError = (err: unknown): boolean =>
  err instanceof Error && "code" in err && err.code === SourceErrorCode.Duplicate

const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const auth = getAuthHeader()
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: Object.assign(
      { "Content-Type": "application/json", ...(auth ? { Authorization: auth } : {}) },
      init?.headers,
    ),
    ...init,
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string; message?: string; code?: string } | null
    throw toApiError(body, response.status)
  }

  const json = (await response.json()) as ApiResponse<T>
  if (!json.success || json.data === undefined) {
    throw toApiError(json, response.status)
  }
  return json.data
}

const fetchSources = () => apiFetch<Source[]>("/api/sources")
const fetchSource = (id: string) => apiFetch<Source>(`/api/sources/${id}`)
const createSource = (data: Record<string, unknown>) =>
  apiFetch<Source>("/api/sources", { method: "POST", body: JSON.stringify(data) })
const updateSource = (id: string, data: Record<string, unknown>) =>
  apiFetch<Source>(`/api/sources/${id}`, { method: "PUT", body: JSON.stringify(data) })
const deleteSource = (id: string) => apiFetch<undefined>(`/api/sources/${id}`, { method: "DELETE" })

const fetchDestinations = () => apiFetch<Destination[]>("/api/destinations")
const fetchDestination = (id: string) => apiFetch<Destination>(`/api/destinations/${id}`)
const fetchDestinationUsage = (id: string) => apiFetch<DestinationUsage>(`/api/destinations/${id}/usage`)
const createDestination = (data: Record<string, unknown>) =>
  apiFetch<Destination>("/api/destinations", { method: "POST", body: JSON.stringify(data) })
const updateDestination = (id: string, data: Record<string, unknown>) =>
  apiFetch<Destination>(`/api/destinations/${id}`, { method: "PUT", body: JSON.stringify(data) })
const deleteDestination = (id: string) => apiFetch<undefined>(`/api/destinations/${id}`, { method: "DELETE" })

const fetchSchedule = () =>
  apiFetch<{ schedule: string; enabled: boolean; lastRun?: string; nextRun?: string }>("/api/schedule")
const updateSchedule = (data: { schedule: string; enabled: boolean }) =>
  apiFetch<{ schedule: string; enabled: boolean }>("/api/schedule", { method: "PUT", body: JSON.stringify(data) })

const fetchRetention = () => apiFetch<RetentionSettings>("/api/retention")
const updateRetention = (data: RetentionSettings) =>
  apiFetch<RetentionSettings>("/api/retention", { method: "PUT", body: JSON.stringify(data) })

const fetchExclude = () => apiFetch<ExcludeSettings>("/api/exclude")
const updateExclude = (data: ExcludeUpdateData) =>
  apiFetch<ExcludeSettings>("/api/exclude", { method: "PUT", body: JSON.stringify(data) })

const fetchNotifications = () => apiFetch<{ discord?: { webhookUrl: string; enabled: boolean } }>("/api/notifications")
const updateNotifications = (data: { discord?: { webhookUrl: string; enabled: boolean } }) =>
  apiFetch<{ discord?: { webhookUrl: string; enabled: boolean } }>("/api/notifications", {
    method: "PUT",
    body: JSON.stringify(data),
  })

const toParams = (query: Record<string, string | number | null | undefined>): string => {
  const params = new URLSearchParams()
  Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .forEach(([key, value]) => {
      params.set(key, String(value))
    })
  const serialized = params.toString()
  return serialized ? `?${serialized}` : ""
}

const fetchBackups = (query: RunQuery = {}) =>
  apiFetch<Paginated<BackupRecord>>(
    `/api/backups${toParams({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      status: query.status,
      trigger: query.trigger,
      destinationId: query.destinationId,
      search: query.search,
      from: query.from,
      to: query.to,
      sort: query.sort,
    })}`,
  )

const fetchBackupStats = (query: RunQuery = {}) =>
  apiFetch<RunStats>(
    `/api/backups/stats${toParams({
      status: query.status,
      trigger: query.trigger,
      destinationId: query.destinationId,
      search: query.search,
      from: query.from,
      to: query.to,
    })}`,
  )

const triggerBackup = () =>
  apiFetch<{ triggered: boolean; runId: string }>("/api/backups/run", { method: "POST" })

const fetchBackupProgress = () => apiFetch<BackupRunProgress>("/api/backups/progress")

const fetchLogs = (query: LogQuery = {}) =>
  apiFetch<Paginated<LogEntry>>(
    `/api/logs${toParams({
      level: query.level,
      levels: query.levels?.length ? query.levels.join(",") : undefined,
      search: query.search,
      runId: query.runId,
      since: query.since,
      page: query.page ?? 1,
      limit: query.limit ?? 200,
    })}`,
  )

const fetchLogStats = () =>
  apiFetch<{ total: number; debug: number; info: number; warn: number; error: number; fatal: number }>("/api/logs/stats")

const clearStoredLogs = () => apiFetch<{ cleared: boolean }>("/api/logs", { method: "DELETE" })

const fetchSystem = () =>
  apiFetch<{
    status: string
    uptime: number
    version: string
    cpuUsage: number
    memoryUsage: { used: number; total: number }
    diskUsage: { used: number; total: number }
  }>("/api/system")

const testNotification = (webhookUrl: string) =>
  apiFetch<{ success: boolean; message: string }>("/api/notifications/test", {
    method: "POST",
    body: JSON.stringify({ webhookUrl }),
  })

const fetchSourceExclusions = () => apiFetch<SourceExclusions>("/api/sources/exclusions")

const fetchDockerContainers = () => apiFetch<string[]>("/api/sources/containers")

const fetchContainerVolumes = (containerName: string) =>
  apiFetch<ContainerVolume[]>(`/api/sources/containers/${encodeURIComponent(containerName)}/volumes`)

const fetchPostgresDatabases = (data: {
  type: "postgres" | "postgres-container"
  host?: string
  port?: number
  user: string
  password: string
  containerName?: string
  database?: string
}) =>
  apiFetch<string[]>("/api/sources/databases", {
    method: "POST",
    body: JSON.stringify(data),
  })

export {
  apiFetch,
  isDuplicateSourceError,
  fetchSources,
  fetchSource,
  createSource,
  updateSource,
  deleteSource,
  fetchDestinations,
  fetchDestination,
  fetchDestinationUsage,
  createDestination,
  updateDestination,
  deleteDestination,
  fetchSchedule,
  updateSchedule,
  fetchRetention,
  updateRetention,
  fetchExclude,
  updateExclude,
  fetchNotifications,
  updateNotifications,
  fetchSourceExclusions,
  fetchBackups,
  fetchBackupStats,
  triggerBackup,
  fetchBackupProgress,
  fetchLogs,
  fetchLogStats,
  clearStoredLogs,
  fetchSystem,
  testNotification,
  fetchDockerContainers,
  fetchContainerVolumes,
  fetchPostgresDatabases,
  type Paginated,
  type RunQuery,
  type LogQuery,
}
