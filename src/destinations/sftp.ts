import SFTPClient from "ssh2-sftp-client"
import { readFileSync } from "node:fs"
import { homedir } from "node:os"
import type { Destination } from "../types/config"
import type { StoreResult } from "../types/index"
import { logger } from "../utils/logger"

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
    await sftp.put(archivePath, `${base}/${archiveName}`)
    logger.info({ remotePath: `${base}/${archiveName}` }, "archive uploaded to SFTP destination")

    if (checksumFile) {
      const checksumName = checksumFile.split("/").pop() ?? ""
      await sftp.put(checksumFile, `${base}/${checksumName}`)
      logger.info({ remotePath: `${base}/${checksumName}` }, "checksum uploaded to SFTP destination")
    }

    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error({ error: msg }, "SFTP upload failed")
    return { success: false, error: msg }
  } finally {
    await sftp.end()
  }
}

export { storeSftp }
