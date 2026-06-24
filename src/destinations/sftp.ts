import SFTPClient from "ssh2-sftp-client"
import { readFileSync, statSync, createReadStream } from "node:fs"
import { homedir } from "node:os"
import type { Destination } from "../types/config"
import type { StoreResult } from "../types/index"
import { logger } from "../utils/logger"
import { ARCHIVE_PATTERN, parseTimestampFromName } from "../backup/retention"

const connectClient = async (sftp: SFTPClient, dest: Destination): Promise<void> => {
  const config: SFTPClient.ConnectOptions = {
    host: dest.host,
    port: dest.port ?? 22,
    username: dest.user,
    readyTimeout: dest.timeout ?? 10_000,
  }

  if (dest.password) config.password = dest.password

  if (dest.privateKey) {
    const isPath = dest.privateKey.startsWith("/") || dest.privateKey.startsWith("~")
    const keyPath = isPath ? dest.privateKey.replace(/^~/, homedir()) : null
    config.privateKey = keyPath ? readFileSync(keyPath, "utf8") : dest.privateKey
  }

  await sftp.connect(config)
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
): Promise<{ uploadedSize: number; durationMs: number; speed: number }> => {
  const fileSize = statSync(filePath).size
  const startTime = Date.now()
  let uploadedBytes = 0

  const readStream = createReadStream(filePath, { highWaterMark: 1024 * 1024 })
  const writeStream = sftp.createWriteStream(remotePath)

  const progressInterval = setInterval(() => {
    const elapsed = Date.now() - startTime
    const speed = elapsed > 0 ? uploadedBytes / (elapsed / 1000) : 0
    const progress = Math.round((uploadedBytes / fileSize) * 100)
    logger.info({ progress, uploadedBytes, fileSize, speed: Math.round(speed) }, "SFTP upload progress")

    if (uploadedBytes >= fileSize) {
      clearInterval(progressInterval)
    }
  }, 10_000)

  return new Promise((resolve, reject) => {
    let completed = false

    readStream.on("data", (chunk: Buffer) => {
      uploadedBytes += chunk.length
    })

    const cleanup = () => {
      if (completed) return
      completed = true
      clearInterval(progressInterval)
    }

    writeStream.on("error", (err: Error) => {
      cleanup()
      readStream.destroy()
      reject(err)
    })

    writeStream.on("close", () => {
      cleanup()
      const durationMs = Date.now() - startTime
      const speed = durationMs > 0 ? uploadedBytes / (durationMs / 1000) : 0
      resolve({ uploadedSize: uploadedBytes, durationMs, speed })
    })

    readStream.on("end", () => {
      writeStream.end()
    })

    readStream.on("error", (err: Error) => {
      cleanup()
      reject(err)
    })

    readStream.pipe(writeStream)
  })
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
      await sftp.delete(`${base}/${file}`)
      logger.info({ file }, "deleted old archive via SFTP for retention")
      try {
        await sftp.delete(`${base}/${file}.sha256`)
      } catch {
        logger.debug({ file: `${file}.sha256` }, "checksum file not found for SFTP retention cleanup")
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.warn({ path: dest.path, error: msg }, "SFTP retention failed")
  } finally {
    await sftp.end()
  }
}

export { storeSftp, enforceRetentionSftp }
