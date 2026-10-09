import { readdirSync, rmSync, statSync } from "node:fs"
import { join } from "node:path"
import type { Config } from "../types/config"
import { logger } from "../utils/logger"

const TEMP_ARTIFACT_PREFIXES = ["db-dump-", "sqlite-backup-", "sqlite-container-backup-", "chest-backup-"]
const TEMP_ARTIFACT_EXTENSIONS = [".dump", ".tar.gz", ".tar.gz.sha256", ".db", ".sqlite3", ".txt", ".sha256"]
const MANIFEST_DIR = ".chest-manifests"
const MAX_AGE_HOURS = 48

const isTempArtifact = (name: string): boolean =>
  TEMP_ARTIFACT_PREFIXES.some((prefix) => name.startsWith(prefix)) && TEMP_ARTIFACT_EXTENSIONS.some((ext) => name.endsWith(ext))

const ageHours = (mtimeMs: number): number => (Date.now() - mtimeMs) / 3_600_000

const removeArtifact = (dir: string, name: string): void => {
  try {
    rmSync(join(dir, name))
    logger.info({ file: name }, "removed stale temp artifact")
  } catch (err) {
    logger.error({ file: name, err }, "failed to remove stale temp artifact")
  }
}

const isStale = (name: string, dir: string): boolean => {
  try {
    return ageHours(statSync(join(dir, name)).mtimeMs) > MAX_AGE_HOURS
  } catch (err) {
    logger.debug({ file: name, err }, "failed to stat temp artifact")
    return false
  }
}

const sweepStaleTempFiles = (config: Config): void => {
  const tempDir = config.tempDir ?? "/tmp"

  let entries: string[]
  try {
    entries = readdirSync(tempDir)
  } catch {
    logger.debug({ tempDir }, "temp directory missing, skipping sweep")
    return
  }

  const stale = entries.filter((name) => name !== MANIFEST_DIR && isTempArtifact(name) && isStale(name, tempDir))

  if (!stale.length) return

  logger.info({ tempDir, count: stale.length }, "sweeping stale temp artifacts")
  stale.forEach((name) => {
    removeArtifact(tempDir, name)
  })
}

export { sweepStaleTempFiles }
