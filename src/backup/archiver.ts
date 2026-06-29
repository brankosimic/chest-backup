import { $ } from "bun"
import { statSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { logger } from "../utils/logger"

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

const createArchive = async (timestamp: string, sources: string[], dbDumps: string[], tempDir: string, tempFiles?: string[]): Promise<string> => {
  const archiveName = generateArchiveName(timestamp)
  const archivePath = join(tempDir, archiveName)

  const allFiles = [...sources, ...dbDumps]

  if (!allFiles.length) throw new Error("no files to archive")

  const fileList = join(tempDir, `file-list-${timestamp}.txt`)
  writeFileSync(fileList, allFiles.map((f) => f.replace(/^\//, "")).join("\n"))
  tempFiles?.push(fileList)

  await $`tar czf ${archivePath} -C / -T ${fileList}`.quiet()

  const stats = statSync(archivePath)
  logger.info({ archiveName, size: stats.size, fileCount: allFiles.length }, "archive created")

  return archivePath
}

export { formatTimestamp, generateArchiveName, createArchive }
