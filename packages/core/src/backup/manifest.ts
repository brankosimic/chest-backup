import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type { Config } from "../types/config"
import type { DiffResult, FileStat, Manifest, ManifestEntry } from "../types/manifest"
import { logger } from "../utils/logger"

const MANIFEST_DIR = ".chest-manifests"

const manifestPathFor = (config: Config, destId: string): string =>
  join(config.tempDir ?? "/tmp", MANIFEST_DIR, `${destId}.json`)

const loadManifest = (path: string): Manifest => {
  if (!existsSync(path)) return {}
  try {
    const raw = readFileSync(path, "utf8")
    return JSON.parse(raw) as Manifest
  } catch (err) {
    logger.warn({ path, err }, "failed to read manifest, starting fresh")
    return {}
  }
}

const saveManifest = (path: string, manifest: Manifest): void => {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(manifest, null, 2))
}

const statFile = (filePath: string): FileStat | null => {
  try {
    const stats = statSync(filePath)
    if (!stats.isFile()) return null
    return {
      path: filePath,
      relativePath: filePath,
      size: stats.size,
      mtimeMs: stats.mtimeMs,
    }
  } catch (err) {
    logger.debug({ filePath, err }, "failed to stat file")
    return null
  }
}

const buildFileStats = (files: string[]): FileStat[] =>
  files.map((f) => statFile(f)).filter((s): s is FileStat => s !== null)

const computeDiff = (current: FileStat[], manifest: Manifest): DiffResult => {
  const currentPaths = new Set(current.map((f) => f.relativePath))

  const isUnchanged = (file: FileStat): boolean => {
    const prev = manifest[file.relativePath] as ManifestEntry | undefined
    return !!prev && prev.size === file.size && prev.mtimeMs === file.mtimeMs
  }

  const toUpload = current.filter((f) => !isUnchanged(f))
  const unchanged = current.length - toUpload.length
  const toDelete = Object.keys(manifest).filter((p) => !currentPaths.has(p))

  return { toUpload, toDelete, unchanged }
}

const updateManifest = (manifest: Manifest, uploaded: FileStat[]): Manifest => ({
  ...manifest,
  ...Object.fromEntries(uploaded.map((f) => [f.relativePath, { size: f.size, mtimeMs: f.mtimeMs }])),
})

const removeDeletedFromManifest = (manifest: Manifest, deleted: string[]): Manifest => {
  const deletedSet = new Set(deleted)

  return Object.fromEntries(Object.entries(manifest).filter(([key]) => !deletedSet.has(key)))
}

export { loadManifest, saveManifest, manifestPathFor, buildFileStats, computeDiff, updateManifest, removeDeletedFromManifest }
