import SFTPClient from "ssh2-sftp-client"
import type { Destination } from "../types/config"
import { logger } from "../utils/logger"
import { connectClient } from "./sftp"
import { backupFiles, selectByCount, selectOlderThanDays } from "../backup/retention"
import { mirrorPathFor, normalizeBase } from "../utils/mirror"

const CHECKSUM_SUFFIX = ".sha256"
const MIN_RETENTION_DAYS = 1

const listRootFiles = async (sftp: SFTPClient, dir: string): Promise<string[]> => {
  const entries = await sftp.list(dir)

  return entries.filter((e) => e.type === "-").map((e) => `${dir}/${e.name}`)
}

const collectRecursive = async (sftp: SFTPClient, dir: string, acc: string[]): Promise<string[]> => {
  const entries = await sftp.list(dir)
  entries.forEach((e) => {
    if (e.type === "-") acc.push(`${dir}/${e.name}`)
  })
  const subdirs = entries.filter((e) => e.type === "d").map((e) => `${dir}/${e.name}`)
  const nested = await Promise.all(subdirs.map((sub) => collectRecursive(sftp, sub, acc)))

  return nested.flat()
}

const collectSafely = async (sftp: SFTPClient, dir: string): Promise<string[]> => {
  try {
    return await collectRecursive(sftp, dir, [])
  } catch (err) {
    logger.debug({ dir, err }, "SFTP retention scan unreadable")
    return []
  }
}

const deleteSftpFile = async (sftp: SFTPClient, file: string): Promise<void> => {
  await sftp.delete(file)
  await sftp.delete(`${file}${CHECKSUM_SUFFIX}`)
  logger.info({ file }, "deleted old backup file via SFTP for retention")
}

const enforceRetentionSftp = async (dest: Destination, globalRetention: number, tempDir: string): Promise<void> => {
  if (!dest.host || !dest.user) return

  const retention = Math.max(dest.retention ?? globalRetention, MIN_RETENTION_DAYS)
  const sftp = new SFTPClient()

  try {
    await connectClient(sftp, dest)

    const base = normalizeBase(dest.path)
    const exists = await sftp.exists(base)
    if (!exists) return

    const [rootFiles, dumpFiles] = await Promise.all([listRootFiles(sftp, base), collectSafely(sftp, mirrorPathFor(base, tempDir))])

    await Promise.all(selectByCount(backupFiles(rootFiles), retention).map((path) => deleteSftpFile(sftp, path)))
    await Promise.all(selectOlderThanDays(backupFiles(dumpFiles), retention).map((path) => deleteSftpFile(sftp, path)))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.warn({ path: dest.path, error: msg }, "SFTP retention failed")
  } finally {
    await sftp.end()
  }
}

export { enforceRetentionSftp }
