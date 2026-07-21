import type { Source, Destination, BackupRecord, ApiResponse } from "@chest-backup/shared"

const BASE_URL = ""

const getAuthHeader = (): string | undefined => {
  const stored = localStorage.getItem("auth")
  return stored ? `Basic ${stored}` : undefined
}

const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const auth = getAuthHeader()
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(auth ? { Authorization: auth } : {}), ...init?.headers },
    ...init,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string; message?: string } | null
    throw new Error(body?.error ?? body?.message ?? `API error ${response.status}`)
  }

  const json = (await response.json()) as ApiResponse<T>
  if (!json.success || json.data === undefined) {
    throw new Error(json.error ?? "Unexpected API response")
  }
  return json.data
}

const fetchSources = () => apiFetch<Source[]>("/api/sources")
const fetchSource = (id: string) => apiFetch<Source>(`/api/sources/${id}`)
const createSource = (data: Record<string, unknown>) =>
  apiFetch<Source>("/api/sources", { method: "POST", body: JSON.stringify(data) })
const updateSource = (id: string, data: Record<string, unknown>) =>
  apiFetch<Source>(`/api/sources/${id}`, { method: "PUT", body: JSON.stringify(data) })
const deleteSource = (id: string) =>
  apiFetch<void>(`/api/sources/${id}`, { method: "DELETE" })

const fetchDestinations = () => apiFetch<Destination[]>("/api/destinations")
const fetchDestination = (id: string) => apiFetch<Destination>(`/api/destinations/${id}`)
const createDestination = (data: Record<string, unknown>) =>
  apiFetch<Destination>("/api/destinations", { method: "POST", body: JSON.stringify(data) })
const updateDestination = (id: string, data: Record<string, unknown>) =>
  apiFetch<Destination>(`/api/destinations/${id}`, { method: "PUT", body: JSON.stringify(data) })
const deleteDestination = (id: string) =>
  apiFetch<void>(`/api/destinations/${id}`, { method: "DELETE" })

const fetchSchedule = () =>
  apiFetch<{ schedule: string; enabled: boolean; lastRun?: string; nextRun?: string }>("/api/schedule")
const updateSchedule = (data: { schedule: string; enabled: boolean }) =>
  apiFetch<{ schedule: string; enabled: boolean }>("/api/schedule", { method: "PUT", body: JSON.stringify(data) })

const fetchRetention = () =>
  apiFetch<{ globalRetention: number; destinations: { id: string; retention: number }[] }>("/api/retention")
const updateRetention = (data: { globalRetention: number; destinations: { id: string; retention: number }[] }) =>
  apiFetch<{ globalRetention: number; destinations: { id: string; retention: number }[] }>("/api/retention", { method: "PUT", body: JSON.stringify(data) })

const fetchNotifications = () =>
  apiFetch<{ discord?: { webhookUrl: string; enabled: boolean } }>("/api/notifications")
const updateNotifications = (data: { discord?: { webhookUrl: string; enabled: boolean } }) =>
  apiFetch<{ discord?: { webhookUrl: string; enabled: boolean } }>("/api/notifications", { method: "PUT", body: JSON.stringify(data) })

const fetchBackups = (page = 1, limit = 50) =>
  apiFetch<{ data: BackupRecord[]; total: number; page: number; limit: number }>(`/api/backups?page=${page}&limit=${limit}`)

const fetchBackupStats = () =>
  apiFetch<{ total: number; success: number; failed: number; avgDuration: number; totalSize: number; destinations: { type: string; name?: string; path: string; totalSize: number; fileCount: number; avgDurationMs: number }[] }>("/api/backups/stats")

const triggerBackup = () =>
  apiFetch<{ success: boolean; message: string }>("/api/backups/run", { method: "POST" })

const fetchLogs = (level?: string, search?: string, limit = 100) => {
  const params = new URLSearchParams()
  if (level && level !== "all") params.set("level", level)
  if (search) params.set("search", search)
  params.set("limit", String(limit))
  return apiFetch<{ data: { id: string; timestamp: string; level: string; message: string }[]; total: number }>(`/api/logs?${params.toString()}`)
}

const fetchSystem = () =>
  apiFetch<{ status: string; uptime: number; version: string; cpuUsage: number; memoryUsage: { used: number; total: number }; diskUsage: { used: number; total: number } }>("/api/system")

const testNotification = (webhookUrl: string) =>
  apiFetch<{ success: boolean; message: string }>("/api/notifications/test", {
    method: "POST",
    body: JSON.stringify({ webhookUrl }),
  })

interface ContainerVolume {
  type: string
  source: string
  destination: string
  name?: string
  rw: boolean
}

const fetchDockerContainers = () =>
  apiFetch<string[]>("/api/sources/containers")

const fetchContainerVolumes = (containerName: string) =>
  apiFetch<ContainerVolume[]>(`/api/sources/containers/${encodeURIComponent(containerName)}/volumes`)

const fetchPostgresDatabases = (data: { type: "postgres" | "postgres-container"; host?: string; port?: number; user: string; password: string; containerName?: string; database?: string }) =>
  apiFetch<string[]>("/api/sources/databases", {
    method: "POST",
    body: JSON.stringify(data),
  })

export {
  apiFetch,
  fetchSources,
  fetchSource,
  createSource,
  updateSource,
  deleteSource,
  fetchDestinations,
  fetchDestination,
  createDestination,
  updateDestination,
  deleteDestination,
  fetchSchedule,
  updateSchedule,
  fetchRetention,
  updateRetention,
  fetchNotifications,
  updateNotifications,
  fetchBackups,
  fetchBackupStats,
  triggerBackup,
  fetchLogs,
  fetchSystem,
  testNotification,
  fetchDockerContainers,
  fetchContainerVolumes,
  fetchPostgresDatabases,
}

export type { ContainerVolume }
