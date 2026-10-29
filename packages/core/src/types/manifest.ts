import type SFTPClient from "ssh2-sftp-client"

type SftpFileInfo = Awaited<ReturnType<SFTPClient["list"]>>[number]

interface ManifestEntry {
  size: number
  mtimeMs: number
  digest?: string
}

type Manifest = Record<string, ManifestEntry>

type DigestFn = (filePath: string) => Promise<string | null>

interface FileStat {
  path: string
  relativePath: string
  size: number
  mtimeMs: number
  digest?: string
}

interface DiffResult {
  toUpload: FileStat[]
  toDelete: string[]
  unchanged: number
}

export type { SftpFileInfo, Manifest, ManifestEntry, DigestFn, FileStat, DiffResult }
