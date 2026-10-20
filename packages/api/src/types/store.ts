import { RetentionMode } from "@core/types/config"

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
  sources?: Array<Record<string, unknown>>
  destinations: Array<{
    type: string
    path: string
    [key: string]: unknown
  }>
  notifications?: {
    discord?: { webhookUrl?: string }
  }
}

export { RetentionMode, type CachedConfig, type ConfigFile }
