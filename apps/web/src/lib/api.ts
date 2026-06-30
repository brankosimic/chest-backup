import type {
  AppConfig,
  BackupResult,
  Destination,
  Source,
  SystemStatus,
} from "@/types"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

interface ApiResult<T> {
  data: T | null
  error: string | null
}

const handleResponse = async <T>(response: Response): Promise<ApiResult<T>> => {
  if (!response.ok) {
    let message = `HTTP ${response.status}`

    try {
      const body = (await response.json()) as { error?: string; message?: string }
      message = body.error ?? body.message ?? message
    } catch {
      // ignore
    }

    console.error(`API error [${response.status}]: ${message}`)
    return { data: null, error: message }
  }

  const data = (await response.json()) as T

  return { data, error: null }
}

const request = async <T>(path: string, init?: RequestInit): Promise<ApiResult<T>> => {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    })
    return await handleResponse<T>(response)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error"
    console.error(`API request failed: ${message}`)
    return { data: null, error: message }
  }
}

const getSystemStatus = (): Promise<ApiResult<SystemStatus>> => request<SystemStatus>("/api/status")
const getSources = (): Promise<ApiResult<Source[]>> => request<Source[]>("/api/sources")
const getSource = (id: string): Promise<ApiResult<Source>> => request<Source>(`/api/sources/${id}`)
const createSource = (source: Source): Promise<ApiResult<Source>> => request<Source>("/api/sources", { method: "POST", body: JSON.stringify(source) })
const updateSource = (id: string, source: Source): Promise<ApiResult<Source>> => request<Source>(`/api/sources/${id}`, { method: "PUT", body: JSON.stringify(source) })
const deleteSource = (id: string): Promise<ApiResult<void>> => request<void>(`/api/sources/${id}`, { method: "DELETE" })

const getDestinations = (): Promise<ApiResult<Destination[]>> => request<Destination[]>("/api/destinations")
const getDestination = (id: string): Promise<ApiResult<Destination>> => request<Destination>(`/api/destinations/${id}`)
const createDestination = (dest: Destination): Promise<ApiResult<Destination>> => request<Destination>("/api/destinations", { method: "POST", body: JSON.stringify(dest) })
const updateDestination = (id: string, dest: Destination): Promise<ApiResult<Destination>> => request<Destination>(`/api/destinations/${id}`, { method: "PUT", body: JSON.stringify(dest) })
const deleteDestination = (id: string): Promise<ApiResult<void>> => request<void>(`/api/destinations/${id}`, { method: "DELETE" })

const getConfig = (): Promise<ApiResult<AppConfig>> => request<AppConfig>("/api/config")
const updateConfig = (config: AppConfig): Promise<ApiResult<AppConfig>> => request<AppConfig>("/api/config", { method: "PUT", body: JSON.stringify(config) })

const runBackupNow = (): Promise<ApiResult<BackupResult>> => request<BackupResult>("/api/backup/run", { method: "POST" })
const getBackupHistory = (): Promise<ApiResult<BackupResult[]>> => request<BackupResult[]>("/api/backup/history")

export {
  BASE_URL,
  runBackupNow,
  getSystemStatus,
  getSources,
  getSource,
  createSource,
  updateSource,
  deleteSource,
  getDestinations,
  getDestination,
  createDestination,
  updateDestination,
  deleteDestination,
  getConfig,
  updateConfig,
  getBackupHistory,
}
