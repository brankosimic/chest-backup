import { readdirSync, statSync, type Dirent } from "node:fs"
import { join } from "node:path"
import SFTPClient from "ssh2-sftp-client"
import { DestinationType, type RestoreSnapshot, type RestoreSnapshotFile } from "@chest-backup/shared"
import type { Destination } from "../types/config"
import type { RetentionMode } from "../types/config"
import { connectClient } from "../destinations/sftp"
import { isPeriodKey } from "../backup/periods"
import { normalizeBase } from "../utils/mirror"
import { logger } from "../utils/logger"

const SNAPSHOT_KEY_PATTERN = /^\d{4}-(W\d{2}|\d{2})$/
const SNAPSHOT_DIR_SEPARATOR = "/"

const assertSnapshotKey = (key: string): void => {
  if (!SNAPSHOT_KEY_PATTERN.test(key)) throw new Error(`Invalid snapshot key: ${key}`)
}

const joinRelative = (parent: string, name: string): string =>
  parent ? `${parent}${SNAPSHOT_DIR_SEPARATOR}${name}` : name

const addLocalEntry = (root: string, relative: string, entry: Dirent, acc: RestoreSnapshotFile[]): void => {
  const child = joinRelative(relative, entry.name)
  const full = join(root, child)
  if (entry.isDirectory()) {
    walkLocal(root, child, acc)
    return
  }
  if (entry.isFile()) acc.push({ path: child, size: statSync(full).size })
}

const walkLocal = (root: string, relative: string, acc: RestoreSnapshotFile[]): void => {
  const entries = readdirSync(join(root, relative), { withFileTypes: true })

  for (const entry of entries) addLocalEntry(root, relative, entry, acc)
}

const localSnapshotFiles = (root: string): RestoreSnapshotFile[] => {
  const files: RestoreSnapshotFile[] = []
  walkLocal(root, "", files)
  return files.sort((a, b) => a.path.localeCompare(b.path))
}

const listLocalSnapshots = (dest: Destination, mode: RetentionMode): RestoreSnapshot[] => {
  const base = normalizeBase(dest.path)

  try {
    return readdirSync(base, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && isPeriodKey(mode, entry.name))
      .map((entry) => {
        const root = join(base, entry.name)
        const files = localSnapshotFiles(root)
        return {
          key: entry.name,
          fileCount: files.length,
          totalSize: files.reduce((acc, file) => acc + file.size, 0),
          createdAt: statSync(root).mtime.toISOString(),
        }
      })
      .sort((a, b) => b.key.localeCompare(a.key))
  } catch (err) {
    logger.debug({ path: base, err }, "local snapshot scan unreadable")
    return []
  }
}

type SftpFileInfo = Awaited<ReturnType<SFTPClient["list"]>>[number]

const addSftpEntry = async (sftp: SFTPClient, root: string, relative: string, entry: SftpFileInfo, acc: RestoreSnapshotFile[]): Promise<void> => {
  const child = joinRelative(relative, entry.name)
  if (entry.type === "d") {
    await walkSftp(sftp, root, child, acc)
    return
  }
  if (entry.type === "-") acc.push({ path: child, size: entry.size })
}

const walkSftp = async (sftp: SFTPClient, root: string, relative: string, acc: RestoreSnapshotFile[]): Promise<void> => {
  const entries = await sftp.list(relative ? `${root}/${relative}` : root)

  for (const entry of entries) await addSftpEntry(sftp, root, relative, entry, acc)
}

const sftpSnapshotFiles = async (sftp: SFTPClient, root: string): Promise<RestoreSnapshotFile[]> => {
  const files: RestoreSnapshotFile[] = []
  await walkSftp(sftp, root, "", files)
  return files.sort((a, b) => a.path.localeCompare(b.path))
}

const listSftpSnapshots = async (
  sftp: SFTPClient,
  dest: Destination,
  mode: RetentionMode,
): Promise<RestoreSnapshot[]> => {
  const base = normalizeBase(dest.path)
  if (!(await sftp.exists(base))) return []

  const entries = await sftp.list(base)
  const snapshots = entries.filter((entry) => entry.type === "d" && isPeriodKey(mode, entry.name))

  const result: RestoreSnapshot[] = []
  for (const entry of snapshots) result.push(await snapshotFromEntry(sftp, base, entry))

  return result.sort((a, b) => b.key.localeCompare(a.key))
}

const snapshotFromEntry = async (sftp: SFTPClient, base: string, entry: SftpFileInfo): Promise<RestoreSnapshot> => {
  const root = `${base}/${entry.name}`
  const files = await sftpSnapshotFiles(sftp, root)
  return {
    key: entry.name,
    fileCount: files.length,
    totalSize: files.reduce((acc, file) => acc + file.size, 0),
    ...(entry.modifyTime ? { createdAt: new Date(entry.modifyTime).toISOString() } : {}),
  }
}

const listSnapshots = async (dest: Destination, mode: RetentionMode): Promise<RestoreSnapshot[]> => {
  if (dest.type === DestinationType.Local) return listLocalSnapshots(dest, mode)
  if (!dest.host || !dest.user) throw new Error("SFTP destination missing host or user")

  const sftp = new SFTPClient()
  try {
    await connectClient(sftp, dest)
    return await listSftpSnapshots(sftp, dest, mode)
  } finally {
    await sftp.end().catch((err: unknown) => {
      logger.warn({ err }, "failed to close SFTP connection after snapshot scan")
    })
  }
}

const listSnapshotFiles = async (dest: Destination, periodKey: string): Promise<RestoreSnapshotFile[]> => {
  assertSnapshotKey(periodKey)

  if (dest.type === DestinationType.Local) {
    return localSnapshotFiles(join(normalizeBase(dest.path), periodKey))
  }
  if (!dest.host || !dest.user) throw new Error("SFTP destination missing host or user")

  const sftp = new SFTPClient()
  try {
    await connectClient(sftp, dest)
    const root = `${normalizeBase(dest.path)}/${periodKey}`
    if (!(await sftp.exists(root))) return []
    return await sftpSnapshotFiles(sftp, root)
  } finally {
    await sftp.end().catch((err: unknown) => {
      logger.warn({ err }, "failed to close SFTP connection after snapshot file scan")
    })
  }
}

export { listSnapshots, listSnapshotFiles, assertSnapshotKey }
