import { $ } from "bun"
import { logger } from "../utils/logger"

const stopContainers = async (names: string[]): Promise<void> => {
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

const startContainers = async (names: string[]): Promise<void> => {
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

const ensureContainersStarted = async (containers: string[] | undefined): Promise<void> => {
  if (!containers?.length) return
  try {
    await startContainers(containers)
  } catch {
    logger.debug("container restart (best-effort) failed")
  }
}

const stopBackupContainers = async (containers: string[] | undefined, errors: string[]): Promise<void> => {
  if (!containers?.length) return
  try {
    await stopContainers(containers)
  } catch (err) {
    errors.push(`Failed to stop containers: ${String(err)}`)
  }
}

const startBackupContainers = async (containers: string[] | undefined, errors: string[]): Promise<void> => {
  if (!containers?.length) return
  try {
    await startContainers(containers)
  } catch (err) {
    errors.push(`Failed to start containers: ${String(err)}`)
  }
}

export { stopContainers, startContainers, ensureContainersStarted, stopBackupContainers, startBackupContainers }
