import { runBackup } from "./backup/orchestrator"
import { Scheduler } from "./scheduler/cron"
import { logger } from "./utils/logger"
import { loadConfig } from "./config/loader"
import type { BackupResult } from "./types/index"
import { RunTrigger } from "@chest-backup/shared"
import { DaemonStatus } from "./types/daemon"
import type { Config } from "./types/config"
import type { DaemonOptions, DaemonHandle } from "./types/daemon"

interface DaemonState {
  config: Config
  options?: DaemonOptions
  onBackupComplete?: (result: BackupResult) => void
  isBackupRunning: boolean
}

const emitStarted = (options?: DaemonOptions): void => {
  options?.onStateChange?.(DaemonStatus.Running, "Backup in progress")
  options?.onNotify?.("Backup Started", "Backup operation is in progress…")
}

const runBackupIfIdle = async (state: DaemonState, trigger: RunTrigger = RunTrigger.Scheduled): Promise<void> => {
  if (state.isBackupRunning) return

  state.isBackupRunning = true
  emitStarted(state.options)

  const result = await runBackup(state.config, state.options?.onProgress, { trigger })
  state.isBackupRunning = false
  emitAfterBackup(result, state.options)
  logger.info({ success: result.success, durationMs: result.durationMs }, "backup completed")
  state.onBackupComplete?.(result)
}

const stopDaemon = (scheduler: Scheduler): void => {
  scheduler.stop()
  process.exit(0)
}

const createDaemon = (
  onBackupComplete?: (result: BackupResult) => void,
  options?: DaemonOptions,
): DaemonHandle => {
  const configPath = process.env.CHEST_CONFIG_PATH
  if (!configPath) {
    logger.warn("CHEST_CONFIG_PATH not set, daemon cannot start")
    throw new Error("CHEST_CONFIG_PATH not set")
  }

  const state: DaemonState = { config: loadConfig(configPath), options, onBackupComplete, isBackupRunning: false }
  const scheduler = new Scheduler(state.config.schedule as string, () => runBackupIfIdle(state, RunTrigger.Scheduled))
  scheduler.start()
  logger.info({ schedule: state.config.schedule }, "daemon mode started")
  options?.onStateChange?.(DaemonStatus.Idle, "Waiting for schedule")
  setupShutdownHandlers(scheduler)

  return {
    runBackupNow: () => runBackupIfIdle(state, RunTrigger.Manual),
    stop: () => {
      stopDaemon(scheduler)
    },
  }
}

const startDaemon = async (
  onBackupComplete?: (result: BackupResult) => void,
  options?: DaemonOptions,
): Promise<void> => {
  createDaemon(onBackupComplete, options)
  await new Promise(() => {})
}

const handleShutdown = (scheduler: Scheduler, sig: string): void => {
  logger.info(`received ${sig}, shutting down`)
  scheduler.stop()
  process.exit(0)
}

const setupShutdownHandlers = (scheduler: Scheduler): void => {
  for (const sig of ["SIGTERM", "SIGINT"] as const) {
    process.on(sig, () => {
      handleShutdown(scheduler, sig)
    })
  }
}

const emitAfterBackup = (result: BackupResult, options?: DaemonOptions): void => {
  const allSkipped = !!result.destinationResults.length && result.destinationResults.every((r) => r.skipped)
  const someSkipped = result.destinationResults.some((r) => r.skipped)

  const status = allSkipped ? DaemonStatus.Idle : result.success ? DaemonStatus.Success : DaemonStatus.Error

  const changed = result.filesChanged ?? 0
  const total = result.filesBackedUp ?? 0

  const message = allSkipped
    ? "Skipped — No changes"
    : result.success
      ? `Completed — ${String(changed)}/${String(total)} files changed`
      : `Failed — ${result.errors[0] ?? "unknown error"}`

  options?.onStateChange?.(status, message)

  if (!result.success) options?.onNotify?.("Backup Failed", result.errors[0] ?? "unknown error")
  else if (allSkipped) options?.onNotify?.("Backup Skipped", "All destinations already have the latest backup — no changes needed")
  else if (someSkipped) options?.onNotify?.("Backup Successful", `${String(changed)}/${String(total)} files changed (some destinations skipped)`)
  else options?.onNotify?.("Backup Successful", `${String(changed)}/${String(total)} files changed`)
}

export { createDaemon, startDaemon }
