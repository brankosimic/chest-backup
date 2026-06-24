import { existsSync } from "node:fs"
import { Glob } from "bun"
import type { Config, Source } from "../types/config"
import { logger } from "../utils/logger"
import { dumpPostgresSources } from "../database/postgres"

const resolveSourcePaths = (source: Source): string[] => {
  if (source.type !== "path") return []

  const globber = new Glob(source.path)
  const matches = Array.from(globber.scanSync({ absolute: true }))

  if (!matches.length) {
    logger.warn({ path: source.path }, "source path matched no files")
    return []
  }

  return matches.filter(existsSync)
}

const resolvePaths = (sources: Source[]): string[] => [
  ...new Set(sources.flatMap(resolveSourcePaths)),
]

const resolveContainers = (sources: Source[]): string[] =>
  sources.flatMap((s) => (s.type === "docker-compose" ? s.containers : []))

const resolveSources = async (
  config: Config,
  timestamp: string,
  tempFiles: string[],
): Promise<{ paths: string[]; containers: string[] }> => {
  const paths = resolvePaths(config.sources)
  const containers = resolveContainers(config.sources)

  const dbDumps = await dumpPostgresSources(config.sources, timestamp, tempFiles)
  paths.push(...dbDumps)

  return { paths, containers }
}

export { resolveSources }
