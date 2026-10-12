import type { Config, Destination } from "../types/config"
import type { DiffResult, FileStat, Manifest } from "../types/manifest"
import type { StoreResult } from "../types/index"
import { computeDiff, loadManifest, manifestPathFor, buildFileStats, removeDeletedFromManifest, saveManifest, stampDigests, updateManifest } from "./manifest"
import { digestFile } from "./digest"
import { logger } from "../utils/logger"

interface IncrementalPrep {
  diff: DiffResult
  manifest: Manifest
}

const prepareIncremental = async (config: Config, dest: Destination, files: string[], periodKey: string): Promise<IncrementalPrep> => {
  const current = buildFileStats(files)
  const destId = dest.id ?? dest.path
  const mp = manifestPathFor(config, destId, periodKey)
  const manifest = loadManifest(mp)
  const diff = await computeDiff(current, manifest, digestFile)
  const toUpload = await stampDigests(diff.toUpload, digestFile)

  logger.info(
    { dest: dest.name ?? dest.path, period: periodKey, upload: toUpload.length, delete: diff.toDelete.length, unchanged: diff.unchanged },
    "incremental diff computed",
  )

  return { diff: { ...diff, toUpload }, manifest }
}

const uploadedFrom = (diff: DiffResult, result: StoreResult): FileStat[] => {
  const done = new Set(result.uploaded ?? [])
  return diff.toUpload.filter((f) => done.has(f.path))
}

const persistManifest = (
  config: Config,
  dest: Destination,
  manifest: Manifest,
  uploaded: FileStat[],
  deleted: string[],
  periodKey: string,
): void => {
  const destId = dest.id ?? dest.path
  const mp = manifestPathFor(config, destId, periodKey)
  const next = removeDeletedFromManifest(updateManifest(manifest, uploaded), deleted)
  saveManifest(mp, next)
}

export { prepareIncremental, persistManifest, uploadedFrom }
