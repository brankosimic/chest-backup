import type { DaemonStatus, ConfigView, BackupRecord, DashboardStats } from "@chest-backup/shared"

const BASE = "/api"

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(`API error ${response.status}: ${body || response.statusText}`)
  }

  return response.json() as Promise<T>
}

const fetchStatus = (): Promise<DaemonStatus> =>
  fetch(`${BASE}/status`).then(handleResponse<DaemonStatus>)

const fetchConfig = (): Promise<ConfigView> =>
  fetch(`${BASE}/config`).then(handleResponse<ConfigView>)

const fetchHistory = (): Promise<BackupRecord[]> =>
  fetch(`${BASE}/history`).then(handleResponse<BackupRecord[]>)

const fetchStats = (): Promise<DashboardStats> =>
  fetch(`${BASE}/stats`).then(handleResponse<DashboardStats>)

const fetchLogs = (): Promise<{ lines: string[] }> =>
  fetch(`${BASE}/logs`).then(handleResponse<{ lines: string[] }>)

const triggerBackup = (): Promise<{ success: boolean; message: string }> =>
  fetch(`${BASE}/backup/trigger`, { method: "POST" }).then(handleResponse<{ success: boolean; message: string }>)

export { fetchStatus, fetchConfig, fetchHistory, fetchStats, fetchLogs, triggerBackup }
