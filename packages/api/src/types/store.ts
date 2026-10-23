import { RetentionMode } from "@core/types/config"
import type { DestinationType, Source } from "@chest-backup/shared"

interface CachedConfig {
  config: ConfigFile
  mtime: number
  raw: string
}

interface ConfigFile {
  schedule?: string
  retention?: number
  retentionMode?: RetentionMode
  tempDir?: string
  paths?: string[]
  sqlite?: string[]
  exclude?: string[]
  sources?: Array<Record<string, unknown>>
  destinations: Array<{
    type: DestinationType
    path: string
    [key: string]: unknown
  }>
  notifications?: {
    discord?: { webhookUrl?: string }
  }
}

enum SourceOrigin {
  Paths = "paths",
  Sqlite = "sqlite",
  Sources = "sources",
}

const FlatSourceType = {
  Path: "path",
  Sqlite: "sqlite",
} as const

interface SourceEntry {
  id: string
  origin: SourceOrigin
  index: number
  item: Record<string, unknown>
}

enum SourceWriteError {
  Duplicate = "duplicate",
  NotFound = "not-found",
}

type SourceWriteResult = { ok: true; source: Source } | { ok: false; error: SourceWriteError }

export {
  FlatSourceType,
  RetentionMode,
  SourceOrigin,
  SourceWriteError,
  type CachedConfig,
  type ConfigFile,
  type SourceEntry,
  type SourceWriteResult,
}