import type { LogEntry } from "@chest-backup/shared"
import type { PaginatedResult } from "../../types/api"
import { readBackupHistory } from "./backups"

const MAX_LOG_ENTRIES = 500
const logBuffer: LogEntry[] = []

const pushLog = (entry: LogEntry): void => {
  logBuffer.push(entry)
  if (logBuffer.length > MAX_LOG_ENTRIES) logBuffer.splice(0, logBuffer.length - MAX_LOG_ENTRIES)
}

const addLogEntry = (entry: LogEntry): void => {
  pushLog(entry)
}

const seedLogsFromHistory = (): void => {
  for (const record of readBackupHistory()) {
    pushLog({
      id: `log-start-${record.id}`,
      timestamp: record.timestamp,
      level: "info",
      message: `Backup completed: ${record.archiveName ?? "unknown"}`,
      metadata: { archiveName: record.archiveName, success: record.success, durationMs: record.durationMs },
    })
  }
}

const parseTimestamp = (ts: string): string => {
  const m = ts.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}.000Z`
  return new Date().toISOString()
}

const getLogs = (level?: string, search?: string, page = 1, limit = 50): PaginatedResult<LogEntry> => {
  let filtered = [...logBuffer]
  if (level) filtered = filtered.filter((l) => l.level === level)
  if (search) filtered = filtered.filter((l) => l.message.toLowerCase().includes(search.toLowerCase()))
  filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  const start = (page - 1) * limit
  const paged = filtered.slice(start, start + limit)
  return { data: paged, total: filtered.length, page, limit }
}

export { seedLogsFromHistory, parseTimestamp, pushLog, addLogEntry, getLogs }
