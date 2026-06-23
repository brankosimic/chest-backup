import { Client } from "basic-ftp"
import type { Destination } from "../types/config"
import type { StoreResult } from "../types/index"
import { logger } from "../utils/logger"

const CLIENT_TIMEOUT_MS = 3000

const uploadFile = async (client: Client, localPath: string, remoteDir: string): Promise<void> => {
  const fileName = localPath.split("/").pop()
  if (!fileName) return
  const base = remoteDir.replace(/\/+$/, "")
  await client.uploadFrom(localPath, `${base}/${fileName}`)
}

const createFtpClient = (dest: Destination): Client => {
  const client = new Client(dest.timeout ?? CLIENT_TIMEOUT_MS, { allowSeparateTransferHost: false })
  return client
}

/**
 * Disable TLS session reuse on the FTP control socket.
 * Some FTP servers hang when reusing TLS sessions on the data channel,
 * causing the control socket timeout to fire prematurely.
 */
const disableTlsSessionReuse = (client: Client): void => {
  const socket = client.ftp.socket as unknown as { getSession: () => null }
  socket.getSession = () => null
}

const connectClient = async (client: Client, dest: Destination): Promise<void> => {
  const accessOptions = {
    host: dest.host,
    port: dest.port ?? 21,
    user: dest.user,
    password: dest.password,
    secure: dest.secure ?? false,
    ...(dest.secure && { secureOptions: { rejectUnauthorized: false, ...dest.secureOptions } }),
  }

  await client.access(accessOptions)
  disableTlsSessionReuse(client)
}

/**
 * Upload a checksum file using a fresh FTP client.
 * Some FTP servers don't handle a second data connection on the same control session,
 * so a separate client avoids data-channel conflicts.
 */
const uploadChecksum = async (dest: Destination, checksumFile: string): Promise<void> => {
  const client = createFtpClient(dest)
  try {
    await connectClient(client, dest)
    await client.ensureDir(dest.path)
    await uploadFile(client, checksumFile, dest.path)
    const checksumName = checksumFile.split("/").pop() ?? ""
    logger.info({ remotePath: `${dest.path}/${checksumName}` }, "checksum uploaded to FTP destination")
  } finally {
    client.close()
  }
}

const storeFtp = async (
  archivePath: string,
  checksumFile: string | undefined,
  dest: Destination,
): Promise<StoreResult> => {
  if (!dest.host || !dest.user || !dest.password) return { success: false, error: "FTP destination missing host, user, or password" }

  const client = createFtpClient(dest)
  try {
    await connectClient(client, dest)
    await client.ensureDir(dest.path)
    const archiveName = archivePath.split("/").pop() ?? ""
    await uploadFile(client, archivePath, dest.path)
    logger.info({ remotePath: `${dest.path}/${archiveName}` }, "archive uploaded to FTP destination")
    if (checksumFile) await uploadChecksum(dest, checksumFile)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  } finally {
    try { (client.ftp.socket as { destroy: () => void })?.destroy() } catch {}
    client.close()
  }
}

export { storeFtp }
