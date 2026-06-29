import SFTPClient from "ssh2-sftp-client"
import { readFileSync, statSync } from "node:fs"
import { homedir } from "node:os"
import type { Destination } from "../types/config"
import type { StoreResult, UploadProgress } from "../types/destination"
import { logger } from "../utils/logger"
import { ARCHIVE_PATTERN, parseTimestampFromName } from "../backup/retention"

const connectClient = async (sftp: SFTPClient, dest: Destination): Promise<void> => {
  const config: SFTPClient.ConnectOptions = {
    host: dest.host,
    port: dest.port ?? 22,
    username: dest.user,
    readyTimeout: dest.timeout ?? 2_147_483_647,
  }

  if (dest.password) config.password = dest.password

  if (dest.privateKey) {
    const isPath = dest.privateKey.startsWith("/") || dest.privateKey.startsWith("~")
    const keyPath = isPath ? dest.privateKey.replace(/^~/, homedir()) : null
    config.privateKey = keyPath ? readFileSync(keyPath, "utf8") : dest.privateKey
  }

  await sftp.connect(config)
}

const getLatestChecksumSftp = async (sftp: SFTPClient, dest: Destination): Promise<string | null> => {
  try {
    const files = (await sftp.list(dest.path))
      .map((f) => f.name)
      .filter((f) => ARCHIVE_PATTERN.test(f))

    if (!files.length) return null

    files.sort((a, b) => {
      const tsA = parseTimestampFromName(a)
      const tsB = parseTimestampFromName(b)
      if (!tsA || !tsB) return 0
      return tsB.localeCompare(tsA)
    })

    const latest = files[0]
    if (!latest) return null

    const shaContent = (await sftp.get(`${dest.path.replace(/\/+$/, "")}/${latest}.sha256`)) as string
    const firstLine = shaContent.split("\n")[0] ?? ""
    return firstLine.split(/\s+/)[0] ?? null
  } catch {
    return null
  }
}

const storeSftp = async (
  archivePath: string,
  checksumFile: string | undefined,
  dest: Destination,
): Promise<StoreResult> => {
  if (!dest.host || !dest.user) return { success: false, error: "SFTP destination missing host or user" }

  const sftp = new SFTPClient()

  try {
    await connectClient(sftp, dest)
    await sftp.mkdir(dest.path, true)

    const base = dest.path.replace(/\/+$/, "")
    const archiveName = archivePath.split("/").pop() ?? ""

    const { uploadedSize, durationMs, speed } = await uploadWithProgress(sftp, archivePath, `${base}/${archiveName}`)
    logger.info({ remotePath: `${base}/${archiveName}`, size: uploadedSize, durationMs, speed }, "archive uploaded to SFTP destination")

    let checksumSize = 0
    if (checksumFile) {
      const checksumName = checksumFile.split("/").pop() ?? ""
      const { uploadedSize: csSize } = await uploadWithProgress(sftp, checksumFile, `${base}/${checksumName}`)
      checksumSize = csSize
      logger.info({ remotePath: `${base}/${checksumName}`, size: checksumSize }, "checksum uploaded to SFTP destination")
    }

    return { success: true, speed }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error({ error: msg }, "SFTP upload failed")
    return { success: false, error: msg }
  } finally {
    await sftp.end()
  }
}

const uploadWithProgress = async (
  sftp: SFTPClient,
  filePath: string,
  remotePath: string,
): Promise<UploadProgress> => {
  const fileSize = statSync(filePath).size
  const startTime = Date.now()

  logger.info({ remotePath, size: fileSize }, "Started uploading to SFTP destination")

  await sftp.fastPut(filePath, remotePath, {
    concurrency: 64,
    chunkSize: 262_144,
  })

  const durationMs = Date.now() - startTime
  const speed = durationMs > 0 ? fileSize / (durationMs / 1000) : 0

  return { uploadedSize: fileSize, durationMs, speed }
}

const deleteSftpFile = async (sftp: SFTPClient, base: string, file: string): Promise<void> => {
  await sftp.delete(`${base}/${file}`)
  logger.info({ file }, "deleted old archive via SFTP for retention")
  try {
    await sftp.delete(`${base}/${file}.sha256`)
  } catch {
    logger.debug({ file: `${file}.sha256` }, "checksum file not found for SFTP retention cleanup")
  }
}

const enforceRetentionSftp = async (dest: Destination, archivePrefix: string, globalRetention: number): Promise<void> => {
  if (!dest.host || !dest.user) return

  const retention = dest.retention ?? globalRetention
  const sftp = new SFTPClient()

  try {
    await connectClient(sftp, dest)

    const files = (await sftp.list(dest.path))
      .map((f) => f.name)
      .filter((f) => f.startsWith(archivePrefix) && ARCHIVE_PATTERN.test(f))

    if (files.length <= retention) return

    files.sort((a, b) => {
      const tsA = parseTimestampFromName(a)
      const tsB = parseTimestampFromName(b)
      if (!tsA || !tsB) return 0
      return tsB.localeCompare(tsA)
    })

    const toDelete = files.slice(retention)
    const base = dest.path.replace(/\/+$/, "")

    for (const file of toDelete) {
      await deleteSftpFile(sftp, base, file)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.warn({ path: dest.path, error: msg }, "SFTP retention failed")
  } finally {
    await sftp.end()
  }
}

export { connectClient, getLatestChecksumSftp, storeSftp, enforceRetentionSftp }
