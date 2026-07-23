import { mkdirSync, cpSync, readFileSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import type { Destination } from "../types/config"
import type { StoreResult } from "../types/index"
import { ARCHIVE_PATTERN, parseTimestampFromName } from "../backup/retention"
import { logger } from "../utils/logger"

const copyChecksum = (checksumFile: string, destDir: string): void => {
  const shaName = checksumFile.split("/").pop()
  if (!shaName) return
  cpSync(checksumFile, join(destDir, shaName))
}

const getLatestChecksumLocal = (dest: Destination): string | null => {
  let files: string[]
  try {
    files = readdirSync(dest.path).filter((f) => ARCHIVE_PATTERN.test(f))
  } catch {
    return null
  }

  if (!files.length) return null

  files.sort((a, b) => {
    const tsA = parseTimestampFromName(a)
    const tsB = parseTimestampFromName(b)
    if (!tsA || !tsB) return 0
    return tsB.localeCompare(tsA)
  })

  const latest = files[0]
  if (!latest) return null

  const shaPath = join(dest.path, `${latest}.sha256`)
  try {
    const content = readFileSync(shaPath, "utf8")
    return content.split(/\s+/)[0] ?? null
  } catch {
    return null
  }
}

const storeLocal = (
  archivePath: string,
  checksumFile: string | undefined,
  dest: Destination,
): StoreResult => {
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

export { getLatestChecksumLocal, storeLocal }
