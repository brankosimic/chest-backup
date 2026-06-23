import { readdirSync, unlinkSync } from "node:fs"
import { join } from "node:path"
import type { Destination } from "../types/config"
import { logger } from "../utils/logger"

const ARCHIVE_PATTERN = /^chest-backup-(\d{8}-\d{6})\.tar\.gz$/

function parseTimestampFromName(name: string): string | null {
  const match = ARCHIVE_PATTERN.exec(name)
  return match?.[1] ?? null
}

async function enforceRetention(destination: Destination, archivePrefix: string, globalRetention: number): Promise<void> {
  const retention = destination.retention ?? globalRetention
  const destPath = destination.path

  let files: string[]
  try {
    files = readdirSync(destPath).filter((f) => f.startsWith(archivePrefix) && ARCHIVE_PATTERN.test(f))
  } catch {
    logger.warn({ path: destPath }, "destination directory not found, skipping retention")
    return
  }

  if (files.length <= retention) return

  files.sort((a, b) => {
    const tsA = parseTimestampFromName(a)
    const tsB = parseTimestampFromName(b)
    if (!tsA || !tsB) return 0
    return tsB.localeCompare(tsA)
  })

  const toDelete = files.slice(retention)

  for (const file of toDelete) {
    const filePath = join(destPath, file)
    try {
      unlinkSync(filePath)
      logger.info({ file }, "deleted old archive for retention")
    } catch (err) {
      logger.error({ file, err }, "failed to delete old archive")
    }

    const shaPath = `${filePath}.sha256`
    try { unlinkSync(shaPath) } catch { logger.debug({ file: shaPath }, "checksum file not found for cleanup") }
  }
}

export { enforceRetention, parseTimestampFromName, ARCHIVE_PATTERN }
