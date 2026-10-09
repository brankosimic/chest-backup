import { cp, mkdir, rm } from "node:fs/promises"
import { dirname } from "node:path"
import type { Destination } from "../types/config"
import type { FileStat } from "../types/manifest"
import type { StoreResult } from "../types/index"
import type { DeleteOutcome, FileUploadResult, UploadOutcome } from "../types/destination"
import { UploadOutcomeKind } from "../types/destination"
import { logger } from "../utils/logger"
import { errorCode, partitionByOutcome, speedFrom } from "../utils/upload"
import { mirrorPathFor } from "../utils/mirror"

const copyFile = async (file: FileStat, destDir: string): Promise<void> => {
  const target = mirrorPathFor(destDir, file.path)
  await mkdir(dirname(target), { recursive: true })
  await cp(file.path, target)
}

const uploadFileSafe = async (file: FileStat, destDir: string): Promise<FileUploadResult> => {
  try {
    await copyFile(file, destDir)
    return { path: file.path, outcome: UploadOutcomeKind.Uploaded }
  } catch (err) {
    if (errorCode(err) === "ENOENT") {
      logger.warn({ src: file.path }, "source file vanished before copy, skipping")
      return { path: file.path, outcome: UploadOutcomeKind.Vanished }
    }
    logger.error({ src: file.path, err }, "local copy failed")
    return { path: file.path, outcome: UploadOutcomeKind.Failed }
  }
}

const deleteFileSafe = async (destDir: string, relativePath: string): Promise<string | null> => {
  try {
    await rm(mirrorPathFor(destDir, relativePath))
    return relativePath
  } catch (err) {
    logger.debug({ relativePath, err }, "file not found during incremental cleanup")
    return null
  }
}

const uploadFiles = async (files: FileStat[], destDir: string): Promise<UploadOutcome> => {
  const startTime = Date.now()
  const results = await Promise.all(files.map((f) => uploadFileSafe(f, destDir)))
  const uploadedFiles = results.filter((r) => r.outcome === UploadOutcomeKind.Uploaded).map((r) => r.path)
  const sizeByPath = new Map(files.map((f) => [f.path, f.size]))
  const totalUploaded = uploadedFiles.reduce((acc, path) => acc + (sizeByPath.get(path) ?? 0), 0)

  return { ...partitionByOutcome(results), totalUploaded, totalDuration: Date.now() - startTime }
}

const deleteFiles = async (toDelete: string[], destDir: string): Promise<DeleteOutcome> => {
  const results = await Promise.all(toDelete.map((rel) => deleteFileSafe(destDir, rel)))
  const deleted = results.filter((r): r is string => r !== null)

  return { deleted, failed: toDelete.length - deleted.length }
}

const storeLocalIncremental = async (files: FileStat[], toDelete: string[], dest: Destination): Promise<StoreResult> => {
  const destDir = dest.path
  await mkdir(destDir, { recursive: true })

  const upload = await uploadFiles(files, destDir)
  const removal = await deleteFiles(toDelete, destDir)
  const speed = speedFrom(upload.totalUploaded, upload.totalDuration)

  logger.info(
    { dest: dest.name ?? dest.path, uploaded: upload.uploaded.length, deleted: removal.deleted.length, failed: upload.failed.length },
    "local incremental sync complete",
  )

  return {
    success: upload.failed.length === 0,
    uploaded: upload.uploaded,
    deleted: removal.deleted,
    failedCount: upload.failed.length,
    vanishedCount: upload.vanished.length,
    speed,
  }
}

export { storeLocalIncremental }
