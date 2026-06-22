import { $ } from "bun"
import { logger } from "../utils/logger"

async function stopContainers(names: string[]): Promise<void> {
  for (const name of names) {
    try {
      await $`docker stop ${name}`.quiet()
      logger.info({ container: name }, "container stopped")
    } catch (err) {
      logger.error({ container: name, err }, "failed to stop container")
      throw err
    }
  }
}

async function startContainers(names: string[]): Promise<void> {
  for (const name of names) {
    try {
      await $`docker start ${name}`.quiet()
      logger.info({ container: name }, "container started")
    } catch (err) {
      logger.error({ container: name, err }, "failed to start container")
      throw err
    }
  }
}

export { stopContainers, startContainers }
