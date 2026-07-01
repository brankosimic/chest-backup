interface CachedConfig {
  config: ConfigFile
  mtime: number
  raw: string
}

interface ConfigFile {
  schedule?: string
  retention?: number
  tempDir?: string
  sources: Array<Record<string, unknown>>
  destinations: Array<{
    type: string
    path: string
    [key: string]: unknown
  }>
  notifications?: {
    discord?: { webhookUrl?: string }
  }
}

export type { CachedConfig, ConfigFile }
