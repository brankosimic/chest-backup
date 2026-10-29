import { Hono } from "hono"
import { LogLevel, RunTrigger } from "@chest-backup/shared"
import {
  getBackups,
  getBackupById,
  getBackupStats,
  addLogEntry,
  invalidateBackupCache,
  persistBackupResult,
} from "../lib/store"
import { runBackup, createRunId } from "@core/backup/orchestrator"
import { formatTimestamp } from "@core/backup/archiver"
import { getActiveConfig } from "../lib/api-config"
import { startRun, applyProgressEvent, completeRun, failRun, getProgress, getLastFinishedRun, getActiveRun } from "../lib/progress"
import { parseRunQuery } from "../lib/query"
import type { BackupProgressEvent } from "@core/types/index"

const backups = new Hono()

const logRunStart = (runId: string, destinationCount: number): void => {
  addLogEntry({
    id: `log-run-${runId}`,
    timestamp: new Date().toISOString(),
    level: LogLevel.Info,
    message: "Manual backup triggered",
    runId,
    metadata: { trigger: RunTrigger.Manual, destinations: destinationCount },
  })
}

const logRunFailure = (runId: string, message: string): void => {
  addLogEntry({
    id: `log-error-${runId}`,
    timestamp: new Date().toISOString(),
    level: LogLevel.Error,
    message: `Manual backup failed: ${message}`,
    runId,
    metadata: { error: message },
  })
}

backups.get("/", (c) => {
  return c.json({ success: true, data: getBackups(parseRunQuery(c)) })
})

backups.get("/stats", (c) => {
  return c.json({ success: true, data: getBackupStats(parseRunQuery(c)) })
})

backups.get("/progress", (c) => {
  const active = getProgress()
  if (!active) return c.json({ success: true, data: null })
  return c.json({ success: true, data: active, lastFinished: getLastFinishedRun() })
})

backups.get("/last", (c) => {
  return c.json({ success: true, data: getLastFinishedRun() })
})

backups.get("/active", (c) => {
  return c.json({ success: true, data: getActiveRun() ?? null })
})

backups.get("/:id", (c) => {
  const backup = getBackupById(c.req.param("id"))
  if (!backup) return c.json({ success: false, error: "Backup not found" }, 404)
  return c.json({ success: true, data: backup })
})

backups.post("/run", (c) => {
  const config = getActiveConfig()
  if (!config) return c.json({ success: false, error: "No config loaded — cannot run backup" }, 500)

  const runId = createRunId()
  const activeDestinations = config.destinations.filter((d) => !d.skip)
  startRun(
    runId,
    RunTrigger.Manual,
    activeDestinations.map((d) => ({ id: d.id, name: d.name, path: d.path, type: d.type })),
    formatTimestamp(new Date()),
  )
  logRunStart(runId, activeDestinations.length)

  runBackup(
    config,
    (event: BackupProgressEvent) => {
      applyProgressEvent(event)
    },
    { runId, trigger: RunTrigger.Manual },
  )
    .then((result) => {
      completeRun(result)
      invalidateBackupCache()
      persistBackupResult(result)
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      failRun(runId, message)
      logRunFailure(runId, message)
    })

  return c.json(
    { success: true, message: "Backup triggered successfully", data: { triggered: true, runId } },
    202,
  )
})

export { backups }
