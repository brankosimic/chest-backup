import SFTPClient from "ssh2-sftp-client"
import type { Destination } from "../types/config"
import { RetentionMode } from "../types/config"
import { logger } from "../utils/logger"
import { connectClient } from "./sftp"
import { normalizeBase } from "../utils/mirror"
import { isPeriodKey, selectExpiredPeriodKeys } from "../backup/periods"

const MIN_RETENTION_PERIODS = 1

const listPeriodFolders = async (sftp: SFTPClient, base: string, mode: RetentionMode): Promise<string[]> => {
  try {
    const entries = await sftp.list(base)
    return entries.filter((e) => e.type === "d" && isPeriodKey(mode, e.name)).map((e) => e.name)
  } catch (err) {
    logger.debug({ base, err }, "SFTP retention scan unreadable")
    return []
  }
}

const removeTree = async (sftp: SFTPClient, dir: string): Promise<void> => {
  const entries = await sftp.list(dir)
  const files = entries.filter((e) => e.type === "-").map((e) => `${dir}/${e.name}`)
  const dirs = entries.filter((e) => e.type === "d").map((e) => `${dir}/${e.name}`)

  await Promise.all(files.map((f) => sftp.delete(f).catch(() => undefined)))
  for (const sub of dirs) await removeTree(sftp, sub)
  await sftp.rmdir(dir)
}

const removePeriodFolder = async (sftp: SFTPClient, base: string, periodKey: string): Promise<void> => {
  const dir = `${base}/${periodKey}`
  try {
    await removeTree(sftp, dir)
    logger.info({ dir }, "deleted expired snapshot folder via SFTP for retention")
  } catch (err) {
    logger.error({ dir, err }, "failed to delete expired snapshot folder via SFTP")
  }
}

const enforceRetentionSftp = async (
  dest: Destination,
  globalRetention: number,
  mode: RetentionMode,
  periodKey: string,
): Promise<void> => {
  if (!dest.host || !dest.user) return

  if (mode === RetentionMode.Forever) {
    logger.debug({ dest: dest.path, periodKey }, "retention disabled, keeping all snapshot folders")
    return
  }

  const retention = Math.max(globalRetention, MIN_RETENTION_PERIODS)
  const sftp = new SFTPClient()

  try {
    await connectClient(sftp, dest)

    const base = normalizeBase(dest.path)
    const exists = await sftp.exists(base)
    if (!exists) return

    const expired = selectExpiredPeriodKeys(await listPeriodFolders(sftp, base, mode), retention, periodKey, (name) =>
      isPeriodKey(mode, name),
    )
    for (const key of expired) await removePeriodFolder(sftp, base, key)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.warn({ path: dest.path, error: msg }, "SFTP retention failed")
  } finally {
    await sftp.end()
  }
}

export { enforceRetentionSftp }