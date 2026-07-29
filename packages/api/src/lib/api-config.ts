import { loadConfig } from "@core/config/loader"
import { startDaemon } from "@core/daemon"
import { logger } from "@core/utils/logger"
import type { Config } from "@core/types/config"
import { persistBackupResult } from "./store"

let activeConfig: Config | null = null

const getActiveConfig = (): Config | null => activeConfig

const loadConfigForApi = (): void => {
  const configPath = process.env.CHEST_CONFIG_PATH
  if (!configPath) {
    console.log("Chest-Backup config skipped (no CHEST_CONFIG_PATH)")
    return
  }

  try {
    activeConfig = loadConfig(configPath)
    console.log("Chest-Backup config loaded")
  } catch (err) {
    logger.fatal({ err }, "failed to load config")
    process.exit(1)
  }
}

const loadAndStartDaemon = async (): Promise<void> => {
  try {
    await startDaemon(persistBackupResult)
    console.log("Chest-Backup daemon started")
  } catch (err) {
    logger.fatal({ err }, "failed to start daemon")
    process.exit(1)
  }
}

export { getActiveConfig, loadConfigForApi, loadAndStartDaemon }
