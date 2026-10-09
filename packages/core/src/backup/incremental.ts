import type { Config, Destination } from "../types/config"
import type { DiffResult, FileStat, Manifest } from "../types/manifest"
import type { StoreResult } from "../types/index"
import { computeDiff, loadManifest, manifestPathFor, buildFileStats, removeDeletedFromManifest, saveManifest, updateManifest } from "./manifest"
import { logger } from "../utils/logger"

interface IncrementalPrep {
  diff: DiffResult
  manifest: Manifest
}

const prepareIncremental = (config: Config, dest: Destination, files: string[]): IncrementalPrep => {
  const current = buildFileStats(files)
  const destId = dest.id ?? dest.path
  const mp = manifestPathFor(config, destId)
  const manifest = loadManifest(mp)
  const diff = computeDiff(current, manifest)

  logger.info(
    { dest: dest.name ?? dest.path, upload: diff.toUpload.length, delete: diff.toDelete.length, unchanged: diff.unchanged },
    "incremental diff computed",
  )

  return { diff, manifest }
}

// Source files may be rotated away (e.g. SQLite WAL) after a successful upload,
// so the diff stats captured before the transfer are the authoritative record.
const uploadedFrom = (diff: DiffResult, result: StoreResult): FileStat[] => {
  const done = new Set(result.uploaded ?? [])
  return diff.toUpload.filter((f) => done.has(f.path))
}

const persistManifest = (config: Config, dest: Destination, manifest: Manifest, uploaded: FileStat[], deleted: string[]): void => {
  const destId = dest.id ?? dest.path
  const mp = manifestPathFor(config, destId)
  const next = removeDeletedFromManifest(updateManifest(manifest, uploaded), deleted)
  saveManifest(mp, next)
}

export { prepareIncremental, persistManifest, uploadedFrom }
