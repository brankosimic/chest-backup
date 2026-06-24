interface Source {
  path: string
}

interface Destination {
  type: "local" | "sftp"
  path: string
  host?: string
  port?: number
  user?: string
  password?: string
  privateKey?: string
  retention?: number
  parallel?: boolean
  timeout?: number
}

interface DatabaseConfig {
  type: "host" | "docker"
  database?: string
  connectionString?: string
  containerName?: string
  username?: string
  password?: string
}

interface DiscordConfig {
  webhookUrl: string
}

interface NotificationsConfig {
  discord?: DiscordConfig
}

interface Config {
  schedule?: string
  retention: number
  sources: Source[]
  destinations: Destination[]
  databases?: DatabaseConfig[]
  containers?: string[]
  notifications?: NotificationsConfig
}

export type { Config, Source, Destination, DatabaseConfig, DiscordConfig, NotificationsConfig }
