import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type { Config } from "../types/config"
import type { DigestFn, DiffResult, FileStat, Manifest, ManifestEntry } from "../types/manifest"
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

// A matching mtime rules a file out cheaply. Digests only run when the metadata
// moved but the size still agrees — which is exactly what dump artefacts do.
const computeDiff = async (current: FileStat[], manifest: Manifest, digestOf: DigestFn): Promise<DiffResult> => {
  const currentPaths = new Set(current.map((f) => f.relativePath))
  const toUpload: FileStat[] = []
  let unchanged = 0

  for (const file of current) {
    const prev = manifest[file.relativePath] as ManifestEntry | undefined
    if (!prev || prev.size !== file.size) {
      toUpload.push(file)
      continue
    }

    const digest = prev.digest ? await digestOf(file.path) : null
    if (prev.mtimeMs === file.mtimeMs || (digest !== null && digest === prev.digest)) {
      unchanged += 1
      continue
    }

    toUpload.push(digest ? { ...file, digest } : file)
  }

  const toDelete = Object.keys(manifest).filter((p) => !currentPaths.has(p))

  return { toUpload, toDelete, unchanged }
}

const updateManifest = (manifest: Manifest, uploaded: FileStat[]): Manifest => ({
  ...manifest,
  ...Object.fromEntries(uploaded.map((f) => [f.relativePath, { size: f.size, mtimeMs: f.mtimeMs, digest: f.digest }])),
})

const removeDeletedFromManifest = (manifest: Manifest, deleted: string[]): Manifest => {
  const deletedSet = new Set(deleted)

  return Object.fromEntries(Object.entries(manifest).filter(([key]) => !deletedSet.has(key)))
}

const stampDigests = async (files: FileStat[], digestOf: DigestFn): Promise<FileStat[]> =>
  Promise.all(
    files.map(async (file) => {
      if (file.digest) return file
      const digest = await digestOf(file.path)
      return digest ? { ...file, digest } : file
    }),
  )

export { loadManifest, saveManifest, manifestPathFor, buildFileStats, computeDiff, stampDigests, updateManifest, removeDeletedFromManifest }
