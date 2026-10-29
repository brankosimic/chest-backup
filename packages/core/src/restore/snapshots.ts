import { execFile } from "node:child_process"
import { readdirSync, statSync, mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs"
import { tmpdir, homedir } from "node:os"
import { join } from "node:path"
import SFTPClient from "ssh2-sftp-client"
import { DestinationType, type RestoreSnapshot, type RestoreSnapshotFile } from "@chest-backup/shared"
import type { Destination, RetentionMode } from "../types/config"
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

const walkLocal = (root: string, relative: string, acc: RestoreSnapshotFile[]): void => {
  const entries = readdirSync(join(root, relative), { withFileTypes: true })
  for (const entry of entries) {
    const child = joinRelative(relative, entry.name)
    if (entry.isDirectory()) {
      walkLocal(root, child, acc)
      continue
    }
    if (entry.isFile()) acc.push({ path: child, size: statSync(join(root, child)).size })
  }
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

const listSftpSnapshotKeys = async (sftp: SFTPClient, dest: Destination, mode: RetentionMode): Promise<RestoreSnapshot[]> => {
  const base = normalizeBase(dest.path)
  if (!(await sftp.exists(base))) return []

  const entries = await sftp.list(base)
  return entries
    .filter((entry) => entry.type === "d" && isPeriodKey(mode, entry.name))
    .map((entry) => ({
      key: entry.name,
      fileCount: null,
      totalSize: null,
      ...(entry.modifyTime ? { createdAt: new Date(entry.modifyTime).toISOString() } : {}),
    }))
    .sort((a, b) => b.key.localeCompare(a.key))
}

const SSH_PROBE_TIMEOUT_MS = 5_000
const DEFAULT_SSH_TIMEOUT_MS = 8_000

const writeTempKey = (keyMaterial: string): string | undefined => {
  try {
    const dir = mkdtempSync(join(tmpdir(), "chest-ssh-"))
    const keyPath = join(dir, "id")
    writeFileSync(keyPath, keyMaterial, { mode: 0o600 })
    return keyPath
  } catch {
    return undefined
  }
}

const cleanupTempKey = (keyPath: string | undefined): void => {
  if (!keyPath) return
  try {
    rmSync(keyPath, { recursive: true, force: true })
  } catch (err) {
    logger.warn({ err }, "failed to remove temporary ssh key")
  }
}

const resolveSshKey = (dest: Destination): string | undefined => {
  const key = dest.privateKey
  if (!key) return undefined
  const isPath = key.startsWith("/") || key.startsWith("~")
  try {
    const material = isPath ? readFileSync(key.replace(/^~/, homedir()), "utf8") : key
    return writeTempKey(material)
  } catch {
    return undefined
  }
}

const runRemoteFind = async (dest: Destination, root: string): Promise<RestoreSnapshotFile[]> => {
  const host = dest.host
  const user = dest.user
  if (!host || !user) throw new Error("SFTP destination missing host or user")

  const sshArgs = [
    "-o", "BatchMode=yes",
    "-o", "StrictHostKeyChecking=accept-new",
    "-o", `ConnectTimeout=${String(Math.ceil((dest.timeout ?? DEFAULT_SSH_TIMEOUT_MS) / 1000))}`,
    `-p ${String(dest.port ?? 22)}`,
  ]

  const keyPath = resolveSshKey(dest)
  if (keyPath) sshArgs.push("-i", keyPath)

  try {
    const output = await new Promise<string>((resolvePromise, rejectPromise) => {
      execFile(
        "ssh",
        [...sshArgs, `${user}@${host}`, `find "${root}" -type f -printf '%s\\t%p\\n'`],
        { timeout: (dest.timeout ?? DEFAULT_SSH_TIMEOUT_MS) + SSH_PROBE_TIMEOUT_MS, encoding: "utf8" },
        (err, stdout) => {
          if (err) {
            rejectPromise(new Error(`ssh file listing failed: ${err.message}`))
            return
          }
          resolvePromise(stdout)
        },
      )
    })

    return output
      .split("\n")
      .filter((line) => line.length > 0)
      .map((line) => {
        const tab = line.indexOf("\t")
        const size = Number(line.slice(0, tab))
        const fullPath = line.slice(tab + 1)
        return { path: fullPath.slice(root.length + 1), size: Number.isFinite(size) ? size : 0 }
      })
      .sort((a, b) => a.path.localeCompare(b.path))
  } finally {
    cleanupTempKey(keyPath)
  }
}

const listSnapshots = async (dest: Destination, mode: RetentionMode): Promise<RestoreSnapshot[]> => {
  if (dest.type === DestinationType.Local) return listLocalSnapshots(dest, mode)
  if (!dest.host || !dest.user) throw new Error("SFTP destination missing host or user")

  const sftp = new SFTPClient()
  try {
    await connectClient(sftp, dest)
    return await listSftpSnapshotKeys(sftp, dest, mode)
  } finally {
    await sftp.end().catch((err: unknown) => {
      logger.warn({ err }, "failed to close SFTP connection after snapshot scan")
    })
  }
}

const countSnapshotFiles = async (dest: Destination, periodKey: string): Promise<{ fileCount: number; totalSize: number }> => {
  if (dest.type === DestinationType.Local) {
    const files = localSnapshotFiles(join(normalizeBase(dest.path), periodKey))
    return { fileCount: files.length, totalSize: files.reduce((acc, file) => acc + file.size, 0) }
  }

  const root = `${normalizeBase(dest.path)}/${periodKey}`
  const files = await runRemoteFind(dest, root)
  return { fileCount: files.length, totalSize: files.reduce((acc, file) => acc + file.size, 0) }
}

const listSnapshotFiles = async (dest: Destination, periodKey: string): Promise<RestoreSnapshotFile[]> => {
  assertSnapshotKey(periodKey)

  if (dest.type === DestinationType.Local) {
    return localSnapshotFiles(join(normalizeBase(dest.path), periodKey))
  }

  const root = `${normalizeBase(dest.path)}/${periodKey}`
  return runRemoteFind(dest, root)
}

export { listSnapshots, countSnapshotFiles, listSnapshotFiles, assertSnapshotKey }
