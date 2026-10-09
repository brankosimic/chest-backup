interface ManifestEntry {
  size: number
  mtimeMs: number
}

type Manifest = Record<string, ManifestEntry>

interface FileStat {
  path: string
  relativePath: string
  size: number
  mtimeMs: number
}

interface DiffResult {
  toUpload: FileStat[]
  toDelete: string[]
  unchanged: number
}

export type { Manifest, ManifestEntry, FileStat, DiffResult }
