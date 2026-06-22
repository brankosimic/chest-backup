import { $ } from "bun"
import { statSync } from "node:fs"
import { join } from "node:path"
import { logger } from "../utils/logger"

const TEMP_DIR = "/tmp"

function formatTimestamp(ts: Date): string {
  const y = ts.getFullYear()
  const m = String(ts.getMonth() + 1).padStart(2, "0")
  const d = String(ts.getDate()).padStart(2, "0")
  const h = String(ts.getHours()).padStart(2, "0")
  const min = String(ts.getMinutes()).padStart(2, "0")
  const s = String(ts.getSeconds()).padStart(2, "0")
  return `${y}${m}${d}-${h}${min}${s}`
}

function generateArchiveName(timestamp: string): string {
  return `chest-backup-${timestamp}.tar.gz`
}

async function createArchive(
  timestamp: string,
  sources: string[],
  dbDumps: string[],
): Promise<string> {
  const archiveName = generateArchiveName(timestamp)
  const archivePath = join(TEMP_DIR, archiveName)

  const allFiles = [...sources, ...dbDumps]

  if (!allFiles.length) {
    throw new Error("no files to archive")
  }

  const relativePaths = allFiles.map((f) => f.replace(/^\//, ""))

  await $`tar czf ${archivePath} -C / ${relativePaths}`.quiet()

  const stats = statSync(archivePath)
  logger.info({ archiveName, size: stats.size, fileCount: allFiles.length }, "archive created")

  return archivePath
}

export { formatTimestamp, generateArchiveName, createArchive }
