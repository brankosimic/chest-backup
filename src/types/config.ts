type PathSource = {
  type: "path"
  path: string
  isFile?: boolean
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

type ContainerVolumeSource = {
  type: "container-volume"
  containerName: string
  volumePath: string
  include?: string[]
}

type SqliteSource = {
  type: "sqlite"
  path: string
}

type SqliteContainerSource = {
  type: "sqlite-container"
  containerName: string
  dbPath: string
}

type Source = PathSource | PostgresSource | PostgresContainerSource | ContainerVolumeSource | SqliteSource | SqliteContainerSource

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

export type { Config, Source, PathSource, PostgresSource, PostgresContainerSource, ContainerVolumeSource, SqliteSource, SqliteContainerSource, Destination, ParsedConnString, DiscordConfig, NotificationsConfig }
