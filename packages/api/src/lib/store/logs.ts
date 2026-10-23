import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync } from "node:fs"
import { resolve } from "node:path"
import type { LogEntry } from "@chest-backup/shared"
import { LogLevel } from "@chest-backup/shared"
import type { PaginatedResult } from "../../types/api"
import type { LogQuery } from "../../types/query"
import { DATA_DIR } from "./config"
import { publish } from "../event-bus"

const LOG_FILE = resolve(DATA_DIR, "logs.jsonl")
const LOG_FILE_ARCHIVE = resolve(DATA_DIR, "logs.jsonl.1")

/** Maximum number of entries kept in the in-memory index (newest last). */
const MAX_MEMORY_ENTRIES = 10_000
/** Maximum size of the log file before it is rotated. */
const MAX_LOG_FILE_BYTES = 5 * 1024 * 1024
/** Number of entries written to disk per flush. */
const FLUSH_BATCH_SIZE = 50

const logBuffer: LogEntry[] = []
let pendingWrites: string[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
let sequence = 0

const ensureDataDir = (): void => {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
}

const parseLevel = (value: unknown): LogLevel => {
  if (Object.values(LogLevel).includes(value as LogLevel)) return value as LogLevel
  return LogLevel.Info
}

const nextId = (): string => {
  sequence += 1
  return `log-${String(Date.now())}-${String(sequence)}`
}

const rotateIfNeeded = (): void => {
  ensureDataDir()
  if (!existsSync(LOG_FILE)) return

  try {
    if (statSync(LOG_FILE).size < MAX_LOG_FILE_BYTES) return
  } catch (err) {
    console.error("failed to stat log file", err)
    return
  }

  try {
    if (existsSync(LOG_FILE_ARCHIVE)) rmSync(LOG_FILE_ARCHIVE, { force: true })
    renameSync(LOG_FILE, LOG_FILE_ARCHIVE)
  } catch (err) {
    console.error("failed to rotate log file", err)
  }
}

const flushToDisk = (): void => {
  if (!pendingWrites.length) return

  const batch = pendingWrites
  pendingWrites = []
  flushTimer = null

  try {
    ensureDataDir()
    rotateIfNeeded()
    appendFileSync(LOG_FILE, batch.join(""))
  } catch (err) {
    console.error("failed to append log entries", err)
  }
}

const scheduleFlush = (): void => {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushToDisk()
  }, 750)
}

const parseStoredLine = (line: string): LogEntry | null => {
  try {
    const parsed = JSON.parse(line) as Partial<LogEntry>
    if (typeof parsed.message !== "string") return null

    return {
      id: parsed.id ?? "",
      timestamp: parsed.timestamp ?? "",
      message: parsed.message,
      level: parseLevel(parsed.level),
      ...(parsed.runId ? { runId: parsed.runId } : {}),
      ...(parsed.metadata ? { metadata: parsed.metadata } : {}),
    }
  } catch (err) {
    console.error("failed to parse stored log line", err)
    return null
  }
}

const readStoredFile = (file: string): LogEntry[] => {
  try {
    return readFileSync(file, "utf-8")
      .split("\n")
      .filter((line) => !!line.trim())
      .flatMap((line) => {
        const entry = parseStoredLine(line)
        return entry ? [entry] : []
      })
  } catch (err) {
    console.error("failed to read log file", file, err)
    return []
  }
}

const loadFromDisk = (): void => {
  const files = existsSync(LOG_FILE_ARCHIVE) ? [LOG_FILE_ARCHIVE, LOG_FILE] : existsSync(LOG_FILE) ? [LOG_FILE] : []
  logBuffer.push(...files.flatMap(readStoredFile).slice(-MAX_MEMORY_ENTRIES))
}

loadFromDisk()

const addLogEntry = (entry: LogEntry): LogEntry => {
  const stored: LogEntry = {
    id: entry.id || nextId(),
    timestamp: entry.timestamp || new Date().toISOString(),
    level: parseLevel(entry.level),
    message: entry.message,
    ...(entry.runId ? { runId: entry.runId } : {}),
    ...(entry.metadata ? { metadata: entry.metadata } : {}),
  }

  logBuffer.push(stored)
  if (logBuffer.length > MAX_MEMORY_ENTRIES) logBuffer.splice(0, logBuffer.length - MAX_MEMORY_ENTRIES)

  pendingWrites.push(`${JSON.stringify(stored)}\n`)
  if (pendingWrites.length >= FLUSH_BATCH_SIZE) flushToDisk()
  else scheduleFlush()

  publish({ type: "log", entry: stored })
  return stored
}

const matchesSearch = (entry: LogEntry, needle: string): boolean => {
  if (entry.message.toLowerCase().includes(needle)) return true
  if (!entry.metadata) return false
  try {
    return JSON.stringify(entry.metadata).toLowerCase().includes(needle)
  } catch (err) {
    console.error("failed to search log metadata", err)
    return false
  }
}

const isWithinSince = (entry: LogEntry, since: string): boolean => {
  const from = Date.parse(since)
  if (Number.isNaN(from)) return true
  return Date.parse(entry.timestamp) >= from
}

const applyLogQuery = (entries: LogEntry[], query: LogQuery): LogEntry[] => {
  const levels = query.levels?.length ? query.levels : query.level ? [query.level] : []
  const needle = query.search?.toLowerCase()

  return entries.filter((entry) => {
    if (levels.length && !levels.includes(entry.level)) return false
    if (query.runId && entry.runId !== query.runId) return false
    if (query.since && !isWithinSince(entry, query.since)) return false
    return !needle || matchesSearch(entry, needle)
  })
}

const getLogs = (query: LogQuery = {}): PaginatedResult<LogEntry> => {
  const page = query.page ?? 1
  const limit = query.limit ?? 100
  const filtered = applyLogQuery([...logBuffer], query).sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  const start = (page - 1) * limit

  return { data: filtered.slice(start, start + limit), total: filtered.length, page, limit }
}

const getLogStats = (): { total: number; debug: number; info: number; warn: number; error: number; fatal: number } => {
  const stats = { total: logBuffer.length, debug: 0, info: 0, warn: 0, error: 0, fatal: 0 }

  for (const entry of logBuffer) stats[entry.level] += 1
  return stats
}

const clearLogs = (): void => {
  logBuffer.length = 0
  pendingWrites = []
  try {
    ensureDataDir()
    rmSync(LOG_FILE, { force: true })
    rmSync(LOG_FILE_ARCHIVE, { force: true })
  } catch (err) {
    console.error("failed to clear log files", err)
  }
}

const flushLogs = (): void => {
  flushToDisk()
}

export { addLogEntry, getLogs, getLogStats, clearLogs, flushLogs, nextId, LOG_FILE }
