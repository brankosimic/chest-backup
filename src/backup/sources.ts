import { existsSync } from "node:fs"
import { Glob } from "bun"
import type { Source } from "../types/config"
import { logger } from "../utils/logger"

async function resolveSources(sources: Source[]): Promise<string[]> {
  const resolved = new Set<string>()

  for (const source of sources) {
    const globber = new Glob(source.path)
    const matches = Array.from(globber.scanSync({ absolute: true }))

    if (!matches.length) {
      logger.warn({ path: source.path }, "source path matched no files")
      continue
    }

    for (const match of matches) {
      if (existsSync(match)) {
        resolved.add(match)
      }
    }
  }

  return Array.from(resolved)
}

export { resolveSources }
