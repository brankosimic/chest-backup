import { loadConfig } from "@core/config/loader"
import { startDaemon } from "@core/daemon"
import { logger } from "@core/utils/logger"
import type { Config } from "@core/types/config"
import { persistBackupResult } from "./store"

let activeConfig: Config | null = null

const getActiveConfig = (): Config | null => activeConfig

const loadAndStartDaemon = async (): Promise<void> => {
  const configPath = process.env.CHEST_CONFIG_PATH
  if (!configPath) {
    console.log("Chest-Backup daemon skipped (no CHEST_CONFIG_PATH)")
    return
  }

  try {
    const config = loadConfig(configPath)
    activeConfig = config
    await startDaemon(persistBackupResult)
    console.log("Chest-Backup daemon started")
  } catch (err) {
    logger.fatal({ err }, "failed to start daemon")
    process.exit(1)
  }
}

export { getActiveConfig, loadAndStartDaemon }
