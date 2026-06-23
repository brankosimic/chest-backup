import { Client } from "basic-ftp"
import net from "node:net"
import tls from "node:tls"
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
  const isExplicit = dest.secure === "explicit"

  if (isExplicit) {
    // Explicit TLS (STARTTLS)
    const accessOptions = {
      host: dest.host,
      port: dest.port ?? 21,
      user: dest.user,
      password: dest.password,
      secure: false,
    }
    await client.access(accessOptions as Parameters<Client["access"]>[0])
    await (client as unknown as { startTLS: (opts?: Record<string, unknown>) => Promise<void> }).startTLS(
      dest.secureOptions as Record<string, unknown> ?? { rejectUnauthorized: false },
    )
  } else {
    // Implicit TLS - manual connection to avoid basic-ftp hanging
    const serverSocket = net.createConnection({
      host: dest.host!,
      port: dest.port ?? 21,
    })

    let banner = ""
    await new Promise<void>((resolve, reject) => {
      serverSocket.on("data", (d) => {
        banner += d.toString()
        if (banner.includes("\n")) resolve()
      })
      serverSocket.on("error", reject)
      serverSocket.setTimeout(dest.timeout ?? CLIENT_TIMEOUT_MS, () => reject(new Error("Connection timeout")))
    })

    const tlsSocket = tls.connect({
      socket: serverSocket,
      host: dest.host!,
      rejectUnauthorized: false,
      ...(dest.secureOptions as Record<string, unknown>),
      timeout: dest.timeout ?? CLIENT_TIMEOUT_MS,
    })

    await new Promise<void>((resolve, reject) => {
      tlsSocket.on("secure", () => resolve())
      tlsSocket.on("error", reject)
      tlsSocket.setTimeout(dest.timeout ?? CLIENT_TIMEOUT_MS, () => reject(new Error("TLS handshake timeout")))
    })

    ;(client.ftp as { socket: unknown }).socket = tlsSocket
    disableTlsSessionReuse(client)

    // Authenticate
    await client.login(dest.user!, dest.password!)
  }
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
    try { (client.ftp.socket as { destroy: () => void })?.destroy() } catch {}
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
