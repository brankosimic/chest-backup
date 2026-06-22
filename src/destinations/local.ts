import { mkdirSync, cpSync } from "node:fs"
import { dirname, join } from "node:path"
import type { Destination } from "../types/config"
import type { StoreResult } from "../types/index"
import { logger } from "../utils/logger"

async function storeLocal(archivePath: string, dest: Destination): Promise<StoreResult> {
  const destDir = dirname(dest.path)
  mkdirSync(destDir, { recursive: true })

  const archiveName = archivePath.split("/").pop()
  if (!archiveName) return { success: false, error: "Invalid archive path" }

  const destPath = join(dest.path, archiveName)

  cpSync(archivePath, destPath)
  logger.info({ from: archivePath, to: destPath }, "archive copied to local destination")

  return { success: true }
}

export { storeLocal }
