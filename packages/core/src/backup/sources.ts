import { existsSync, statSync } from "node:fs"
import { Glob } from "bun"
import type { Config, Source, PostgresSource, PostgresContainerSource, SqliteSource, SqliteContainerSource, ContainerVolumeSource } from "../types/config"
import type { ResolvedSources } from "../types/sources"
import { logger } from "../utils/logger"
import { dumpPostgresContainerSources, dumpPostgresSources } from "../database/postgres"
import { dumpSqliteSources, dumpSqliteContainerSources } from "../database/sqlite"
import { createExcludeFilter } from "../utils/exclude"

const DB_SOURCE_TYPES = ["postgres", "postgres-container", "sqlite", "sqlite-container"] as const

const isDbSource = (s: Source): s is PostgresSource | PostgresContainerSource | SqliteSource | SqliteContainerSource =>
  DB_SOURCE_TYPES.includes(s.type as (typeof DB_SOURCE_TYPES)[number])

const scanGlob = (pattern: string, cwd?: string): string[] => [...new Glob(pattern).scanSync({ absolute: true, cwd })].filter(existsSync)

const resolveContainerVolumePaths = (source: ContainerVolumeSource, errors: string[]): string[] => {
  const basePath = source.volumePath
  const includePatterns = source.include ?? []
  if (includePatterns.length) {
    const matched = [...new Set(includePatterns.flatMap((pattern) => scanGlob(pattern, basePath)))]
    if (!matched.length) {
      const message = `container-volume "${source.containerName}" include patterns matched no files under ${basePath}`
      logger.warn({ container: source.containerName, path: basePath, include: includePatterns }, message)
      errors.push(message)
    }
    return matched
  }

  if (!existsSync(basePath)) {
    const message = `container volume path does not exist: ${basePath}`
    logger.warn({ path: basePath }, "container volume path does not exist")
    errors.push(message)
    return []
  }

  return statSync(basePath).isDirectory() ? scanGlob(`${basePath}/**/*`) : [basePath]
}

const resolveSourcePaths = (source: Source, errors: string[]): string[] => {
  if (isDbSource(source)) return []

  if (source.type === "container-volume") return resolveContainerVolumePaths(source, errors)

  const matches = scanGlob(source.path)
  if (matches.length) return matches

  if (!existsSync(source.path)) {
    const message = `source path does not exist: ${source.path}`
    logger.warn({ path: source.path }, "source path does not exist")
    errors.push(message)
    return []
  }

  return statSync(source.path).isDirectory() ? scanGlob(`${source.path}/**/*`) : [source.path]
}

const resolvePaths = (sources: Source[], errors: string[], exclude: string[] = []): string[] => {
  const resolved = [...new Set(sources.flatMap((s) => resolveSourcePaths(s, errors)))]
  const isExcluded = createExcludeFilter(exclude)
  const included = resolved.filter((path) => !isExcluded(path))

  const excluded = resolved.length - included.length
  if (excluded) logger.info({ excluded, patterns: exclude }, "paths excluded by exclude patterns")

  return included
}

const resolveContainers = (sources: Source[]): string[] =>
  sources
    .filter((s): s is ContainerVolumeSource | SqliteContainerSource =>
      ["container-volume", "sqlite-container"].includes(s.type))
    .map((s) => s.containerName)

const resolveSources = async (config: Config, tempFiles: string[], errors: string[]): Promise<ResolvedSources> => {
  const paths = resolvePaths(config.sources, errors, config.exclude)
  const containers = resolveContainers(config.sources)
  const tempDir = config.tempDir ?? "/tmp"

  const dbDumps = await dumpPostgresSources(config.sources, tempFiles, tempDir, errors)
  const containerDbDumps = await dumpPostgresContainerSources(config.sources, tempFiles, tempDir, errors)
  const sqliteDbDumps = await dumpSqliteSources(config.sources, tempFiles, tempDir, errors)
  const sqliteContainerDbDumps = await dumpSqliteContainerSources(config.sources, tempFiles, tempDir, errors)
  paths.push(...dbDumps, ...containerDbDumps, ...sqliteDbDumps, ...sqliteContainerDbDumps)

  return { paths, containers }
}

export { resolveSources }
