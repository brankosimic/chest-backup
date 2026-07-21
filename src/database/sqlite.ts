import { $ } from "bun"
import { existsSync } from "node:fs"
import { join } from "node:path"
import type { SqliteSource, SqliteContainerSource, Source } from "../types/config"
import { logger } from "../utils/logger"

const getSqlite3Path = (): string => {
  const candidates = ["/usr/bin/sqlite3", "/usr/local/bin/sqlite3"]
  return candidates.find(existsSync) ?? "sqlite3"
}

const dumpSqliteDatabase = async (dbPath: string, outputPath: string): Promise<void> => {
  const sqlite3 = getSqlite3Path()
  logger.info({ dbPath, outputPath, sqlite3 }, "starting sqlite database backup")

  // Use .backup command for a consistent snapshot without exclusive lock requirement
  await $`${sqlite3} ${dbPath} ".backup ${outputPath}"`.quiet()

  logger.info({ outputPath }, "sqlite database backup completed")
}

const dumpSqliteSources = async (
  sources: Source[],
  timestamp: string,
  tempFiles: string[],
  tempDir: string,
): Promise<string[]> => {
  const sqliteSources = sources.filter((s): s is SqliteSource => s.type === "sqlite")
  if (!sqliteSources.length) return []

  const results = await Promise.all(
    sqliteSources.map(async (source) => {
      const dbName = source.path.split("/").pop() ?? "database.db"
      const outputPath = join(tempDir, `sqlite-backup-${timestamp}-${dbName}`)
      tempFiles.push(outputPath)
      try {
        await dumpSqliteDatabase(source.path, outputPath)
        return outputPath
      } catch (err) {
        logger.error({ source: source.path, err }, "sqlite backup failed")
        return null
      }
    }),
  )
  return results.filter((r): r is string => r !== null)
}

const dumpSqliteContainerDatabase = async (containerName: string, dbPath: string, outputPath: string): Promise<void> => {
  const tmpPath = `/tmp/sqlite-backup-${crypto.randomUUID()}.db`

  logger.info({ containerName, dbPath, outputPath }, "starting container sqlite database backup")

  try {
    await $`docker exec ${containerName} sqlite3 ${dbPath} ".backup ${tmpPath}"`.quiet()
    await $`docker cp ${containerName}:${tmpPath} ${outputPath}`.quiet()
    await $`docker exec ${containerName} rm -f ${tmpPath}`.quiet()

    logger.info({ outputPath }, "container sqlite database backup completed")
  } catch (err) {
    await $`docker exec ${containerName} rm -f ${tmpPath}`.nothrow().quiet()
    throw err
  }
}

const dumpSqliteContainerSources = async (
  sources: Source[],
  timestamp: string,
  tempFiles: string[],
  tempDir: string,
): Promise<string[]> => {
  const containerSources = sources.filter((s): s is SqliteContainerSource => s.type === "sqlite-container")
  if (!containerSources.length) return []

  const results = await Promise.all(
    containerSources.map(async (source) => {
      const dbName = source.dbPath.split("/").pop() ?? "database.db"
      const outputPath = join(tempDir, `sqlite-container-backup-${timestamp}-${dbName}`)
      tempFiles.push(outputPath)
      try {
        await dumpSqliteContainerDatabase(source.containerName, source.dbPath, outputPath)
        return outputPath
      } catch (err) {
        logger.error({ container: source.containerName, dbPath: source.dbPath, err }, "container sqlite backup failed")
        return null
      }
    }),
  )
  return results.filter((r): r is string => r !== null)
}

export { dumpSqliteDatabase, dumpSqliteSources, dumpSqliteContainerDatabase, dumpSqliteContainerSources }
