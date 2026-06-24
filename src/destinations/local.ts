import { mkdirSync, cpSync } from "node:fs"
import { dirname, join } from "node:path"
import type { Destination } from "../types/config"
import type { StoreResult } from "../types/index"
import { logger } from "../utils/logger"

function copyChecksum(checksumFile: string, destDir: string): void {
  const shaName = checksumFile.split("/").pop()
  if (!shaName) return
  cpSync(checksumFile, join(destDir, shaName))
}

function storeLocal(
  archivePath: string,
  checksumFile: string | undefined,
  dest: Destination,
): StoreResult {
  const destDir = dirname(dest.path)
  mkdirSync(destDir, { recursive: true })

  const archiveName = archivePath.split("/").pop()
  if (!archiveName) return { success: false, error: "Invalid archive path" }

  const destPath = join(dest.path, archiveName)

  cpSync(archivePath, destPath)
  logger.info({ from: archivePath, to: destPath }, "archive copied to local destination")

  if (checksumFile) {
    copyChecksum(checksumFile, dest.path)
    logger.info({ from: checksumFile }, "checksum copied to local destination")
  }

  return { success: true }
}

export { storeLocal }
