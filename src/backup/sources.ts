import { existsSync, statSync } from "node:fs"
import { Glob } from "bun"
import type { Config, Source, PostgresSource, PostgresContainerSource } from "../types/config"
import { logger } from "../utils/logger"
import { dumpPostgresContainerSources, dumpPostgresSources } from "../database/postgres"

const isDbSource = (s: Source): s is PostgresSource | PostgresContainerSource =>
  ["postgres", "postgres-container"].includes(s.type)

const resolveSourcePaths = (source: Source): string[] => {
  if (isDbSource(source)) return []

  if (source.type === "container-volume") {
    const basePath = source.volumePath
    if (source.include?.length)
      return [...new Set(source.include.flatMap(pattern => [...new Glob(`${basePath}/${pattern}`).scanSync({ absolute: true })].filter(existsSync)))]

    if (!existsSync(basePath)) {
      logger.warn({ path: basePath }, "container volume path does not exist")
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
    logger.warn({ path: source.path }, "source path does not exist")
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

const resolvePaths = (sources: Source[]): string[] => [
  ...new Set(sources.flatMap(resolveSourcePaths)),
]

const resolveContainers = (sources: Source[]): string[] =>
  sources.flatMap((s) => {
    if (s.type === "container-volume") return [s.containerName]
    return []
  })

const resolveSources = async (
  config: Config,
  timestamp: string,
  tempFiles: string[],
): Promise<{ paths: string[]; containers: string[] }> => {
  const paths = resolvePaths(config.sources)
  const containers = resolveContainers(config.sources)
  const tempDir = config.tempDir ?? "/tmp"

  const dbDumps = await dumpPostgresSources(config.sources, timestamp, tempFiles, tempDir)
  const containerDbDumps = await dumpPostgresContainerSources(config.sources, timestamp, tempFiles, tempDir)
  paths.push(...dbDumps, ...containerDbDumps)

  return { paths, containers }
}

export { resolveSources }
