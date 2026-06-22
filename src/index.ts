import { loadConfig } from "./config/loader"
import { runBackup } from "./backup/orchestrator"
import { Scheduler } from "./scheduler/cron"
import { logger } from "./utils/logger"

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const configPath = extractArg(args, "--config")
  const dryRun = args.includes("--dry-run")
  const runNow = args.includes("--run-now")

  let config
  try {
    config = loadConfig(configPath)
  } catch (err) {
    logger.fatal({ err }, "failed to load config")
    process.exit(1)
  }

  if (dryRun) {
    logger.info("dry-run: config loaded successfully")
    logger.info({ sources: config.sources.length, destinations: config.destinations.length }, "config summary")
    process.exit(0)
  }

  if (runNow) {
    const result = await runBackup(config)
    logger.info({ success: result.success, durationMs: result.durationMs }, "backup completed")

    if (!result.success) {
      process.exit(1)
    }
    process.exit(0)
  }

  if (config.schedule) {
    const scheduler = new Scheduler(config.schedule, async () => {
      const result = await runBackup(config)
      logger.info({ success: result.success, durationMs: result.durationMs }, "scheduled backup completed")
    })

    scheduler.start()
    logger.info({ schedule: config.schedule }, "daemon mode started")

    process.on("SIGTERM", () => {
      logger.info("received SIGTERM, shutting down")
      scheduler.stop()
      process.exit(0)
    })

    process.on("SIGINT", () => {
      logger.info("received SIGINT, shutting down")
      scheduler.stop()
      process.exit(0)
    })

    await new Promise(() => {})
  } else {
    logger.warn("no schedule configured and no --run-now flag, exiting")
    process.exit(0)
  }
}

function extractArg(args: string[], key: string): string | undefined {
  const index = args.indexOf(key)
  if (index !== -1) {
    return args[index + 1]
  }
}

await main()
