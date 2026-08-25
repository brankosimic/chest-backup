import { existsSync, statSync } from "node:fs"
import { Glob } from "bun"
import type {
  Config,
  Source,
  PostgresSource,
  PostgresContainerSource,
  ContainerVolumeSource,
  SqliteSource,
  SqliteContainerSource,
} from "../types/config"
import { logger } from "../utils/logger"
import { dumpPostgresContainerSources, dumpPostgresSources } from "../database/postgres"
import { dumpSqliteSources, dumpSqliteContainerSources } from "../database/sqlite"

const isDbSource = (s: Source): s is PostgresSource | PostgresContainerSource | SqliteSource | SqliteContainerSource =>
  ["postgres", "postgres-container", "sqlite", "sqlite-container"].includes(s.type)

const resolveSourcePaths = (source: Source, errors: string[]): string[] => {
  if (isDbSource(source)) return []

  if (source.type === "container-volume") {
    const basePath = source.volumePath
    if (source.include?.length) {
      const matched = [
        ...new Set(
          source.include.flatMap((pattern) =>
            [...new Glob(`${basePath}/${pattern}`).scanSync({ absolute: true })].filter(existsSync),
          ),
        ),
      ]
      if (!matched.length)
        errors.push(`container-volume "${source.containerName}" include patterns matched no files under ${basePath}`)
      return matched
    }

    if (!existsSync(basePath)) {
      const message = `container volume path does not exist: ${basePath}`
      logger.warn({ path: basePath }, "container volume path does not exist")
      errors.push(message)
      return []
    }

    const stat = statSync(basePath)
    if (stat.isDirectory()) {
      const dirGlobber = new Glob(`${basePath}/**/*`)
      return Array.from(dirGlobber.scanSync({ absolute: true })).filter(existsSync)
    }

    return [basePath]
  }

  const globber = new Glob(source.path)
  const matches = Array.from(globber.scanSync({ absolute: true })).filter(existsSync)

  if (matches.length > 0) return matches

  if (!existsSync(source.path)) {
    const message = `source path does not exist: ${source.path}`
    logger.warn({ path: source.path }, "source path does not exist")
    errors.push(message)
    return []
  }

  const stat = statSync(source.path)
  if (stat.isDirectory()) {
    const dirGlobber = new Glob(`${source.path}/**/*`)
    const dirMatches = Array.from(dirGlobber.scanSync({ absolute: true }))
    return dirMatches.filter(existsSync)
  }

  return [source.path]
}

const resolvePaths = (sources: Source[], errors: string[]): string[] => [
  ...new Set(sources.flatMap((s) => resolveSourcePaths(s, errors))),
]

const resolveContainers = (sources: Source[]): string[] =>
  sources
    .filter((s): s is ContainerVolumeSource | SqliteContainerSource =>
      ["container-volume", "sqlite-container"].includes(s.type))
    .map((s) => s.containerName)

const resolveSources = async (
  config: Config,
  timestamp: string,
  tempFiles: string[],
  errors: string[],
): Promise<{ paths: string[]; containers: string[] }> => {
  const paths = resolvePaths(config.sources, errors)
  const containers = resolveContainers(config.sources)
  const tempDir = config.tempDir ?? "/tmp"

  const dbDumps = await dumpPostgresSources(config.sources, timestamp, tempFiles, tempDir, errors)
  const containerDbDumps = await dumpPostgresContainerSources(config.sources, timestamp, tempFiles, tempDir, errors)
  const sqliteDbDumps = await dumpSqliteSources(config.sources, timestamp, tempFiles, tempDir, errors)
  const sqliteContainerDbDumps = await dumpSqliteContainerSources(config.sources, timestamp, tempFiles, tempDir, errors)
  paths.push(...dbDumps, ...containerDbDumps, ...sqliteDbDumps, ...sqliteContainerDbDumps)

  return { paths, containers }
}

export { resolveSources }
