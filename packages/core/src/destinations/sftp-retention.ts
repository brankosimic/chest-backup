import SFTPClient from "ssh2-sftp-client"
import type { Destination } from "../types/config"
import { logger } from "../utils/logger"
import { connectClient } from "./sftp"
import { backupFiles, selectByCount } from "../backup/retention"
import { normalizeBase } from "../utils/mirror"

const CHECKSUM_SUFFIX = ".sha256"
const MIN_RETENTION_DAYS = 1

const listRootFiles = async (sftp: SFTPClient, dir: string): Promise<string[]> => {
  const entries = await sftp.list(dir)

  return entries.filter((e) => e.type === "-").map((e) => `${dir}/${e.name}`)
}

const deleteSftpFile = async (sftp: SFTPClient, file: string): Promise<void> => {
  await sftp.delete(file)
  await sftp.delete(`${file}${CHECKSUM_SUFFIX}`)
  logger.info({ file }, "deleted old backup file via SFTP for retention")
}

// Mirrors the local rule: prune legacy whole-archive files at the root by count and
// never age out dump artefacts, since each database now has exactly one copy.
const enforceRetentionSftp = async (dest: Destination, globalRetention: number): Promise<void> => {
  if (!dest.host || !dest.user) return

  const retention = Math.max(dest.retention ?? globalRetention, MIN_RETENTION_DAYS)
  const sftp = new SFTPClient()

  try {
    await connectClient(sftp, dest)

    const base = normalizeBase(dest.path)
    const exists = await sftp.exists(base)
    if (!exists) return

    const rootFiles = await listRootFiles(sftp, base)
    await Promise.all(selectByCount(backupFiles(rootFiles), retention).map((path) => deleteSftpFile(sftp, path)))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.warn({ path: dest.path, error: msg }, "SFTP retention failed")
  } finally {
    await sftp.end()
  }
}

export { enforceRetentionSftp }