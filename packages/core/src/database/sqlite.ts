import { $ } from "bun"
import { existsSync } from "node:fs"
import { join } from "node:path"
import type { SqliteSource, SqliteContainerSource, Source } from "../types/config"
import { logger } from "../utils/logger"
import { slugify } from "../utils/slug"

const basename = (value: string): string => value.split("/").pop() ?? "database"

const parentSlug = (value: string): string => slugify(value.split("/").slice(-2, -1)[0] ?? "", "database")

const getSqlite3Path = (): string => {
  const candidates = ["/usr/bin/sqlite3", "/usr/local/bin/sqlite3"]
  return candidates.find(existsSync) ?? "sqlite3"
}

const dumpSqliteDatabase = async (dbPath: string, outputPath: string): Promise<void> => {
  const sqlite3 = getSqlite3Path()
  logger.info({ dbPath, outputPath, sqlite3 }, "starting sqlite database backup")

  await $`${sqlite3} ${dbPath} ".backup ${outputPath}"`.quiet()

  logger.info({ outputPath }, "sqlite database backup completed")
}

const dumpName = (source: SqliteSource | SqliteContainerSource): string => {
  if (source.type === "sqlite-container") return `sqlite-backup-${slugify(`${source.containerName}-${basename(source.dbPath)}`, "database")}`
  return `sqlite-backup-${slugify(`${parentSlug(source.path)}-${basename(source.path)}`, "database")}`
}

const dumpSingleSqliteSource = async (source: SqliteSource, tempFiles: string[], tempDir: string, errors: string[]): Promise<string | null> => {
  const outputPath = join(tempDir, dumpName(source))
  tempFiles.push(outputPath)
  try {
    await dumpSqliteDatabase(source.path, outputPath)
    return outputPath
  } catch (err) {
    const message = `SQLite backup failed for ${source.path}: ${String(err)}`
    logger.error({ source: source.path, err }, "sqlite backup failed")
    errors.push(message)
    return null
  }
}

const dumpSqliteSources = async (sources: Source[], tempFiles: string[], tempDir: string, errors: string[]): Promise<string[]> => {
  const sqliteSources = sources.filter((s): s is SqliteSource => s.type === "sqlite")
  if (!sqliteSources.length) return []

  const results = await Promise.all(sqliteSources.map((s) => dumpSingleSqliteSource(s, tempFiles, tempDir, errors)))
  return results.filter((r): r is string => r !== null)
}

const dumpSqliteContainerDatabase = async (
  containerName: string,
  dbPath: string,
  outputPath: string,
): Promise<void> => {
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

const dumpSingleSqliteContainerSource = async (
  source: SqliteContainerSource,
  tempFiles: string[],
  tempDir: string,
  errors: string[],
): Promise<string | null> => {
  const outputPath = join(tempDir, dumpName(source))
  tempFiles.push(outputPath)
  try {
    await dumpSqliteContainerDatabase(source.containerName, source.dbPath, outputPath)
    return outputPath
  } catch (err) {
    const message = `SQLite container backup failed for ${source.containerName}:${source.dbPath}: ${String(err)}`
    logger.error({ container: source.containerName, dbPath: source.dbPath, err }, "container sqlite backup failed")
    errors.push(message)
    return null
  }
}

const dumpSqliteContainerSources = async (sources: Source[], tempFiles: string[], tempDir: string, errors: string[]): Promise<string[]> => {
  const containerSources = sources.filter((s): s is SqliteContainerSource => s.type === "sqlite-container")
  if (!containerSources.length) return []

  const results = await Promise.all(containerSources.map((s) => dumpSingleSqliteContainerSource(s, tempFiles, tempDir, errors)))
  return results.filter((r): r is string => r !== null)
}

export { dumpSqliteDatabase, dumpSqliteSources, dumpSqliteContainerDatabase, dumpSqliteContainerSources }
