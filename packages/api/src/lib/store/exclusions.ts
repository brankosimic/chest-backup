import type { SourceExclusions } from "../../types/api"
import { summarizeSourceFiles } from "@core/utils/exclude"
import { getConfig } from "./config"

const CACHE_TTL_MS = 30_000

let cached: { expiresAt: number; value: SourceExclusions } | null = null

const buildExclusions = (): SourceExclusions => {
  const { config } = getConfig()
  const patterns = config.exclude ?? []
  if (!patterns.length) return { patterns, sources: [] }

  const sources = (config.paths ?? [])
    .map((path) => ({ path, ...summarizeSourceFiles(path, patterns) }))
    .filter((source) => source.excluded > 0)

  return { patterns, sources }
}

const getSourceExclusions = (): SourceExclusions => {
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const value = buildExclusions()
  cached = { expiresAt: Date.now() + CACHE_TTL_MS, value }
  return value
}

const invalidateSourceExclusions = (): void => {
  cached = null
}

export { getSourceExclusions, invalidateSourceExclusions }
