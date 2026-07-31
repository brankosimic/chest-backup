import { statSync } from "node:fs"
import { loadConfig } from "@core/config/loader"
import { startDaemon } from "@core/daemon"
import { logger } from "@core/utils/logger"
import type { Config } from "@core/types/config"
import { persistBackupResult } from "./store"

let activeConfig: Config | null = null
let activeConfigPath: string | null = null
let activeConfigMtime = 0

const getActiveConfig = (): Config | null => {
  if (!activeConfigPath) return activeConfig

  try {
    const mtimeMs = statSync(activeConfigPath).mtimeMs
    if (mtimeMs !== activeConfigMtime) {
      activeConfig = loadConfig(activeConfigPath)
      activeConfigMtime = mtimeMs
      console.log("Chest-Backup config reloaded")
    }
  } catch (err) {
    logger.error({ err }, "failed to reload config, keeping last loaded state")
  }

  return activeConfig
}

const loadConfigForApi = (): void => {
  const configPath = process.env.CHEST_CONFIG_PATH
  if (!configPath) {
    console.log("Chest-Backup config skipped (no CHEST_CONFIG_PATH)")
    return
  }

  try {
    activeConfig = loadConfig(configPath)
    activeConfigPath = configPath
    activeConfigMtime = statSync(configPath).mtimeMs
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
