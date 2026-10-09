import SFTPClient from "ssh2-sftp-client"
import { readFileSync, statSync } from "node:fs"
import { homedir } from "node:os"
import type { Destination } from "../types/config"
import type { FileStat } from "../types/manifest"
import type { DeleteOutcome, FileUploadResult, SftpUsage, UploadContext, UploadOutcome, UploadProgress } from "../types/destination"
import { UploadOutcomeKind } from "../types/destination"
import type { StoreResult } from "../types/index"
import { logger } from "../utils/logger"
import { errorCode, isRetryable, partitionByOutcome, speedFrom } from "../utils/upload"
import { cleanRelativePath, mirrorPathFor, normalizeBase } from "../utils/mirror"

const RETRY_DELAY_MS = 1_000
const MAX_UPLOAD_ATTEMPTS = 3

const makeDestLabel = (dest: Destination): string => {
  if (!dest.host) return dest.path
  return `sftp://${dest.user ?? "unknown"}@${dest.host}:${String(dest.port ?? 22)}${dest.path}`
}

const connectClient = async (sftp: SFTPClient, dest: Destination): Promise<void> => {
  const config: SFTPClient.ConnectOptions = {
    host: dest.host,
    port: dest.port ?? 22,
    username: dest.user,
    readyTimeout: dest.timeout ?? 8_000,
  }

  if (dest.password) config.password = dest.password

  if (dest.privateKey) {
    const isPath = dest.privateKey.startsWith("/") || dest.privateKey.startsWith("~")
    const keyPath = isPath ? dest.privateKey.replace(/^~/, homedir()) : null
    config.privateKey = keyPath ? readFileSync(keyPath, "utf8") : dest.privateKey
  }

  try {
    await sftp.connect(config)
  } catch (err) {
    const msg = err instanceof Error ? err.message || "no details (check host/port/credentials/firewall)" : String(err)
    throw new Error(`SFTP connection to ${makeDestLabel(dest)} failed: ${msg}`, { cause: err })
  }
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const uploadWithProgress = async (sftp: SFTPClient, filePath: string, remotePath: string): Promise<UploadProgress> => {
  const fileSize = statSync(filePath).size
  const startTime = Date.now()

  logger.info({ remotePath, size: fileSize }, "uploading file to SFTP destination")

  await sftp.fastPut(filePath, remotePath, {
    concurrency: 64,
    chunkSize: 262_144,
  })

  const durationMs = Date.now() - startTime

  return { uploadedSize: fileSize, durationMs, speed: durationMs > 0 ? fileSize / (durationMs / 1000) : 0 }
}

const mkdirRecursive = async (sftp: SFTPClient, parts: string[], prefix: string): Promise<void> => {
  if (!parts.length) return
  const [head, ...rest] = parts
  const current = prefix ? `${prefix}/${head}` : `/${head}`
  try {
    await sftp.mkdir(current)
  } catch (err) {
    logger.debug({ dir: current, err }, "directory already exists")
  }
  await mkdirRecursive(sftp, rest, current)
}

const ensureRemoteDir = async (sftp: SFTPClient, remoteDir: string): Promise<void> => {
  const parts = remoteDir.split("/").filter(Boolean)
  await mkdirRecursive(sftp, parts, "")
}

const ensureDirCached = async (ctx: UploadContext, remoteDir: string): Promise<void> => {
  if (ctx.createdDirs.has(remoteDir)) return
  await ensureRemoteDir(ctx.sftp, remoteDir)
  ctx.createdDirs.add(remoteDir)
}

const remoteDirFor = (base: string, relativePath: string): string => {
  const parts = relativePath.split("/")
  parts.pop()
  return [base, ...parts].join("/")
}

const sourceStillExists = (filePath: string): boolean => statSync(filePath, { throwIfNoEntry: false }) !== undefined

const outcomeFromError = (err: unknown, filePath: string): FileUploadResult => {
  const vanished = errorCode(err) === "ENOENT" && !sourceStillExists(filePath)
  if (vanished) {
    logger.warn({ src: filePath }, "source file vanished during SFTP upload, skipping")
    return { path: filePath, outcome: UploadOutcomeKind.Vanished }
  }
  logger.error({ src: filePath, err }, "SFTP upload failed")
  return { path: filePath, outcome: UploadOutcomeKind.Failed }
}

const uploadOneFile = async (ctx: UploadContext, file: FileStat): Promise<FileUploadResult> => {
  const rel = cleanRelativePath(file.relativePath)
  const remotePath = mirrorPathFor(ctx.base, file.relativePath)
  await ensureDirCached(ctx, remoteDirFor(ctx.base, rel))

  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_UPLOAD_ATTEMPTS; attempt++) {
    try {
      await uploadWithProgress(ctx.sftp, file.path, remotePath)
      return { path: file.path, outcome: UploadOutcomeKind.Uploaded }
    } catch (err) {
      lastError = err
      if (!isRetryable(err)) return outcomeFromError(err, file.path)
      if (attempt === MAX_UPLOAD_ATTEMPTS) break
      logger.warn({ src: file.path, attempt }, "retrying SFTP upload after transient error")
      await sleep(RETRY_DELAY_MS * attempt)
    }
  }

  return outcomeFromError(lastError, file.path)
}

const uploadFiles = async (sftp: SFTPClient, files: FileStat[], base: string): Promise<UploadOutcome> => {
  const ctx: UploadContext = { sftp, base, createdDirs: new Set([base]) }
  const results: FileUploadResult[] = []
  const sizeByPath = new Map(files.map((f) => [f.path, f.size]))
  const startTime = Date.now()

  for (const file of files) {
    results.push(await uploadOneFile(ctx, file))
  }

  const { uploaded, failed, vanished } = partitionByOutcome(results)
  const totalUploaded = uploaded.reduce((acc, path) => acc + (sizeByPath.get(path) ?? 0), 0)
  logger.info({ uploaded: uploaded.length, failed: failed.length, vanished: vanished.length }, "SFTP file upload pass complete")

  return { uploaded, failed, vanished, totalUploaded, totalDuration: Date.now() - startTime }
}

const deleteRemoteFile = async (sftp: SFTPClient, base: string, relativePath: string): Promise<string | null> => {
  try {
    await sftp.delete(mirrorPathFor(base, relativePath))
    return relativePath
  } catch (err) {
    logger.debug({ relativePath, err }, "remote file not found during incremental cleanup")
    return null
  }
}

const deleteFiles = async (sftp: SFTPClient, toDelete: string[], base: string): Promise<DeleteOutcome> => {
  const results = await Promise.all(toDelete.map((rel) => deleteRemoteFile(sftp, base, rel)))
  const deleted = results.filter((r): r is string => r !== null)

  return { deleted, failed: toDelete.length - deleted.length }
}

const storeSftpIncremental = async (files: FileStat[], toDelete: string[], dest: Destination): Promise<StoreResult> => {
  if (!dest.host || !dest.user) return { success: false, error: "SFTP destination missing host or user" }

  const sftp = new SFTPClient()

  try {
    await connectClient(sftp, dest)
    await ensureRemoteDir(sftp, dest.path)

    const base = normalizeBase(dest.path)
    const upload = await uploadFiles(sftp, files, base)
    const removal = await deleteFiles(sftp, toDelete, base)
    const speed = speedFrom(upload.totalUploaded, upload.totalDuration)

    logger.info(
      { dest: makeDestLabel(dest), uploaded: upload.uploaded.length, deleted: removal.deleted.length, failed: upload.failed.length },
      "SFTP incremental sync complete",
    )

    return {
      success: upload.failed.length === 0,
      uploaded: upload.uploaded,
      deleted: removal.deleted,
      failedCount: upload.failed.length,
      vanishedCount: upload.vanished.length,
      speed,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message || "no details" : String(err)
    logger.error({ dest: makeDestLabel(dest), error: msg }, "SFTP incremental upload failed")
    return { success: false, error: msg }
  } finally {
    await sftp.end()
  }
}

const walkSftpUsage = async (sftp: SFTPClient, dir: string): Promise<SftpUsage> => {
  const entries = await sftp.list(dir)
  const files = entries.filter((e) => e.type === "-")
  const subdirs = entries.filter((e) => e.type === "d").map((e) => `${dir}/${e.name}`)
  const nested = await Promise.all(subdirs.map((sub) => walkSftpUsage(sftp, sub)))
  const totalSize = files.reduce((acc, f) => acc + f.size, 0) + nested.reduce((acc, u) => acc + u.totalSize, 0)

  return { totalSize, fileCount: files.length + nested.reduce((acc, u) => acc + u.fileCount, 0) }
}

const scanSftpUsage = async (dest: Destination): Promise<SftpUsage | null> => {
  const sftp = new SFTPClient()

  try {
    await connectClient(sftp, dest)
    const base = normalizeBase(dest.path)
    const exists = await sftp.exists(base)
    if (!exists) return { totalSize: 0, fileCount: 0 }
    return await walkSftpUsage(sftp, base)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.warn({ host: dest.host, path: dest.path, error: msg }, "failed to scan SFTP destination")
    return null
  } finally {
    await sftp.end().catch((err: unknown) => {
      logger.warn({ err }, "failed to close SFTP connection during usage scan")
    })
  }
}

export { connectClient, storeSftpIncremental, scanSftpUsage }
