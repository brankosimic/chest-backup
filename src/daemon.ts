import { execSync, spawn } from "node:child_process"
import { runBackup } from "./backup/orchestrator"
import { Scheduler } from "./scheduler/cron"
import { TrayBridge } from "./tray/bridge"
import type { TrayCallbacks } from "./types/tray"
import { logger } from "./utils/logger"
import { loadConfig } from "./config/loader"
import type { Config, BackupResult } from "./types/index"

const startDaemon = async (onBackupComplete?: (result: BackupResult) => void): Promise<void> => {
  const configPath = process.env.CHEST_CONFIG_PATH
  if (!configPath) {
    logger.warn("CHEST_CONFIG_PATH not set, daemon cannot start")
    return
  }

  const config = loadConfig(configPath)
  const tray = new TrayBridge()
  let isBackupRunning = false

  const trayCallbacks = makeTrayCallbacks(tray, config, () => isBackupRunning, (v) => { isBackupRunning = v }, onBackupComplete)
  await tryStartTray(tray, trayCallbacks)

  const scheduler = new Scheduler(config.schedule as string, async () => {
    isBackupRunning = true
    tray.setState("running", "Backup in progress")
    tray.notify("Backup Started", "Backup operation is in progress…")

    const result = await runBackup(config)
    isBackupRunning = false
    updateAfterBackup(tray, result)
    onBackupComplete?.(result)
  })

  scheduler.start()
  logger.info({ schedule: config.schedule }, "daemon mode started")

  process.on("SIGTERM", () => {
    logger.info("received SIGTERM, shutting down")
    scheduler.stop()
    tray.stop()
    process.exit(0)
  })

  process.on("SIGINT", () => {
    logger.info("received SIGINT, shutting down")
    scheduler.stop()
    tray.stop()
    process.exit(0)
  })

  await new Promise(() => {})
}

const tryStartTray = async (tray: TrayBridge, callbacks: TrayCallbacks): Promise<void> => {
  try {
    await tray.start(callbacks)
    tray.setState("idle", "Waiting for schedule")
  } catch {
    logger.warn("system tray icon unavailable (continuing without it)")
  }
}

const makeTrayCallbacks = (
  tray: TrayBridge,
  config: Config,
  getRunning: () => boolean,
  setRunning: (v: boolean) => void,
  onBackupComplete?: (result: BackupResult) => void,
): TrayCallbacks => ({
  onRunNow: () => {
    if (getRunning()) return

    setRunning(true)
    tray.setState("running", "Backup in progress")
    tray.notify("Backup Started", "Manual backup operation is in progress…")

    void runBackup(config).then((result) => {
      setRunning(false)
      updateAfterBackup(tray, result)
      onBackupComplete?.(result)
    })
  },

  onShowStatus: () => {
    tray.notify("Chest Backup", "Daemon is running. Click Run Backup Now to start a manual backup.")
  },

  onOpenConfig: () => {
    try {
      execSync("xdg-open ./chest-backup.json", { timeout: 3000 })
    } catch {
      logger.debug("failed to open config file")
    }
  },

  onViewLogs: () => {
    const child = spawn("konsole", ["--hold", "-e", "journalctl", "--user", "-u", "chest-backup", "-n", "50", "--no-pager"], {
      detached: true,
      stdio: "ignore",
    })
    child.unref()
  },

  onQuit: () => {
    logger.info("quit requested from tray menu")
    process.exit(0)
  },
})

const updateAfterBackup = (tray: TrayBridge, result: BackupResult): void => {
  const allSkipped = !!result.destinationResults.length && result.destinationResults.every((r) => r.skipped)
  const someSkipped = result.destinationResults.some((r) => r.skipped)

  const message = allSkipped
    ? "Skipped — No changes"
    : result.success
      ? `Completed — ${result.archiveName ?? ""}`
      : `Failed — ${result.errors[0] ?? "unknown error"}`

  tray.setState(allSkipped ? "idle" : result.success ? "success" : "error", message)
  logger.info({ success: result.success, durationMs: result.durationMs }, "backup completed")

  if (!result.success) tray.notify("Backup Failed", result.errors[0] ?? "unknown error")
  else if (allSkipped) tray.notify("Backup Skipped", "All destinations already have the latest backup — no changes needed")
  else if (someSkipped) tray.notify("Backup Successful", `Archive: ${result.archiveName ?? "unknown"} (some destinations skipped — identical)`)
  else tray.notify("Backup Successful", `Archive: ${result.archiveName ?? "unknown"}`)
}

export { startDaemon }
