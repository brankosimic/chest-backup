import { loadConfig } from "./config/loader"
import { runBackup } from "./backup/orchestrator"
import { startDaemon } from "./daemon"
import { logger } from "./utils/logger"
import type { Config } from "./types/index"

const main = async (): Promise<void> => {
  process.title = "chest-backup"
  const args = process.argv.slice(2)
  const configPath = extractArg(args, "--config")
  const dryRun = args.includes("--dry-run")
  const runNow = args.includes("--run-now")

  const config = loadAndValidateConfig(configPath, dryRun)

  if (runNow) {
    const result = await runBackup(config)
    logger.info({ success: result.success, durationMs: result.durationMs }, "backup completed")

    if (!result.success) process.exit(1)
    process.exit(0)
  }

  if (!config.schedule) {
    logger.warn("no schedule configured and no --run-now flag, exiting")
    process.exit(0)
  }

  await startDaemon(config)
}

const extractArg = (args: string[], key: string): string | undefined => {
  const index = args.indexOf(key)

  if (index !== -1) return args[index + 1]
}

const loadAndValidateConfig = (configPath: string | undefined, dryRun: boolean): Config => {
  try {
    const config = loadConfig(configPath)

    if (dryRun) {
      logger.info("dry-run: config loaded successfully")
      logger.info({ sources: config.sources.length, destinations: config.destinations.length }, "config summary")
      process.exit(0)
    }

    return config
  } catch (err) {
    logger.fatal({ err }, "failed to load config")
    process.exit(1)
  }
}

await main()
