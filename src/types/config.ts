type PathSource = {
  type: "path"
  path: string
}

type ParsedConnString = {
  host: string
  port: number
  user: string
  password: string
}

type PostgresSource = {
  type: "postgres"
  host: string
  port: number
  user: string
  password: string
  database: string
}

type PostgresContainerSource = {
  type: "postgres-container"
  containerName: string
  user: string
  password: string
  database: string
}

type DockerComposeSource = {
  type: "docker-compose"
  name: string
  path: string
  containers: string[]
  include?: string[]
}

type Source = PathSource | PostgresSource | PostgresContainerSource | DockerComposeSource

interface Destination {
  type: "local" | "sftp"
  name?: string
  path: string
  host?: string
  port?: number
  user?: string
  password?: string
  privateKey?: string
  retention?: number
  parallel?: boolean
  timeout?: number
  skip?: boolean
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
  tempDir?: string
  sources: Source[]
  destinations: Destination[]
  notifications?: NotificationsConfig
}

export type { Config, Source, PathSource, PostgresSource, PostgresContainerSource, DockerComposeSource, Destination, ParsedConnString, DiscordConfig, NotificationsConfig }
