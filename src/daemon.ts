import { runBackup } from "./backup/orchestrator"
import { Scheduler } from "./scheduler/cron"
import { logger } from "./utils/logger"
import { loadConfig } from "./config/loader"
import type { BackupResult } from "./types/index"
import { DaemonStatus } from "./types/daemon"
import type { DaemonOptions, DaemonHandle } from "./types/daemon"

const createDaemon = async (
  onBackupComplete?: (result: BackupResult) => void,
  options?: DaemonOptions,
): Promise<DaemonHandle> => {
  const configPath = process.env.CHEST_CONFIG_PATH
  if (!configPath) {
    logger.warn("CHEST_CONFIG_PATH not set, daemon cannot start")
    throw new Error("CHEST_CONFIG_PATH not set")
  }

  const config = loadConfig(configPath)
  let isBackupRunning = false
  const { onStateChange, onNotify } = options ?? {}

  const runBackupIfIdle = async (): Promise<void> => {
    if (isBackupRunning) return

    isBackupRunning = true
    onStateChange?.(DaemonStatus.Running, "Backup in progress")
    onNotify?.("Backup Started", "Backup operation is in progress…")

    const result = await runBackup(config)
    isBackupRunning = false
    emitAfterBackup(result, onStateChange, onNotify)
    logger.info({ success: result.success, durationMs: result.durationMs }, "backup completed")
    onBackupComplete?.(result)
  }

  const scheduler = new Scheduler(config.schedule as string, runBackupIfIdle)
  scheduler.start()
  logger.info({ schedule: config.schedule }, "daemon mode started")
  onStateChange?.(DaemonStatus.Idle, "Waiting for schedule")
  setupShutdownHandlers(scheduler)

  return { runBackupNow: runBackupIfIdle, stop: () => { scheduler.stop(); process.exit(0) } }
}

const startDaemon = async (
  onBackupComplete?: (result: BackupResult) => void,
  options?: DaemonOptions,
): Promise<void> => {
  await createDaemon(onBackupComplete, options)
  await new Promise(() => {})
}

const setupShutdownHandlers = (scheduler: Scheduler): void => {
  for (const sig of ["SIGTERM", "SIGINT"] as const) {
    process.on(sig, () => {
      logger.info(`received ${sig}, shutting down`)
      scheduler.stop()
      process.exit(0)
    })
  }
}

const emitAfterBackup = (
  result: BackupResult,
  onStateChange?: DaemonOptions["onStateChange"],
  onNotify?: DaemonOptions["onNotify"],
): void => {
  const allSkipped = !!result.destinationResults.length && result.destinationResults.every((r) => r.skipped)
  const someSkipped = result.destinationResults.some((r) => r.skipped)

  const status = allSkipped
    ? DaemonStatus.Idle
    : result.success
      ? DaemonStatus.Success
      : DaemonStatus.Error

  const message = allSkipped
    ? "Skipped — No changes"
    : result.success
      ? `Completed — ${result.archiveName ?? ""}`
      : `Failed — ${result.errors[0] ?? "unknown error"}`

  onStateChange?.(status, message)

  if (!result.success) onNotify?.("Backup Failed", result.errors[0] ?? "unknown error")
  else if (allSkipped) onNotify?.("Backup Skipped", "All destinations already have the latest backup — no changes needed")
  else if (someSkipped) onNotify?.("Backup Successful", `Archive: ${result.archiveName ?? "unknown"} (some destinations skipped — identical)`)
  else onNotify?.("Backup Successful", `Archive: ${result.archiveName ?? "unknown"}`)
}

export { DaemonStatus, createDaemon, startDaemon }
export type { DaemonOptions, DaemonHandle }
