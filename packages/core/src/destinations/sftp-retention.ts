import SFTPClient from "ssh2-sftp-client"
import type { Destination } from "../types/config"
import { logger } from "../utils/logger"
import { connectClient } from "./sftp"
import { normalizeBase } from "../utils/mirror"
import { isMonthKey, selectExpiredMonthKeys } from "../backup/months"

const MIN_RETENTION_MONTHS = 1

const listMonthFolders = async (sftp: SFTPClient, base: string): Promise<string[]> => {
  try {
    const entries = await sftp.list(base)
    return entries.filter((e) => e.type === "d" && isMonthKey(e.name)).map((e) => e.name)
  } catch (err) {
    logger.debug({ base, err }, "SFTP retention scan unreadable")
    return []
  }
}

// Deleting over SFTP is bottom-up: files must go before their directories can be
// removed, and children have to be visited before their parent.
const removeTree = async (sftp: SFTPClient, dir: string): Promise<void> => {
  const entries = await sftp.list(dir)
  const files = entries.filter((e) => e.type === "-").map((e) => `${dir}/${e.name}`)
  const dirs = entries.filter((e) => e.type === "d").map((e) => `${dir}/${e.name}`)

  await Promise.all(files.map((f) => sftp.delete(f).catch(() => undefined)))
  for (const sub of dirs) await removeTree(sftp, sub)
  await sftp.rmdir(dir)
}

const removeMonthFolder = async (sftp: SFTPClient, base: string, monthKey: string): Promise<void> => {
  const dir = `${base}/${monthKey}`
  try {
    await removeTree(sftp, dir)
    logger.info({ dir }, "deleted expired month snapshot via SFTP for retention")
  } catch (err) {
    logger.error({ dir, err }, "failed to delete expired month snapshot via SFTP")
  }
}

// Mirrors the local rule: retention counts calendar-month snapshot folders and
// nothing is aged out mid-month.
const enforceRetentionSftp = async (dest: Destination, globalRetention: number, monthKey: string): Promise<void> => {
  if (!dest.host || !dest.user) return

  const retention = Math.max(dest.retention ?? globalRetention, MIN_RETENTION_MONTHS)
  const sftp = new SFTPClient()

  try {
    await connectClient(sftp, dest)

    const base = normalizeBase(dest.path)
    const exists = await sftp.exists(base)
    if (!exists) return

    const expired = selectExpiredMonthKeys(await listMonthFolders(sftp, base), retention, monthKey)
    for (const key of expired) await removeMonthFolder(sftp, base, key)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.warn({ path: dest.path, error: msg }, "SFTP retention failed")
  } finally {
    await sftp.end()
  }
}

export { enforceRetentionSftp }