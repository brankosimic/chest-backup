import type { Destination } from "../types/config"
import type { StoreResult } from "../types/index"
import { storeLocal } from "./local"
import { storeFtp } from "./ftp"
import { logger } from "../utils/logger"

async function handleDestination(archivePath: string, dest: Destination): Promise<StoreResult> {
  try {
    if (dest.type === "local") {
      return await storeLocal(archivePath, dest)
    }
    if (dest.type === "ftp") {
      return await storeFtp(archivePath, dest)
    }
    return { success: false, error: `Unknown destination type: ${dest.type}` }
  } catch (err) {
    logger.error({ dest: dest.path, err }, "destination store failed")
    return { success: false, error: String(err) }
  }
}

export { handleDestination }
