import { $ } from "bun"
import { statSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { logger } from "../utils/logger"

const TEMP_DIR = "/tmp"

const formatTimestamp = (ts: Date): string => {
  const y = String(ts.getFullYear())
  const m = String(ts.getMonth() + 1).padStart(2, "0")
  const d = String(ts.getDate()).padStart(2, "0")
  const h = String(ts.getHours()).padStart(2, "0")
  const min = String(ts.getMinutes()).padStart(2, "0")
  const s = String(ts.getSeconds()).padStart(2, "0")
  return `${y}${m}${d}-${h}${min}${s}`
}

const generateArchiveName = (timestamp: string): string => {
  return `chest-backup-${timestamp}.tar.gz`
}

const createArchive = async (timestamp: string, sources: string[], dbDumps: string[]): Promise<string> => {
  const archiveName = generateArchiveName(timestamp)
  const archivePath = join(TEMP_DIR, archiveName)

  const allFiles = [...sources, ...dbDumps]

  if (!allFiles.length) throw new Error("no files to archive")

  const fileList = join(TEMP_DIR, `file-list-${timestamp}.txt`)
  writeFileSync(fileList, allFiles.map((f) => f.replace(/^\//, "")).join("\n"))

  await $`tar czf ${archivePath} -C / -T ${fileList}`.quiet()

  const stats = statSync(archivePath)
  logger.info({ archiveName, size: stats.size, fileCount: allFiles.length }, "archive created")

  return archivePath
}

export { formatTimestamp, generateArchiveName, createArchive }
